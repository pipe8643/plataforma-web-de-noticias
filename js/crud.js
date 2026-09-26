/**
 * Administración.
 * La interfaz crea y elimina noticias. app.js decide cómo persistirlas
 * en localStorage sin modificar data/noticias.json.
 */
(function iniciarCrud() {
  const { TechPulse } = window;

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

    function actualizarPreview() {
      if (!preview) return;
      const ruta = TechPulse.imagenSegura(valorSeleccionado(campos.imagen), valorSeleccionado(campos.categoria));
      preview.src = ruta;
      preview.alt = `Vista previa de la ilustración seleccionada`;
    }

    campos.categoria.addEventListener('change', () => {
      const sugerida = TechPulse.imagenPorCategoria(campos.categoria.value);
      if ([...campos.imagen.options].some((opcion) => opcion.value === sugerida)) {
        campos.imagen.value = sugerida;
      }
      actualizarPreview();
    });
    campos.imagen.addEventListener('change', actualizarPreview);
    actualizarPreview();

    function mostrarAviso(texto, esError = false) {
      aviso.hidden = false;
      aviso.textContent = texto;
      aviso.classList.add('banner');
      aviso.classList.toggle('banner-error', esError);
      aviso.focus();
    }

    async function renderizar() {
      const noticias = await TechPulse.cargarCatalogo();
      const conteo = document.getElementById('conteo-admin');
      if (conteo) {
        conteo.textContent = noticias.length === 1
          ? '1 noticia visible en este navegador'
          : `${noticias.length} noticias visibles en este navegador`;
      }

      if (!noticias.length) {
        listado.innerHTML = TechPulse.mensajeEstado('El catálogo local está vacío. Puedes crear una noticia o restablecer la semilla.');
        return;
      }

      listado.innerHTML = noticias.map((noticia) => {
        const imagen = TechPulse.escaparHtml(TechPulse.imagenSegura(noticia.imagen, noticia.categoria));
        const origen = noticia.origen === 'local' ? 'Creada en este navegador' : 'Catálogo base';
        return `
          <article class="admin-item">
            <img src="${imagen}" alt="" width="1200" height="675">
            <div>
              <h3>${TechPulse.escaparHtml(noticia.titulo)}</h3>
              <p>${TechPulse.escaparHtml(noticia.categoria)} · <time datetime="${TechPulse.escaparHtml(noticia.fecha)}">${TechPulse.escaparHtml(TechPulse.formatearFecha(noticia.fecha))}</time></p>
              <span class="origen">${origen}</span>
            </div>
            <button type="button" class="btn btn-danger" data-eliminar="${Number(noticia.id)}">Eliminar</button>
          </article>`;
      }).join('');
    }

    formulario.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      const resultado = TechPulse.crearNoticia({
        titulo: campos.titulo.value,
        descripcion: campos.descripcion.value,
        contenido: campos.contenido.value,
        categoria: campos.categoria.value,
        imagen: campos.imagen.value,
        destacada: campos.destacada.checked
      });

      Object.entries(campos).forEach(([clave, input]) => {
        if (clave === 'destacada' || clave === 'imagen') return;
        TechPulse.mostrarErrorCampo(input, resultado.ok ? '' : (resultado.errores[clave] || ''));
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
      TechPulse.anunciar(aviso.textContent);
      await renderizar();
    });

    listado.addEventListener('click', async (evento) => {
      const boton = evento.target.closest('[data-eliminar]');
      if (!boton) return;
      const id = Number(boton.dataset.eliminar);
      const titulo = boton.closest('.admin-item')?.querySelector('h3')?.textContent || 'esta noticia';
      const confirmar = window.confirm(`¿Eliminar «${titulo}» de este navegador? Si estaba en favoritos, también se quitará de esa lista.`);
      if (!confirmar) return;

      const hecho = TechPulse.eliminarNoticia(id);
      if (!hecho) {
        mostrarAviso('No se pudo eliminar la noticia en este navegador.', true);
        return;
      }
      mostrarAviso('La noticia se ocultó en este navegador. El archivo JSON no cambió.');
      TechPulse.anunciar(aviso.textContent);
      await renderizar();
    });

    document.getElementById('restablecer-catalogo')?.addEventListener('click', async () => {
      const confirmar = window.confirm('¿Restablecer el catálogo de este navegador? Volverán las noticias del JSON y se perderán las creadas o eliminadas aquí. Los favoritos de las noticias base se conservan.');
      if (!confirmar) return;
      const hecho = TechPulse.restablecerCatalogo();
      if (!hecho) {
        mostrarAviso('No se pudo restablecer el catálogo.', true);
        return;
      }
      mostrarAviso('Catálogo restablecido a partir de data/noticias.json.');
      TechPulse.anunciar(aviso.textContent);
      await renderizar();
    });

    renderizar().catch((error) => {
      console.error(error);
      listado.innerHTML = TechPulse.htmlErrorCarga();
    });
  });
})();
