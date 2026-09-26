/**
 * Favoritos.
 * Se guarda solo el id, dentro de un conjunto, para no duplicar noticias.
 * La página de favoritos vuelve a leer el catálogo y descarta ids que ya no existen.
 */
(function iniciarFavoritos() {
  const { TechPulse } = window;

  function obtenerIds() {
    return [...new Set(
      TechPulse.leerLista(TechPulse.CLAVES.favoritos)
        .map(Number)
        .filter((id) => Number.isFinite(id))
    )];
  }

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

  async function renderizarPagina() {
    const contenedor = document.getElementById('lista-favoritos');
    if (!contenedor) return;

    try {
      const catalogo = await TechPulse.cargarCatalogo();
      const ids = obtenerIds();
      const vigentes = catalogo.filter((noticia) => ids.includes(Number(noticia.id)));
      const idsVigentes = vigentes.map((noticia) => Number(noticia.id));

      if (idsVigentes.length !== ids.length) {
        TechPulse.guardarLista(TechPulse.CLAVES.favoritos, idsVigentes);
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

      contenedor.innerHTML = `<div class="card-grid">${vigentes.map((noticia) => TechPulse.crearTarjeta(noticia, 2)).join('')}</div>`;
      pintarFavoritos(contenedor);
    } catch (error) {
      console.error(error);
      contenedor.innerHTML = TechPulse.htmlErrorCarga();
    }
  }

  document.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-favorito]');
    if (!boton) return;

    const id = Number(boton.dataset.favorito);
    if (!Number.isFinite(id)) return;

    const ids = new Set(obtenerIds());
    const activo = !ids.has(id);
    if (activo) ids.add(id);
    else ids.delete(id);

    const guardado = TechPulse.guardarLista(TechPulse.CLAVES.favoritos, [...ids]);
    if (!guardado) {
      TechPulse.anunciar('No se pudo guardar el favorito en este navegador.');
      return;
    }

    pintarFavoritos();
    TechPulse.anunciar(activo ? 'Noticia guardada en favoritos.' : 'Noticia quitada de favoritos.');
    if (document.body.dataset.page === 'favoritos') renderizarPagina();
  });

  TechPulse.pintarFavoritos = pintarFavoritos;

  document.addEventListener('DOMContentLoaded', () => {
    pintarFavoritos();
    renderizarPagina();
  });
})();
