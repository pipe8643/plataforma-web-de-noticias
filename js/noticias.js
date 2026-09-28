/**
 * noticias.js — portada, destacadas y listado.
 *
 * El HTML de inicio y de noticias.html deja cajas vacías.
 * Este archivo pide el catálogo a NewsWave.cargarCatalogo() y escribe las tarjetas ahí.
 * No crea datos: solo decide cuáles noticias mostrar y en qué contenedor.
 */
(function iniciarNoticias() {
  const { NewsWave } = window;

  /**
   * Pinta un grupo de noticias dentro de un contenedor.
   * Si la lista llega vacía, muestra el mensaje que recibió (por ejemplo "No hay destacadas").
   * nivel es 2 o 3 y se lo pasa a crearTarjeta para elegir h2 o h3.
   * Después pide a favoritos.js que marque los corazones que ya estaban guardados.
   */
  function pintar(noticias, contenedor, nivel, mensajeVacio) {
    if (!noticias.length) {
      contenedor.innerHTML = NewsWave.mensajeEstado(mensajeVacio);
      return;
    }
    contenedor.innerHTML = noticias.map((noticia) => NewsWave.crearTarjeta(noticia, nivel)).join('');
    if (typeof NewsWave.pintarFavoritos === 'function') NewsWave.pintarFavoritos(contenedor);
  }

  /**
   * Elige hasta 4 noticias para el hero y la sección destacada.
   * Primero van las que tienen destacada: true. Si no llegan a 4, se completan con el resto.
   * El catálogo ya viene ordenado por fecha, así que "el resto" son las más recientes.
   */
  function seleccionDestacadas(noticias) {
    const marcadas = noticias.filter((noticia) => noticia.destacada === true);
    const resto = noticias.filter((noticia) => !marcadas.includes(noticia));
    return [...marcadas, ...resto].slice(0, 4);
  }

  /** Texto de ?q= en minúsculas. Vacío si el usuario no buscó nada. */
  function textoBusqueda() {
    return (new URLSearchParams(window.location.search).get('q') || '').trim().toLowerCase();
  }

  /** Categoría pedida en la URL, por ejemplo noticias.html?categoria=Hardware. Si no hay, "todas". */
  function categoriaInicial() {
    return new URLSearchParams(window.location.search).get('categoria') || 'todas';
  }

  /** true si el título, la descripción o la categoría contienen el texto buscado. */
  function coincideBusqueda(noticia, texto) {
    if (!texto) return true;
    const bolsa = `${noticia.titulo} ${noticia.descripcion} ${noticia.categoria}`.toLowerCase();
    return bolsa.includes(texto);
  }

  /**
   * Carrusel de la portada. Solo corre si existe #hero-slider (está en index.html).
   * Genera una diapositiva por noticia destacada, flechas y puntos.
   * mostrar() activa una diapositiva y oculta las demás con el atributo hidden.
   */
  function prepararHero(noticias) {
    const raiz = document.getElementById('hero-slider');
    if (!raiz) return;
    const slides = seleccionDestacadas(noticias);
    if (!slides.length) {
      raiz.innerHTML = NewsWave.mensajeEstado('No hay noticias para la portada.');
      return;
    }

    raiz.innerHTML = `
      <div class="hero-viewport">
        ${slides.map((noticia, indice) => {
          const imagen = NewsWave.escaparHtml(NewsWave.imagenSegura(noticia.imagen, noticia.categoria));
          const respaldo = NewsWave.escaparHtml(NewsWave.imagenPorCategoria(noticia.categoria));
          return `
            <article class="hero-slide${indice === 0 ? ' is-active' : ''}" data-slide="${indice}" ${indice === 0 ? '' : 'hidden'}>
              <img src="${imagen}" alt="" data-fallback="${respaldo}">
              <div class="hero-slide-copy">
                <span class="badge badge-${NewsWave.slugCategoria(noticia.categoria)}">${NewsWave.escaparHtml(noticia.categoria)}</span>
                <h1>${NewsWave.escaparHtml(noticia.titulo)}</h1>
                <p>${NewsWave.escaparHtml(noticia.descripcion)}</p>
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

    // El módulo (%) hace que al pasar de la última se vuelva a la primera, y al revés.
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

  /**
   * Filtros del listado (noticias.html).
   * Crea un botón por categoría a partir de las noticias reales, no de una lista fija.
   * Al hacer clic, aplica() deja solo las que coinciden con la categoría y con la búsqueda.
   */
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
      return `<button type="button" class="chip${activo ? ' is-active' : ''}" data-categoria="${NewsWave.escaparHtml(valor)}" aria-pressed="${activo ? 'true' : 'false'}">${NewsWave.escaparHtml(categoria)}</button>`;
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

  /**
   * Al cargar el DOM, mira qué cajas existen en esta página y llena solo esas.
   * index.html tiene hero, destacadas y últimas. noticias.html tiene el listado.
   * Si fetch falla, las tres cajas muestran el mismo mensaje de error.
   */
  document.addEventListener('DOMContentLoaded', async () => {
    const destacadas = document.getElementById('destacadas');
    const listado = document.getElementById('listado-noticias');
    const hero = document.getElementById('hero-slider');
    if (!destacadas && !listado && !hero) return;

    try {
      const noticias = await NewsWave.cargarCatalogo();
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
      const html = NewsWave.htmlErrorCarga();
      if (hero) hero.innerHTML = html;
      if (destacadas) destacadas.innerHTML = html;
      if (listado) listado.innerHTML = html;
    }
  });
})();
