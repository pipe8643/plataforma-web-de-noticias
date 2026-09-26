/**
 * Listado y destacadas.
 * Lee el catálogo ya mezclado (JSON + localStorage) y pinta las cards.
 * No hay tarjetas escritas a mano en el HTML.
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

  function prepararFiltros(noticias) {
    const barra = document.getElementById('filtros-categoria');
    const listado = document.getElementById('listado-noticias');
    const resumen = document.getElementById('resumen-listado');
    if (!barra || !listado) return;

    const categorias = [...new Set(noticias.map((noticia) => noticia.categoria))];
    barra.innerHTML = ['Todas', ...categorias].map((categoria, indice) => {
      const valor = categoria === 'Todas' ? 'todas' : categoria;
      const activo = indice === 0;
      return `<button type="button" class="chip${activo ? ' is-active' : ''}" data-categoria="${TechPulse.escaparHtml(valor)}" aria-pressed="${activo ? 'true' : 'false'}">${TechPulse.escaparHtml(categoria)}</button>`;
    }).join('');

    function aplicar(categoria) {
      const visibles = categoria === 'todas'
        ? noticias
        : noticias.filter((noticia) => noticia.categoria === categoria);
      pintar(visibles, listado, 2, 'No hay noticias en esta categoría.');
      if (resumen) {
        resumen.textContent = visibles.length === 1 ? '1 noticia' : `${visibles.length} noticias`;
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

    aplicar('todas');
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const destacadas = document.getElementById('destacadas');
    const listado = document.getElementById('listado-noticias');
    const totalHero = document.getElementById('hero-total');
    if (!destacadas && !listado && !totalHero) return;

    try {
      const noticias = await TechPulse.cargarCatalogo();
      if (totalHero) totalHero.textContent = String(noticias.length);
      if (destacadas) {
        pintar(
          noticias.filter((noticia) => noticia.destacada === true),
          destacadas,
          3,
          'No hay noticias destacadas. Puedes explorar el catálogo completo.'
        );
      }
      if (listado) prepararFiltros(noticias);
    } catch (error) {
      console.error(error);
      const html = TechPulse.htmlErrorCarga();
      if (destacadas) destacadas.innerHTML = html;
      if (listado) listado.innerHTML = html;
    }
  });
})();
