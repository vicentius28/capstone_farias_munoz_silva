// Función para mostrar una alerta usando SweetAlert
function showAlert(message) {
    Swal.fire({
        title: 'Advertencia',
        text: message,
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#3085d6'
    });
}

var enviado = false;

// Función para deshabilitar ambos formularios y mostrar el loader después de enviar cualquiera de ellos
function aceptarform() {
    var formularios = document.querySelectorAll('.formulario');
    formularios.forEach(function (formulario) {
        formulario.addEventListener('submit', function (event) {
            if (!enviado) {
                enviado = true; // Marcar como enviado
                document.getElementById("loader").style.display = "block";
            }
        });
    });
}

// Mostrar el formulario de observación al hacer clic en "Denegar"
var denegarButtons = document.querySelectorAll('#denegar-btn');
denegarButtons.forEach(function (button) {
    button.addEventListener('click', function () {
        document.getElementById("formulario_observacion").style.display = "block";
    });
});

// Cancelar el formulario de observación al hacer clic en "Cancelar"
var cancelarButtons = document.querySelectorAll('#cancelar-btn');
cancelarButtons.forEach(function (button) {
    button.addEventListener('click', function () {
        document.getElementById("formulario_observacion").style.display = "none";
    });
});

// Enviar el formulario de observación al hacer clic en "Enviar"
var enviarbuttons = document.querySelectorAll('#enviar-btn');
enviarbuttons.forEach(function (button) {
    button.addEventListener('click', function (event) {
        var textarea2 = document.getElementById('denegacion');
        var longitudTexto2 = textarea2.value.length;

        if (longitudTexto2 < 10) {
            event.preventDefault(); // Evitar el envío del formulario si no cumple la validación
            showAlert("Por favor, ingrese al menos 10 caracteres.");
            return;
        }

        document.getElementById("formulario_observacion").style.display = "block";

        if (!enviado) {
            enviado = true; // Marcar como enviado
            document.getElementById("loader").style.display = "block";
        }
    });
});

window.onload = function () {
    aceptarform();
};
