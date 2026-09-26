/**
 * Detalle de una noticia.
 * El id viaja en la URL: detalle.html?id=1
 */
(function iniciarDetalle() {
  const { TechPulse } = window;

  function plantilla(noticia) {
    const parrafos = String(noticia.contenido)
      .split(/\n{2,}/)
      .map((parrafo) => parrafo.trim())
      .filter(Boolean)
      .map((parrafo) => `<p>${TechPulse.escaparHtml(parrafo)}</p>`)
      .join('');
    const id = Number(noticia.id);
    const imagen = TechPulse.escaparHtml(TechPulse.imagenSegura(noticia.imagen, noticia.categoria));
    const respaldo = TechPulse.escaparHtml(TechPulse.imagenPorCategoria(noticia.categoria));

    return `
      <p class="eyebrow"><a href="noticias.html">Noticias</a></p>
      <div class="detalle-media">
        <img src="${imagen}" alt="${TechPulse.escaparHtml(`Ilustración de la noticia: ${noticia.titulo}`)}" width="1200" height="675" data-fallback="${respaldo}">
      </div>
      <div class="detalle-cabecera">
        <span class="badge badge-${TechPulse.slugCategoria(noticia.categoria)}">${TechPulse.escaparHtml(noticia.categoria)}</span>
        <p class="meta"><time datetime="${TechPulse.escaparHtml(noticia.fecha)}">${TechPulse.escaparHtml(TechPulse.formatearFecha(noticia.fecha))}</time></p>
        <h1>${TechPulse.escaparHtml(noticia.titulo)}</h1>
        <p class="lede">${TechPulse.escaparHtml(noticia.descripcion)}</p>
        <div class="detalle-acciones">
          ${TechPulse.botonFavorito(id)}
          <a class="btn btn-secondary" href="noticias.html">Regresar a noticias</a>
        </div>
      </div>
      <div class="detalle-contenido">${parrafos}</div>`;
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const articulo = document.getElementById('detalle-noticia');
    if (!articulo) return;

    const id = Number(TechPulse.obtenerParametro('id'));
    if (!Number.isFinite(id)) {
      articulo.innerHTML = `<div class="estado" role="status"><p>No se indicó una noticia. Vuelve al listado y elige Ver más.</p><p><a class="btn btn-primary" href="noticias.html">Regresar a noticias</a></p></div>`;
      return;
    }

    try {
      const noticias = await TechPulse.cargarCatalogo();
      const noticia = noticias.find((item) => Number(item.id) === id);
      if (!noticia) {
        articulo.innerHTML = `<div class="estado estado-error" role="alert"><p>No encontramos esa noticia. Puede haber sido eliminada en este navegador.</p><p><a class="btn btn-primary" href="noticias.html">Regresar a noticias</a></p></div>`;
        return;
      }
      document.title = `TechPulse | ${noticia.titulo}`;
      articulo.innerHTML = plantilla(noticia);
      if (typeof TechPulse.pintarFavoritos === 'function') TechPulse.pintarFavoritos(articulo);
    } catch (error) {
      console.error(error);
      articulo.innerHTML = TechPulse.htmlErrorCarga();
    }
  });
})();
