/**
 * Portada, destacadas y listado.
 * Las cards salen del catálogo (JSON + cambios locales), no del HTML.
 */
(function iniciarNoticias() {
  const { TechPulse } = window;

  function pintar(noticias, contenedor, nivel, mensajeVacio) {
    if (!noticias.length) {
      contenedor.innerHTML = TechPulse.mensajeEstado(mensajeVacio);
      return;
    }
    contenedor.innerHTML = noticias.map((noticia) => TechPulse.crearTarjeta(noticia, nivel)).join('');
    if (typeof TechPulse.pintarFavoritos === 'function') TechPulse.pintarFavoritos(contenedor);
  }

  function seleccionDestacadas(noticias) {
    const marcadas = noticias.filter((noticia) => noticia.destacada === true);
    const resto = noticias.filter((noticia) => !marcadas.includes(noticia));
    return [...marcadas, ...resto].slice(0, 4);
  }

  function textoBusqueda() {
    return (new URLSearchParams(window.location.search).get('q') || '').trim().toLowerCase();
  }

  function categoriaInicial() {
    return new URLSearchParams(window.location.search).get('categoria') || 'todas';
  }

  function coincideBusqueda(noticia, texto) {
    if (!texto) return true;
    const bolsa = `${noticia.titulo} ${noticia.descripcion} ${noticia.categoria}`.toLowerCase();
    return bolsa.includes(texto);
  }

  function prepararHero(noticias) {
    const raiz = document.getElementById('hero-slider');
    if (!raiz) return;
    const slides = seleccionDestacadas(noticias);
    if (!slides.length) {
      raiz.innerHTML = TechPulse.mensajeEstado('No hay noticias para la portada.');
      return;
    }

    raiz.innerHTML = `
      <div class="hero-viewport">
        ${slides.map((noticia, indice) => {
          const imagen = TechPulse.escaparHtml(TechPulse.imagenSegura(noticia.imagen, noticia.categoria));
          const respaldo = TechPulse.escaparHtml(TechPulse.imagenPorCategoria(noticia.categoria));
          return `
            <article class="hero-slide${indice === 0 ? ' is-active' : ''}" data-slide="${indice}" ${indice === 0 ? '' : 'hidden'}>
              <img src="${imagen}" alt="" data-fallback="${respaldo}">
              <div class="hero-slide-copy">
                <span class="badge badge-${TechPulse.slugCategoria(noticia.categoria)}">${TechPulse.escaparHtml(noticia.categoria)}</span>
                <h1>${TechPulse.escaparHtml(noticia.titulo)}</h1>
                <p>${TechPulse.escaparHtml(noticia.descripcion)}</p>
                <a class="btn btn-primary" href="detalle.html?id=${Number(noticia.id)}">Ver más <span aria-hidden="true">→</span></a>
              </div>
            </article>`;
        }).join('')}
        <button type="button" class="hero-arrow hero-arrow-prev" aria-label="Noticia anterior">‹</button>
        <button type="button" class="hero-arrow hero-arrow-next" aria-label="Noticia siguiente">›</button>
        <div class="hero-dots" role="tablist" aria-label="Noticias de portada">
          ${slides.map((_, indice) => `<button type="button" class="hero-dot${indice === 0 ? ' is-active' : ''}" data-dot="${indice}" aria-label="Mostrar noticia ${indice + 1}"></button>`).join('')}
        </div>
      </div>`;

    const piezas = [...raiz.querySelectorAll('.hero-slide')];
    const puntos = [...raiz.querySelectorAll('.hero-dot')];
    let actual = 0;

    function mostrar(indice) {
      actual = (indice + piezas.length) % piezas.length;
      piezas.forEach((pieza, posicion) => {
        const activa = posicion === actual;
        pieza.classList.toggle('is-active', activa);
        pieza.hidden = !activa;
      });
      puntos.forEach((punto, posicion) => {
        punto.classList.toggle('is-active', posicion === actual);
        if (posicion === actual) punto.setAttribute('aria-current', 'true');
        else punto.removeAttribute('aria-current');
      });
    }

    raiz.querySelector('.hero-arrow-prev').addEventListener('click', () => mostrar(actual - 1));
    raiz.querySelector('.hero-arrow-next').addEventListener('click', () => mostrar(actual + 1));
    puntos.forEach((punto) => {
      punto.addEventListener('click', () => mostrar(Number(punto.dataset.dot)));
    });
  }

  function prepararFiltros(noticias) {
    const barra = document.getElementById('filtros-categoria');
    const listado = document.getElementById('listado-noticias');
    const resumen = document.getElementById('resumen-listado');
    if (!barra || !listado) return;

    const categorias = [...new Set(noticias.map((noticia) => noticia.categoria))];
    const pedida = categoriaInicial();
    const categoriaActiva = categorias.includes(pedida) ? pedida : 'todas';
    const busqueda = textoBusqueda();

    barra.innerHTML = ['Todas', ...categorias].map((categoria) => {
      const valor = categoria === 'Todas' ? 'todas' : categoria;
      const activo = valor === categoriaActiva;
      return `<button type="button" class="chip${activo ? ' is-active' : ''}" data-categoria="${TechPulse.escaparHtml(valor)}" aria-pressed="${activo ? 'true' : 'false'}">${TechPulse.escaparHtml(categoria)}</button>`;
    }).join('');

    function aplicar(categoria) {
      const visibles = noticias.filter((noticia) => {
        const enCategoria = categoria === 'todas' || noticia.categoria === categoria;
        return enCategoria && coincideBusqueda(noticia, busqueda);
      });
      const vacio = busqueda
        ? 'No hay noticias que coincidan con esa búsqueda.'
        : 'No hay noticias en esta categoría.';
      pintar(visibles, listado, 2, vacio);
      if (resumen) {
        const cantidad = visibles.length === 1 ? '1 noticia' : `${visibles.length} noticias`;
        resumen.textContent = busqueda ? `${cantidad} para «${busqueda}»` : cantidad;
      }
    }

    barra.addEventListener('click', (evento) => {
      const chip = evento.target.closest('[data-categoria]');
      if (!chip) return;
      barra.querySelectorAll('.chip').forEach((item) => {
        const activo = item === chip;
        item.classList.toggle('is-active', activo);
        item.setAttribute('aria-pressed', String(activo));
      });
      aplicar(chip.dataset.categoria);
    });

    aplicar(categoriaActiva);
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const destacadas = document.getElementById('destacadas');
    const listado = document.getElementById('listado-noticias');
    const hero = document.getElementById('hero-slider');
    if (!destacadas && !listado && !hero) return;

    try {
      const noticias = await TechPulse.cargarCatalogo();
      if (hero) prepararHero(noticias);
      if (destacadas) {
        pintar(
          seleccionDestacadas(noticias),
          destacadas,
          3,
          'No hay noticias destacadas. Puedes explorar el catálogo completo.'
        );
      }
      const ultimas = document.getElementById('ultimas');
      if (ultimas) {
        const portada = new Set(seleccionDestacadas(noticias).map((noticia) => Number(noticia.id)));
        pintar(
          noticias.filter((noticia) => !portada.has(Number(noticia.id))).slice(0, 4),
          ultimas,
          3,
          'No hay más noticias recientes.'
        );
      }
      if (listado) prepararFiltros(noticias);
    } catch (error) {
      console.error(error);
      const html = TechPulse.htmlErrorCarga();
      if (hero) hero.innerHTML = html;
      if (destacadas) destacadas.innerHTML = html;
      if (listado) listado.innerHTML = html;
    }
  });
})();
