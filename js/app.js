/**
 * TechPulse — capa global.
 * Navegación, catálogo y persistencia local.
 * El JSON es la semilla. Crear y eliminar no reescribe el archivo:
 * esas operaciones viven en localStorage y se mezclan al leer.
 */
(function iniciarTechPulse() {
  const CLAVES = {
    favoritos: 'techpulse_favoritos',
    creadas: 'techpulse_noticias_creadas',
    eliminadas: 'techpulse_noticias_eliminadas'
  };

  const IMAGEN_RESPALDO = 'assets/images/ia-aurora.svg';

  const IMAGEN_POR_CATEGORIA = {
    'Inteligencia Artificial': 'assets/images/ia-aurora.svg',
    Ciberseguridad: 'assets/images/ciber-lumen.svg',
    Hardware: 'assets/images/hw-quartz.svg',
    Software: 'assets/images/sw-orbit.svg',
    Innovación: 'assets/images/inn-cruce.svg',
    'Tendencias digitales': 'assets/images/td-nota.svg'
  };

  function imagenPorCategoria(categoria) {
    return IMAGEN_POR_CATEGORIA[categoria] || IMAGEN_RESPALDO;
  }

  function leerLista(clave) {
    try {
      const crudo = localStorage.getItem(clave);
      if (!crudo) return [];
      const datos = JSON.parse(crudo);
      return Array.isArray(datos) ? datos : [];
    } catch (error) {
      console.error('No se pudo leer localStorage', error);
      return [];
    }
  }

  function guardarLista(clave, valor) {
    try {
      localStorage.setItem(clave, JSON.stringify(valor));
      return true;
    } catch (error) {
      console.error('No se pudo escribir localStorage', error);
      return false;
    }
  }

  function escaparHtml(texto) {
    return String(texto ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatearFecha(iso, estilo = 'long') {
    const fecha = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(fecha.getTime())) return String(iso || '');
    const opciones = estilo === 'short'
      ? { day: '2-digit', month: 'short', year: 'numeric' }
      : { day: 'numeric', month: 'long', year: 'numeric' };
    return new Intl.DateTimeFormat('es-ES', opciones).format(fecha);
  }

  function slugCategoria(nombre) {
    return String(nombre || 'general')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function imagenSegura(ruta, categoria) {
    const valor = String(ruta || '').trim();
    if (valor.startsWith('assets/images/') && !valor.includes('..')) return valor;
    if (/^https?:\/\/[^\s"'<>]+$/i.test(valor)) return valor;
    return imagenPorCategoria(categoria);
  }

  function noticiaValida(noticia) {
    if (!noticia || typeof noticia !== 'object') return false;
    return Number.isFinite(Number(noticia.id))
      && String(noticia.titulo || '').trim()
      && String(noticia.descripcion || '').trim()
      && String(noticia.contenido || '').trim()
      && String(noticia.categoria || '').trim()
      && String(noticia.fecha || '').trim();
  }

  function obtenerParametro(nombre) {
    return new URLSearchParams(window.location.search).get(nombre);
  }

  async function cargarCatalogo() {
    const respuesta = await fetch('data/noticias.json');
    if (!respuesta.ok) {
      throw new Error('No se pudo leer data/noticias.json');
    }
    const base = await respuesta.json();
    if (!Array.isArray(base)) {
      throw new Error('El catálogo JSON no es una lista');
    }

    const eliminadas = new Set(leerLista(CLAVES.eliminadas).map(Number));
    const creadas = leerLista(CLAVES.creadas).filter(noticiaValida);
    const semilla = base.filter(noticiaValida).map((noticia) => ({ ...noticia, origen: 'json' }));
    const locales = creadas
      .filter((noticia) => !eliminadas.has(Number(noticia.id)))
      .map((noticia) => ({ ...noticia, origen: 'local' }));

    return [...semilla, ...locales]
      .filter((noticia) => !eliminadas.has(Number(noticia.id)))
      .sort((a, b) => {
        const porFecha = String(b.fecha).localeCompare(String(a.fecha));
        if (porFecha !== 0) return porFecha;
        return Number(b.id) - Number(a.id);
      });
  }

  function crearNoticia(datos) {
    const errores = {};
    const titulo = String(datos.titulo || '').trim();
    const descripcion = String(datos.descripcion || '').trim();
    const contenido = String(datos.contenido || '').trim();
    const categoria = String(datos.categoria || '').trim();

    if (titulo.length < 4) errores.titulo = 'Escribe un título de al menos 4 caracteres.';
    if (descripcion.length < 10) errores.descripcion = 'Escribe una descripción de al menos 10 caracteres.';
    if (contenido.length < 20) errores.contenido = 'Escribe un contenido de al menos 20 caracteres.';
    if (!Object.prototype.hasOwnProperty.call(IMAGEN_POR_CATEGORIA, categoria)) {
      errores.categoria = 'Elige una categoría de la lista.';
    }

    if (Object.keys(errores).length) return { ok: false, errores };

    const ids = new Set(leerLista(CLAVES.creadas).map((noticia) => Number(noticia.id)));
    let id = Date.now();
    while (ids.has(id)) id += 1;

    const noticia = {
      id,
      titulo,
      descripcion,
      contenido,
      imagen: imagenSegura(datos.imagen, categoria),
      categoria,
      fecha: new Date().toISOString().slice(0, 10),
      destacada: Boolean(datos.destacada)
    };

    const creadas = leerLista(CLAVES.creadas).filter(noticiaValida);
    creadas.push(noticia);
    const guardado = guardarLista(CLAVES.creadas, creadas);
    if (!guardado) {
      return { ok: false, errores: { formulario: 'El navegador no permitió guardar la noticia.' } };
    }
    return { ok: true, noticia };
  }

  function eliminarNoticia(id) {
    const numerico = Number(id);
    if (!Number.isFinite(numerico)) return false;

    const creadas = leerLista(CLAVES.creadas).filter((noticia) => Number(noticia.id) !== numerico);
    const eliminadas = new Set(leerLista(CLAVES.eliminadas).map(Number));
    eliminadas.add(numerico);
    const favoritos = leerLista(CLAVES.favoritos).map(Number).filter((favorito) => favorito !== numerico);

    return guardarLista(CLAVES.creadas, creadas)
      && guardarLista(CLAVES.eliminadas, [...eliminadas])
      && guardarLista(CLAVES.favoritos, favoritos);
  }

  function restablecerCatalogo() {
    try {
      localStorage.removeItem(CLAVES.creadas);
      localStorage.removeItem(CLAVES.eliminadas);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  function iconoFavorito() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" class="icono"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>';
  }

  function botonFavorito(id) {
    return `<button type="button" class="btn btn-ghost btn-favorito" data-favorito="${Number(id)}" aria-pressed="false">${iconoFavorito()}<span class="btn-favorito-texto">Favorito</span></button>`;
  }

  function crearTarjeta(noticia, nivelTitulo = 2) {
    const id = Number(noticia.id);
    const titulo = escaparHtml(noticia.titulo);
    const etiqueta = nivelTitulo === 3 ? 'h3' : 'h2';
    const imagen = escaparHtml(imagenSegura(noticia.imagen, noticia.categoria));
    const respaldo = escaparHtml(imagenPorCategoria(noticia.categoria));

    return `
      <article class="card">
        <div class="card-media">
          <img src="${imagen}" alt="${escaparHtml(`Ilustración de la noticia: ${noticia.titulo}`)}" width="1200" height="675" loading="lazy" decoding="async" data-fallback="${respaldo}">
          <span class="badge badge-${slugCategoria(noticia.categoria)}">${escaparHtml(noticia.categoria)}</span>
          ${botonFavorito(id)}
        </div>
        <div class="card-body">
          <${etiqueta} class="card-title"><a href="detalle.html?id=${id}">${titulo}</a></${etiqueta}>
          <p class="card-text">${escaparHtml(noticia.descripcion)}</p>
          <div class="card-foot">
            <p class="meta"><time datetime="${escaparHtml(noticia.fecha)}">${escaparHtml(formatearFecha(noticia.fecha, 'short'))}</time></p>
            <a class="btn btn-primary btn-ver" href="detalle.html?id=${id}">Ver más <span aria-hidden="true">→</span></a>
          </div>
        </div>
      </article>`;
  }

  function mensajeEstado(texto) {
    return `<p class="estado" role="status">${escaparHtml(texto)}</p>`;
  }

  function htmlErrorCarga() {
    return `<div class="estado estado-error" role="alert"><p>No se pudo cargar el catálogo. Abre TechPulse con un servidor local, como explica el README. Si el archivo se abre directamente, el navegador bloquea la lectura del JSON.</p></div>`;
  }

  function anunciar(mensaje) {
    let zona = document.getElementById('aviso-vivo');
    if (!zona) {
      zona = document.createElement('div');
      zona.id = 'aviso-vivo';
      zona.className = 'sr-only';
      zona.setAttribute('role', 'status');
      zona.setAttribute('aria-live', 'polite');
      document.body.append(zona);
    }
    zona.textContent = '';
    window.setTimeout(() => {
      zona.textContent = mensaje;
    }, 30);
  }

  function mostrarErrorCampo(input, mensaje) {
    const campo = input.closest('.field');
    const error = campo ? campo.querySelector('.field-error') : null;
    if (mensaje) {
      input.setAttribute('aria-invalid', 'true');
      if (campo) campo.classList.add('is-invalid');
      if (error) error.textContent = mensaje;
      return;
    }
    input.removeAttribute('aria-invalid');
    if (campo) campo.classList.remove('is-invalid');
    if (error) error.textContent = '';
  }

  function prepararImagenes() {
    document.addEventListener('error', (evento) => {
      const imagen = evento.target;
      if (!(imagen instanceof HTMLImageElement)) return;
      const respaldo = imagen.dataset.fallback;
      if (!respaldo || imagen.dataset.respaldoAplicado === '1') return;
      imagen.dataset.respaldoAplicado = '1';
      imagen.src = respaldo;
    }, true);
  }

  function iniciarBusqueda() {
    const consulta = new URLSearchParams(window.location.search).get('q');
    if (!consulta) return;
    document.querySelectorAll('input[name="q"]').forEach((campo) => {
      campo.value = consulta;
    });
  }

  function iniciarBoletin() {
    const formulario = document.getElementById('form-boletin');
    if (!formulario) return;
    const correo = formulario.querySelector('#correo-boletin');
    const aviso = document.getElementById('aviso-boletin');
    formulario.addEventListener('submit', (evento) => {
      evento.preventDefault();
      const valor = correo.value.trim();
      const valido = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor);
      if (!valido) {
        mostrarErrorCampo(correo, 'Ingresa un correo electrónico válido.');
        if (aviso) aviso.hidden = true;
        correo.focus();
        return;
      }
      mostrarErrorCampo(correo, '');
      formulario.reset();
      if (aviso) {
        aviso.hidden = false;
        aviso.textContent = 'Suscripción lista en esta demostración. El correo no sale del navegador porque no hay servidor.';
        aviso.focus();
      }
    });
  }

  function iniciarNavegacion() {
    const anio = document.getElementById('anio');
    if (anio) anio.textContent = String(new Date().getFullYear());

    const pagina = document.body.dataset.page;
    const navActivo = pagina === 'detalle' ? 'noticias' : pagina;
    document.querySelectorAll('[data-nav]').forEach((enlace) => {
      if (enlace.dataset.nav === navActivo) enlace.setAttribute('aria-current', 'page');
    });

    const header = document.querySelector('.site-header');
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.getElementById('menu-principal');
    if (!header || !toggle || !menu) return;

    const etiqueta = toggle.querySelector('.sr-only');

    function cerrarMenu() {
      header.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      if (etiqueta) etiqueta.textContent = 'Abrir menú';
    }

    toggle.addEventListener('click', () => {
      const abierto = header.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(abierto));
      if (etiqueta) etiqueta.textContent = abierto ? 'Cerrar menú' : 'Abrir menú';
      if (abierto) {
        const primero = menu.querySelector('a');
        if (primero) primero.focus();
      }
    });

    menu.addEventListener('click', (evento) => {
      if (evento.target.closest('a')) cerrarMenu();
    });

    document.addEventListener('keydown', (evento) => {
      if (evento.key === 'Escape') cerrarMenu();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 980) cerrarMenu();
    });
  }

  prepararImagenes();
    document.addEventListener('DOMContentLoaded', () => {
      iniciarNavegacion();
      iniciarBusqueda();
      iniciarBoletin();
    });

  window.TechPulse = {
    CLAVES,
    leerLista,
    guardarLista,
    escaparHtml,
    formatearFecha,
    slugCategoria,
    imagenSegura,
    imagenPorCategoria,
    obtenerParametro,
    cargarCatalogo,
    crearNoticia,
    eliminarNoticia,
    restablecerCatalogo,
    crearTarjeta,
    botonFavorito,
    mensajeEstado,
    htmlErrorCarga,
    anunciar,
    mostrarErrorCampo
  };
})();
