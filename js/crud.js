/**
 * crud.js — pantalla de Administración.
 *
 * Esta página no guarda en el JSON. Llama a las funciones de app.js,
 * y esas funciones escriben en localStorage. Por eso crear o eliminar
 * solo se ve en este navegador.
 *
 * CRUD aquí es: ver el listado, crear y eliminar. No hay edición de una noticia existente.
 */
(function iniciarCrud() {
  const { NewsWave } = window;

  /** Lee el value de un <select>. Si el select no existe, devuelve cadena vacía. */
  function valorSeleccionado(select) {
    return select ? select.value : '';
  }

  document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.getElementById('form-noticia');
    const listado = document.getElementById('admin-listado');
    if (!formulario || !listado) return;

    const aviso = document.getElementById('aviso-admin');
    const preview = document.getElementById('preview-imagen');
    const campos = {
      titulo: formulario.querySelector('#titulo'),
      descripcion: formulario.querySelector('#descripcion'),
      contenido: formulario.querySelector('#contenido-noticia'),
      categoria: formulario.querySelector('#categoria'),
      imagen: formulario.querySelector('#imagen'),
      destacada: formulario.querySelector('#destacada')
    };

    /** Cambia la miniatura de abajo del formulario según la imagen elegida. */
    function actualizarPreview() {
      if (!preview) return;
      const ruta = NewsWave.imagenSegura(valorSeleccionado(campos.imagen), valorSeleccionado(campos.categoria));
      preview.src = ruta;
      preview.alt = 'Vista previa de la ilustración seleccionada';
    }

    // Al cambiar la categoría, se selecciona sola la ilustración que le corresponde.
    campos.categoria.addEventListener('change', () => {
      const sugerida = NewsWave.imagenPorCategoria(campos.categoria.value);
      if ([...campos.imagen.options].some((opcion) => opcion.value === sugerida)) {
        campos.imagen.value = sugerida;
      }
      actualizarPreview();
    });
    campos.imagen.addEventListener('change', actualizarPreview);
    actualizarPreview();

    /** Banner verde o rojo encima del formulario. esError cambia la clase banner-error. */
    function mostrarAviso(texto, esError = false) {
      aviso.hidden = false;
      aviso.textContent = texto;
      aviso.classList.add('banner');
      aviso.classList.toggle('banner-error', esError);
      aviso.focus();
    }

    /**
     * Vuelve a pintar la lista de la derecha.
     * Cada fila dice si la noticia viene del JSON ("Catálogo base")
     * o si se creó en este navegador ("Creada en este navegador").
     */
    async function renderizar() {
      const noticias = await NewsWave.cargarCatalogo();
      const conteo = document.getElementById('conteo-admin');
      if (conteo) {
        conteo.textContent = noticias.length === 1
          ? '1 noticia visible en este navegador'
          : `${noticias.length} noticias visibles en este navegador`;
      }

      if (!noticias.length) {
        listado.innerHTML = NewsWave.mensajeEstado('El catálogo local está vacío. Puedes crear una noticia o restablecer la semilla.');
        return;
      }

      listado.innerHTML = noticias.map((noticia) => {
        const imagen = NewsWave.escaparHtml(NewsWave.imagenSegura(noticia.imagen, noticia.categoria));
        const origen = noticia.origen === 'local' ? 'Creada en este navegador' : 'Catálogo base';
        return `
          <article class="admin-item">
            <img src="${imagen}" alt="" width="1200" height="675">
            <div>
              <h3>${NewsWave.escaparHtml(noticia.titulo)}</h3>
              <p>${NewsWave.escaparHtml(noticia.categoria)} · <time datetime="${NewsWave.escaparHtml(noticia.fecha)}">${NewsWave.escaparHtml(NewsWave.formatearFecha(noticia.fecha))}</time></p>
              <span class="origen">${origen}</span>
            </div>
            <button type="button" class="btn btn-danger" data-eliminar="${Number(noticia.id)}">Eliminar</button>
          </article>`;
      }).join('');
    }

    formulario.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      const resultado = NewsWave.crearNoticia({
        titulo: campos.titulo.value,
        descripcion: campos.descripcion.value,
        contenido: campos.contenido.value,
        categoria: campos.categoria.value,
        imagen: campos.imagen.value,
        destacada: campos.destacada.checked
      });

      // destacada e imagen no tienen mensaje de error propio; el resto sí.
      Object.entries(campos).forEach(([clave, input]) => {
        if (clave === 'destacada' || clave === 'imagen') return;
        NewsWave.mostrarErrorCampo(input, resultado.ok ? '' : (resultado.errores[clave] || ''));
      });

      if (!resultado.ok) {
        const primerError = Object.keys(resultado.errores)[0];
        if (campos[primerError]) campos[primerError].focus();
        mostrarAviso(resultado.errores.formulario || 'Revisa los campos antes de crear la noticia.', true);
        return;
      }

      formulario.reset();
      campos.imagen.selectedIndex = 0;
      actualizarPreview();
      mostrarAviso(`Noticia creada: «${resultado.noticia.titulo}». Solo se ve en este navegador.`);
      NewsWave.anunciar(aviso.textContent);
      await renderizar();
    });

    // El clic se escucha en la lista, no en cada botón, porque los botones se rehacen en cada renderizar().
    listado.addEventListener('click', async (evento) => {
      const boton = evento.target.closest('[data-eliminar]');
      if (!boton) return;
      const id = Number(boton.dataset.eliminar);
      const titulo = boton.closest('.admin-item')?.querySelector('h3')?.textContent || 'esta noticia';
      const confirmar = window.confirm(`¿Eliminar «${titulo}» de este navegador? Si estaba en favoritos, también se quitará de esa lista.`);
      if (!confirmar) return;

      const hecho = NewsWave.eliminarNoticia(id);
      if (!hecho) {
        mostrarAviso('No se pudo eliminar la noticia en este navegador.', true);
        return;
      }
      mostrarAviso('La noticia se ocultó en este navegador. El archivo JSON no cambió.');
      NewsWave.anunciar(aviso.textContent);
      await renderizar();
    });

    document.getElementById('restablecer-catalogo')?.addEventListener('click', async () => {
      const confirmar = window.confirm('¿Restablecer el catálogo de este navegador? Volverán las noticias del JSON y se perderán las creadas o eliminadas aquí. Los favoritos de las noticias base se conservan.');
      if (!confirmar) return;
      const hecho = NewsWave.restablecerCatalogo();
      if (!hecho) {
        mostrarAviso('No se pudo restablecer el catálogo.', true);
        return;
      }
      mostrarAviso('Catálogo restablecido a partir de data/noticias.json.');
      NewsWave.anunciar(aviso.textContent);
      await renderizar();
    });

    renderizar().catch((error) => {
      console.error(error);
      listado.innerHTML = NewsWave.htmlErrorCarga();
    });
  });
})();
