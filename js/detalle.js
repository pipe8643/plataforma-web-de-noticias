/**
 * detalle.js — una sola noticia.
 *
 * La página detalle.html no trae el texto en el HTML.
 * El id viaja en la URL (detalle.html?id=1). Este archivo lo lee,
 * busca esa noticia en el catálogo y reemplaza el artículo vacío.
 */
(function iniciarDetalle() {
  const { NewsWave } = window;

  /**
   * Convierte el objeto noticia en el HTML del artículo.
   * El contenido del JSON separa párrafos con una línea en blanco (\n\n).
   * Cada párrafo se escapa para que el texto se vea como texto, no como HTML.
   */
  function plantilla(noticia) {
    const parrafos = String(noticia.contenido)
      .split(/\n{2,}/)
      .map((parrafo) => parrafo.trim())
      .filter(Boolean)
      .map((parrafo) => `<p>${NewsWave.escaparHtml(parrafo)}</p>`)
      .join('');
    const id = Number(noticia.id);
    const imagen = NewsWave.escaparHtml(NewsWave.imagenSegura(noticia.imagen, noticia.categoria));
    const respaldo = NewsWave.escaparHtml(NewsWave.imagenPorCategoria(noticia.categoria));

    return `
      <p class="eyebrow"><a href="noticias.html">Noticias</a></p>
      <div class="detalle-media">
        <img src="${imagen}" alt="${NewsWave.escaparHtml(`Ilustración de la noticia: ${noticia.titulo}`)}" width="1200" height="675" data-fallback="${respaldo}">
      </div>
      <div class="detalle-cabecera">
        <span class="badge badge-${NewsWave.slugCategoria(noticia.categoria)}">${NewsWave.escaparHtml(noticia.categoria)}</span>
        <p class="meta"><time datetime="${NewsWave.escaparHtml(noticia.fecha)}">${NewsWave.escaparHtml(NewsWave.formatearFecha(noticia.fecha))}</time></p>
        <h1>${NewsWave.escaparHtml(noticia.titulo)}</h1>
        <p class="lede">${NewsWave.escaparHtml(noticia.descripcion)}</p>
        <div class="detalle-acciones">
          ${NewsWave.botonFavorito(id)}
          <a class="btn btn-secondary" href="noticias.html">Regresar a noticias</a>
        </div>
      </div>
      <div class="detalle-contenido">${parrafos}</div>`;
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const articulo = document.getElementById('detalle-noticia');
    if (!articulo) return;

    // Number("abc") da NaN. Number.isFinite descarta eso y también un id vacío.
    const id = Number(NewsWave.obtenerParametro('id'));
    if (!Number.isFinite(id)) {
      articulo.innerHTML = `<div class="estado" role="status"><p>No se indicó una noticia. Vuelve al listado y elige Ver más.</p><p><a class="btn btn-primary" href="noticias.html">Regresar a noticias</a></p></div>`;
      return;
    }

    try {
      const noticias = await NewsWave.cargarCatalogo();
      const noticia = noticias.find((item) => Number(item.id) === id);
      if (!noticia) {
        articulo.innerHTML = `<div class="estado estado-error" role="alert"><p>No encontramos esa noticia. Puede haber sido eliminada en este navegador.</p><p><a class="btn btn-primary" href="noticias.html">Regresar a noticias</a></p></div>`;
        return;
      }
      document.title = `NewsWave | ${noticia.titulo}`;
      articulo.innerHTML = plantilla(noticia);
      if (typeof NewsWave.pintarFavoritos === 'function') NewsWave.pintarFavoritos(articulo);
    } catch (error) {
      console.error(error);
      articulo.innerHTML = NewsWave.htmlErrorCarga();
    }
  });
})();
