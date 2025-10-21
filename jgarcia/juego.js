var todosLosPersonajes = [];
var cartasDelJuego = [];
var cartasVolteadas = [];
var parejasEncontradas = 0;
var movimientos = 0;
var dificultadActual = "facil";
var estaProcesando = false;
var segundos = 0;
var intervaloCronometro = null;
var cantidadParejas = {
    facil: 8,
    medio: 12,
    dificil: 18
};
var modalVictoria = null;

$(document).ready(function () {
    console.log("La página ya cargó, empezando el juego...");
    modalVictoria = new bootstrap.Modal(document.getElementById("modalVictoria"));
    cargarPersonajes();
    configurarBotones();
});

function cargarPersonajes() {
    console.log("Cargando personajes de Demon Slayer...");
    $("#cargando").show();
    $("#tablero").addClass("d-none");

    var apiUrl = "https://www.demonslayer-api.com/api/v1/characters?limit=50&page=1";
    var proxyUrl = "https://api.allorigins.win/raw?url=" + encodeURIComponent(apiUrl);

    $.ajax({
        url: proxyUrl,
        method: "GET",
        dataType: "json",
        success: function (respuesta) {
            console.log("¡Personajes cargados!");
            console.log("Total de personajes:", respuesta.content.length);
            todosLosPersonajes = respuesta.content;
            todosLosPersonajes = filtrarPersonajesValidos(todosLosPersonajes);
            console.log("Personajes con imagen válida:", todosLosPersonajes.length);
            $("#cargando").hide();
            iniciarJuego();
        },
        error: function (error) {
            console.log("Error al cargar personajes:", error);
            alert("Hubo un error al cargar los personajes. Intenta recargar la página.");
        }
    });
}

function filtrarPersonajesValidos(personajes) {
    var personajesValidos = [];
    var regexImagen = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i;
    for (var i = 0; i < personajes.length; i++) {
        var personaje = personajes[i];
        if (personaje.img && regexImagen.test(personaje.img) && personaje.name) {
            personajesValidos.push(personaje);
        }
    }
    return personajesValidos;
}

function configurarBotones() {
    $(".btn-dificultad").on("click", function () {
        $(".btn-dificultad").removeClass("active");
        $(this).addClass("active");
        dificultadActual = $(this).data("dificultad");
        console.log("Dificultad cambiada a:", dificultadActual);
    });
    $("#btnNuevo").on("click", function () {
        console.log("Iniciando nuevo juego...");
        iniciarJuego();
    });
    $("#btnJugarOtra").on("click", function () {
        modalVictoria.hide();
        iniciarJuego();
    });
}

function iniciarJuego() {
    console.log("=== NUEVO JUEGO ===");
    cartasDelJuego = [];
    cartasVolteadas = [];
    parejasEncontradas = 0;
    movimientos = 0;
    estaProcesando = false;
    segundos = 0;
    if (intervaloCronometro) {
        clearInterval(intervaloCronometro);
    }
    actualizarEstadisticas();
    crearCartas();
    mostrarCartas();
    iniciarCronometro();
}

function crearCartas() {
    var numParejas = cantidadParejas[dificultadActual];
    console.log("Creando", numParejas, "parejas de cartas");
    var personajesMezclados = mezclarArray(todosLosPersonajes.slice());
    var personajesSeleccionados = personajesMezclados.slice(0, numParejas);
    var todasLasCartas = [];
    for (var i = 0; i < personajesSeleccionados.length; i++) {
        var personaje = personajesSeleccionados[i];
        todasLasCartas.push({
            id: i * 2,
            personajeId: personaje.id,
            imagen: personaje.img,
            nombre: personaje.name
        });
        todasLasCartas.push({
            id: i * 2 + 1,
            personajeId: personaje.id,
            imagen: personaje.img,
            nombre: personaje.name
        });
    }
    cartasDelJuego = mezclarArray(todasLasCartas);
    console.log("Total de cartas creadas:", cartasDelJuego.length);
}

function mezclarArray(array) {
    var arrayMezclado = array.slice();
    for (var i = arrayMezclado.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temporal = arrayMezclado[i];
        arrayMezclado[i] = arrayMezclado[j];
        arrayMezclado[j] = temporal;
    }
    return arrayMezclado;
}

function mostrarCartas() {
    $("#tablero").empty();
    $("#tablero").removeClass("facil medio dificil");
    $("#tablero").addClass(dificultadActual);
    for (var i = 0; i < cartasDelJuego.length; i++) {
        var carta = cartasDelJuego[i];
        var htmlCarta = "<div class=\"carta\" data-id=\"" + carta.id + "\" data-personaje=\"" + carta.personajeId + "\">" +
            "<div class=\"cara cara-atras\">🎴</div>" +
            "<div class=\"cara cara-adelante\">" +
            "<img src=\"" + carta.imagen + "\" alt=\"" + carta.nombre + "\">" +
            "</div>" +
            "</div>";
        $("#tablero").append(htmlCarta);
    }
    $("#tablero").off("click", ".carta");
    $("#tablero").on("click", ".carta", function () {
        clickEnCarta($(this));
    });
    $("#tablero").removeClass("d-none");
}

function clickEnCarta(carta) {
    if (estaProcesando) return;
    if (carta.hasClass("volteada")) return;
    if (carta.hasClass("encontrada")) return;
    if (cartasVolteadas.length >= 2) return;
    carta.addClass("volteada");
    cartasVolteadas.push(carta);
    if (cartasVolteadas.length === 2) {
        movimientos = movimientos + 1;
        actualizarEstadisticas();
        verificarPar();
    }
}

function verificarPar() {
    estaProcesando = true;
    var carta1 = cartasVolteadas[0];
    var carta2 = cartasVolteadas[1];
    var personaje1 = carta1.data("personaje");
    var personaje2 = carta2.data("personaje");
    console.log("Comparando cartas:", personaje1, "vs", personaje2);
    if (personaje1 === personaje2) {
        setTimeout(function () {
            parEncontrado(carta1, carta2);
        }, 600);
    } else {
        setTimeout(function () {
            noEsPar(carta1, carta2);
        }, 1000);
    }
}

function parEncontrado(carta1, carta2) {
    carta1.addClass("encontrada");
    carta2.addClass("encontrada");
    parejasEncontradas = parejasEncontradas + 1;
    cartasVolteadas = [];
    estaProcesando = false;
    actualizarEstadisticas();
    var totalParejas = cantidadParejas[dificultadActual];
    if (parejasEncontradas === totalParejas) {
        setTimeout(function () {
            juegoGanado();
        }, 500);
    }
}

function noEsPar(carta1, carta2) {
    carta1.removeClass("volteada");
    carta2.removeClass("volteada");
    cartasVolteadas = [];
    estaProcesando = false;
}

function actualizarEstadisticas() {
    $("#movimientos").text(movimientos);
    var totalParejas = cantidadParejas[dificultadActual];
    $("#parejas").text(parejasEncontradas + "/" + totalParejas);
}

function iniciarCronometro() {
    segundos = 0;
    actualizarCronometro();
    intervaloCronometro = setInterval(function () {
        segundos = segundos + 1;
        actualizarCronometro();
    }, 1000);
}

function actualizarCronometro() {
    var minutos = Math.floor(segundos / 60);
    var segs = segundos % 60;
    var minutosTexto = minutos < 10 ? "0" + minutos : minutos;
    var segsTexto = segs < 10 ? "0" + segs : segs;
    $("#tiempo").text(minutosTexto + ":" + segsTexto);
}

function juegoGanado() {
    console.log("🎉 ¡GANASTE! 🎉");
    clearInterval(intervaloCronometro);
    $("#movimientosFinal").text(movimientos);
    $("#tiempoFinal").text($("#tiempo").text());
    modalVictoria.show();
}

$("#btnValorar").on("click", function () {
    console.log("Ir al formulario...");
    window.location.href = "formulario.html";
});
