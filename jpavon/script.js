$(document).ready(function() {
  // Validar formulario
  $('#registroForm').on('submit', function(e) {
    e.preventDefault();

    let nombre = $('#nombre').val().trim();
    let email = $('#email').val().trim();
    let edad = parseInt($('#edad').val());
    let errores = [];

    if (nombre.length < 3) errores.push("El nombre debe tener al menos 3 caracteres.");
    if (!email.includes('@')) errores.push("El correo no es válido.");
    if (isNaN(edad) || edad < 18) errores.push("Debes ser mayor de edad.");

    if (errores.length > 0) {
      $('#mensaje').text(errores.join(' '));
    } else {
      $('#mensaje').text("¡Registro exitoso!");
    }
  });

  // Función para traer usuarios de una API
  function cargarUsuarios() {
    $.get('https://jsonplaceholder.typicode.com/users', function(data) {
      // data es un array → lo iteramos
      data.forEach(usuario => {
        $('#listaUsuarios').append(`<li>${usuario.name} - ${usuario.email}</li>`);
      });
    });
  }

  cargarUsuarios();
});
