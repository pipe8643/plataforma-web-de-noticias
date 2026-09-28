/**
 * favoritos.js — guardar y quitar noticias.
 *
 * En localStorage solo se guarda el id, dentro de un conjunto, para no repetir la misma noticia.
 * Al pintar la página de favoritos se vuelve a leer el catálogo y se descartan los ids que ya no existen.
 * El clic se escucha en document, no en cada botón: así funcionan los botones que el JS crea después.
 */
(function iniciarFavoritos() {
  const { NewsWave } = window;

  /** Ids numéricos, sin duplicados y sin valores que no sean números. */
  function obtenerIds() {
    return [...new Set(
      NewsWave.leerLista(NewsWave.CLAVES.favoritos)
        .map(Number)
        .filter((id) => Number.isFinite(id))
    )];
  }

  /**
   * Recorre los botones [data-favorito] que haya dentro de raiz
   * y les pone la clase is-active si su id está guardado.
   * raiz puede ser toda la página o solo un bloque recién pintado.
   */
  function pintarFavoritos(raiz = document) {
    const ids = new Set(obtenerIds());
    raiz.querySelectorAll('[data-favorito]').forEach((boton) => {
      const activo = ids.has(Number(boton.dataset.favorito));
      boton.setAttribute('aria-pressed', String(activo));
      boton.classList.toggle('is-active', activo);
      const texto = boton.querySelector('.btn-favorito-texto');
      if (texto) texto.textContent = activo ? 'En favoritos' : 'Favorito';
      boton.setAttribute('aria-label', activo ? 'Quitar de favoritos' : 'Agregar a favoritos');
    });
  }

  /**
   * Solo corre en favoritos.html, donde existe #lista-favoritos.
   * Cruza los ids guardados con el catálogo actual.
   * Si algún id ya no tiene noticia, se borra de localStorage y no se muestra.
   */
  async function renderizarPagina() {
    const contenedor = document.getElementById('lista-favoritos');
    if (!contenedor) return;

    try {
      const catalogo = await NewsWave.cargarCatalogo();
      const ids = obtenerIds();
      const vigentes = catalogo.filter((noticia) => ids.includes(Number(noticia.id)));
      const idsVigentes = vigentes.map((noticia) => Number(noticia.id));

      if (idsVigentes.length !== ids.length) {
        NewsWave.guardarLista(NewsWave.CLAVES.favoritos, idsVigentes);
      }

      if (!vigentes.length) {
        contenedor.innerHTML = `
          <div class="empty-state">
            <h2>Aún no tienes favoritos</h2>
            <p>Guarda una noticia desde el listado o desde su detalle. La selección permanece en este navegador.</p>
            <a class="btn btn-primary" href="noticias.html">Explorar noticias</a>
          </div>`;
        return;
      }

      contenedor.innerHTML = `<div class="card-grid">${vigentes.map((noticia) => NewsWave.crearTarjeta(noticia, 2)).join('')}</div>`;
      pintarFavoritos(contenedor);
    } catch (error) {
      console.error(error);
      contenedor.innerHTML = NewsWave.htmlErrorCarga();
    }
  }

  // Un solo listener para todos los botones de favorito, incluso los que se crean más tarde.
  document.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-favorito]');
    if (!boton) return;

    const id = Number(boton.dataset.favorito);
    if (!Number.isFinite(id)) return;

    const ids = new Set(obtenerIds());
    const activo = !ids.has(id);
    if (activo) ids.add(id);
    else ids.delete(id);

    const guardado = NewsWave.guardarLista(NewsWave.CLAVES.favoritos, [...ids]);
    if (!guardado) {
      NewsWave.anunciar('No se pudo guardar el favorito en este navegador.');
      return;
    }

    pintarFavoritos();
    NewsWave.anunciar(activo ? 'Noticia guardada en favoritos.' : 'Noticia quitada de favoritos.');
    if (document.body.dataset.page === 'favoritos') renderizarPagina();
  });

  // noticias.js y detalle.js llaman esto después de pintar HTML nuevo.
  NewsWave.pintarFavoritos = pintarFavoritos;

  document.addEventListener('DOMContentLoaded', () => {
    pintarFavoritos();
    renderizarPagina();
  });
})();
