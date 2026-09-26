/**
 * Contacto.
 * La validación ocurre en el navegador. No hay envío a un servidor.
 */
(function iniciarContacto() {
  const { TechPulse } = window;
  const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.getElementById('form-contacto');
    if (!formulario) return;

    const confirmacion = document.getElementById('confirmacion-contacto');
    let bloquearOcultar = false;
    const campos = {
      nombre: formulario.querySelector('#nombre'),
      correo: formulario.querySelector('#correo'),
      asunto: formulario.querySelector('#asunto'),
      mensaje: formulario.querySelector('#mensaje')
    };

    function validar() {
      const errores = {};
      if (!campos.nombre.value.trim()) errores.nombre = 'Escribe tu nombre.';
      if (!CORREO.test(campos.correo.value.trim())) errores.correo = 'Ingresa un correo electrónico válido, por ejemplo nombre@correo.com.';
      if (!campos.asunto.value.trim()) errores.asunto = 'Escribe el asunto.';
      if (!campos.mensaje.value.trim()) errores.mensaje = 'Escribe tu mensaje.';
      return errores;
    }

    function pintarErrores(errores) {
      Object.entries(campos).forEach(([clave, input]) => {
        TechPulse.mostrarErrorCampo(input, errores[clave] || '');
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
        TechPulse.anunciar('Revisa los campos del formulario antes de enviarlo.');
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
      TechPulse.anunciar(confirmacion.textContent);
      window.setTimeout(() => {
        bloquearOcultar = false;
      }, 0);
    });

    formulario.addEventListener('input', () => {
      if (bloquearOcultar || confirmacion.hidden) return;
      confirmacion.hidden = true;
    });
  });
})();
