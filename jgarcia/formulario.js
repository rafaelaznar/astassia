var regexNombre = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,50}$/;
var regexEmail = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
var regexEdad = /^([5-9]|[1-9][0-9])$/;
var regexTelefono = /^(\+34)?[6-9][0-9]{8}$/;

function validarCampo(campo, regex, mensajeError) {
    var valor = campo.value.trim();
    var nombreCampo = campo.id.charAt(0).toUpperCase() + campo.id.slice(1);
    var errorDiv = document.getElementById('error' + nombreCampo);

    if (valor === '' && campo.hasAttribute('required')) {
        campo.classList.remove('is-valid');
        campo.classList.add('is-invalid');
        errorDiv.textContent = 'Este campo es obligatorio';
        errorDiv.classList.add('d-block');
        return false;
    }

    if (valor !== '' && !regex.test(valor)) {
        campo.classList.remove('is-valid');
        campo.classList.add('is-invalid');
        errorDiv.textContent = mensajeError;
        errorDiv.classList.add('d-block');
        return false;
    }

    campo.classList.remove('is-invalid');
    campo.classList.add('is-valid');
    errorDiv.classList.remove('d-block');
    return true;
}

$(document).ready(function () {
    $('#nombre').on('blur', function () {
        validarCampo(this, regexNombre, 'El nombre solo puede contener letras (mínimo 3 caracteres)');
    });

    $('#email').on('blur', function () {
        validarCampo(this, regexEmail, 'El email no es válido (ejemplo: usuario@correo.com)');
    });

    $('#edad').on('blur', function () {
        validarCampo(this, regexEdad, 'La edad debe tener numeros, tener mínimo 5 años  y máximo 99');
    });

    $('#edad').on('input', function () {
        this.value = this.value.replace(/[^0-9]/g, '');
    });

    $('#telefono').on('blur', function () {
        if (this.value.trim() !== '') {
            validarCampo(this, regexTelefono, 'El teléfono debe tener 9 dígitos y empezar por 6,7,8 o 9 (opcional: +34 al inicio)');
        } else {
            this.classList.remove('is-invalid', 'is-valid');
        }
    });

    $('#comentario').on('input', function () {
        if (this.value.length > 200) {
            this.value = this.value.substring(0, 200);
        }
    });

    $('#puntuacion').on('change', function () {
        var errorDiv = document.getElementById('errorPuntuacion');
        if (this.value === '') {
            this.classList.add('is-invalid');
            errorDiv.textContent = 'Debes seleccionar una puntuación';
            errorDiv.classList.add('d-block');
        } else {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
            errorDiv.classList.remove('d-block');
        }
    });

    $('#formValoracion').on('submit', function (e) {
        e.preventDefault();

        var nombreValido = validarCampo(document.getElementById('nombre'), regexNombre, 'El nombre solo puede contener letras (mínimo 3 caracteres)');
        var emailValido = validarCampo(document.getElementById('email'), regexEmail, 'El email no es válido (ejemplo: usuario@correo.com)');
        var edadValida = validarCampo(document.getElementById('edad'), regexEdad, 'La edad debe estar entre 5 y 99 años');

        var puntuacion = document.getElementById('puntuacion');
        var puntuacionValida = puntuacion.value !== '';
        if (!puntuacionValida) {
            puntuacion.classList.add('is-invalid');
            document.getElementById('errorPuntuacion').textContent = 'Debes seleccionar una puntuación';
            document.getElementById('errorPuntuacion').classList.add('d-block');
        }

        var telefono = document.getElementById('telefono');
        var telefonoValido = true;
        if (telefono.value.trim() !== '') {
            telefonoValido = validarCampo(telefono, regexTelefono, 'El teléfono debe tener 9 dígitos');
        }

        if (nombreValido && emailValido && edadValida && puntuacionValida && telefonoValido) {
            var datosFormulario = {
                nombre: $('#nombre').val(),
                email: $('#email').val(),
                edad: $('#edad').val(),
                puntuacion: $('#puntuacion').val(),
                comentario: $('#comentario').val(),
                telefono: $('#telefono').val()
            };

            console.log('Datos del formulario:', datosFormulario);

            $('#mensajeExito').fadeIn();

            setTimeout(function () {
                $('#formValoracion')[0].reset();
                $('.form-control, .form-select').removeClass('is-valid is-invalid');
                $('#mensajeExito').fadeOut();
            }, 3000);
        }
    });

    $('#formValoracion').on('reset', function () {
        setTimeout(function () {
            $('.form-control, .form-select').removeClass('is-valid is-invalid');
            $('.invalid-feedback').removeClass('d-block');
            $('#mensajeExito').hide();
        }, 10);
    });
});