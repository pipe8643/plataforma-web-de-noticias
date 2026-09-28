/**
 * contacto.js — formulario de contacto.
 *
 * Valida nombre, correo, asunto y mensaje en el navegador.
 * Si todo es correcto, muestra una confirmación y limpia el formulario.
 * No hay fetch: el mensaje no sale de esta página porque el proyecto no tiene servidor.
 */
(function iniciarContacto() {
  const { NewsWave } = window;
  // Exige algo antes de @, algo después, un punto y al menos dos letras de dominio.
  const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.getElementById('form-contacto');
    if (!formulario) return;

    const confirmacion = document.getElementById('confirmacion-contacto');
    // Evita que el evento "input" del reset() oculte el mensaje de gracias en el mismo instante.
    let bloquearOcultar = false;
    const campos = {
      nombre: formulario.querySelector('#nombre'),
      correo: formulario.querySelector('#correo'),
      asunto: formulario.querySelector('#asunto'),
      mensaje: formulario.querySelector('#mensaje')
    };

    /** Devuelve un objeto con los errores. Si está vacío, el formulario es válido. */
    function validar() {
      const errores = {};
      if (!campos.nombre.value.trim()) errores.nombre = 'Escribe tu nombre.';
      if (!CORREO.test(campos.correo.value.trim())) errores.correo = 'Ingresa un correo electrónico válido, por ejemplo nombre@correo.com.';
      if (!campos.asunto.value.trim()) errores.asunto = 'Escribe el asunto.';
      if (!campos.mensaje.value.trim()) errores.mensaje = 'Escribe tu mensaje.';
      return errores;
    }

    /** Pinta el mensaje de cada campo. Un string vacío limpia el error anterior. */
    function pintarErrores(errores) {
      Object.entries(campos).forEach(([clave, input]) => {
        NewsWave.mostrarErrorCampo(input, errores[clave] || '');
      });
    }

    formulario.addEventListener('submit', (evento) => {
      evento.preventDefault();
      const errores = validar();
      pintarErrores(errores);
      confirmacion.hidden = true;

      const claves = Object.keys(errores);
      if (claves.length) {
        campos[claves[0]].focus();
        NewsWave.anunciar('Revisa los campos del formulario antes de enviarlo.');
        return;
      }

      const nombre = campos.nombre.value.trim();
      const asunto = campos.asunto.value.trim();
      bloquearOcultar = true;
      formulario.reset();
      pintarErrores({});
      confirmacion.hidden = false;
      confirmacion.textContent = `Gracias, ${nombre}. Tu mensaje sobre «${asunto}» quedó validado. Esta entrega no tiene servidor, así que el mensaje no salió del navegador.`;
      confirmacion.focus();
      NewsWave.anunciar(confirmacion.textContent);
      window.setTimeout(() => {
        bloquearOcultar = false;
      }, 0);
    });

    // Si la persona empieza a escribir de nuevo, se oculta el aviso de gracias.
    formulario.addEventListener('input', () => {
      if (bloquearOcultar || confirmacion.hidden) return;
      confirmacion.hidden = true;
    });
  });
})();
