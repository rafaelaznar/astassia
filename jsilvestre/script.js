$(document).ready(function () {

  //  VARIABLES DEL JUEGO
  const frutas = ['🍓', '🍑', '🍍', '🍉', '🍒', '🍋', '🥝', '🍇', '🍈', '🍌', '🍐', '🥭'];
  let cartas = [];
  let cartasVolteadas = [];
  let bloqueado = false;
  let tiempo = 0;
  let temporizador;
  let juegoIniciado = false;
  let dificultad = 'media'; // Valor por defecto
  const playerAvatarGame = document.getElementById("player-avatar-game");

  const $tablero = $('#game-board');
  const $tiempo = $('#time');
  const $ranking = $('#ranking-list');
  const $volverInicio = $('#back-btn'); // Botón volver al inicio

  // FORMULARIO DE BIENVENIDA
  $('#player-form').on('submit', function (e) {
    e.preventDefault();

    const nombre = $('#player-name').val().trim();
    dificultad = $('#difficulty').val();
    const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,10}$/; // Expresión regular 

    // Validar nombre
    if (!regex.test(nombre)) {
      $('#form-msg')
        .text('⚠️ Introduce un nombre válido (sólamente letras, mínimo 2 - máximo 10).')
        .css('color', '#ff4d6d');
      return;
    }

    // Guardar datos del jugador
    sessionStorage.setItem('nombreJugador', nombre);
    sessionStorage.setItem('dificultad', dificultad);

    // Desaparece formulario + aparece la información y el juego
    $('#form-msg')
      .text('¡Hola ' + nombre + '! 🍓 Has elegido modo ' + dificultad.toUpperCase() + '.')
      .css('color', '#ff7eb9');

    setTimeout(function () {
      $('#player-form').addClass('fade-out');
      setTimeout(function () {
        $('#player-form').hide();
        $('.info, .game-board, .ranking, .volver-inicio').addClass('fade-in').fadeIn(600);
      }, 200);
    }, 600);
  });

  // BARAJAR CARTAS
  function barajar(array) {
    return array.sort(function () { return Math.random() - 0.5; });
  }

  // GENERAR CARTAS SEGÚN DIFICULTAD
  function generarCartas() {
    var numParejas;

    // Ajustar número de parejas según dificultad
    if (dificultad === 'facil') {
      numParejas = 4;
      $tablero.css('grid-template-columns', 'repeat(4, 1fr)');
    } else if (dificultad === 'media') {
      numParejas = 8;
      $tablero.css('grid-template-columns', 'repeat(4, 1fr)');
    } else {
      numParejas = 12;
      $tablero.css('grid-template-columns', 'repeat(6, 1fr)');
    }

    // Generar las cartas
    var seleccion = frutas.slice(0, numParejas);
    cartas = barajar(seleccion.concat(seleccion));

    // Mostrar las cartas en el tablero de juego
    $tablero.empty();
    $.each(cartas, function (index, fruta) {
      var $carta = $('<div class="card" data-fruta="' + fruta + '" data-index="' + index + '">' +
        '<div class="cara frente">' + fruta + '</div>' +
        '<div class="cara dorso">🍪</div>' +
        '</div>');
      $tablero.append($carta);
    });
  }

  // TIEMPO DE JUEGO
  function iniciarTiempo() {
    tiempo = 0;
    $tiempo.text(tiempo.toFixed(1));
    temporizador = setInterval(function () {
      tiempo += 0.1;
      $tiempo.text(tiempo.toFixed(1));
    }, 100);
  }

  // PARAR TIEMPO DE JUEGO
  function detenerTiempo() {
    clearInterval(temporizador);
  }

  // EMPEZAR JUEGO CON BOTÓN
  $('#start-btn').on('click', function () {
    $('.info, .game-board, .ranking, .volver-inicio').fadeIn(400).show();
    generarCartas();
    cartasVolteadas = [];
    bloqueado = false;
    juegoIniciado = true;
    detenerTiempo();
    iniciarTiempo();
  });

  // GIRAR LAS CARTAS 
  $tablero.on('click', '.card', function () {
    if (bloqueado || !juegoIniciado) return;

    var $carta = $(this);
    if ($carta.hasClass('flipped')) return;

    $carta.addClass('flipped');
    cartasVolteadas.push($carta);

    // Si hay dos cartas volteadas, usamos comprobarPareja(); para ver si coinciden
    if (cartasVolteadas.length === 2) {
      comprobarPareja();
    }
  });

  // COMPROBAR PAREJA DE CARTAS
  function comprobarPareja() {
    bloqueado = true;
    var $c1 = cartasVolteadas[0];
    var $c2 = cartasVolteadas[1];
    var fruta1 = $c1.data('fruta');
    var fruta2 = $c2.data('fruta');

    setTimeout(function () {
      if (fruta1 === fruta2) {
        $c1.addClass('acertada');
        $c2.addClass('acertada');

        setTimeout(function () {
          $c1.removeClass('acertada');
          $c2.removeClass('acertada');
        }, 1000);

        cartasVolteadas = [];
        bloqueado = false;

        // Comprobar si se han encontrado todas las parejas
        if ($('.card.flipped').length === cartas.length) {
          detenerTiempo();
          var nombre = sessionStorage.getItem('nombreJugador') || 'Anónimo';
          guardarTiempo(nombre, tiempo);
          mostrarRanking();
          juegoIniciado = false;
        }
      } else { // No coinciden
        setTimeout(function () {
          $c1.removeClass('flipped');
          $c2.removeClass('flipped');
          cartasVolteadas = [];
          bloqueado = false;
        }, 500);
      }
    }, 400);
  }

  // RANKING DEL JUEGO
  // GUARDAR TIEMPO (ranking separado por dificultad)
  function guardarTiempo(nombre, segundos) {
    // Leer ranking general o crear nuevo
    var ranking = JSON.parse(sessionStorage.getItem('treatzRanking')) || {
      facil: [],
      media: [],
      dificil: []
    };

    // Asegurar estructura (por si venía vieja)
    ranking.facil = ranking.facil || [];
    ranking.media = ranking.media || [];
    ranking.dificil = ranking.dificil || [];

    // Añadir y ordenar dentro de su dificultad
    ranking[dificultad].push({ nombre: nombre, tiempo: segundos.toFixed(1) });
    ranking[dificultad].sort(function (a, b) { return a.tiempo - b.tiempo; });
    ranking[dificultad] = ranking[dificultad].slice(0, 5);

    // Guardar en SESSSION
    sessionStorage.setItem('treatzRanking', JSON.stringify(ranking));
  }

  // MOSTRAR RANKING (dividido por dificultad)
  function mostrarRanking() {
    var ranking = JSON.parse(sessionStorage.getItem('treatzRanking')) || {
      facil: [],
      media: [],
      dificil: []
    };

    // Limpia lista
    $('#ranking-facil ul, #ranking-media ul, #ranking-dificil ul').empty();

    // Función interna para vercada bloque
    function renderLista(dif, lista) {
      var $ul = $('#ranking-' + dif + ' ul');
      if (lista.length === 0) {
        $ul.append('<li>Aún no hay récords 🍬</li>');
      } else {
        $.each(lista, function (i, jugador) {
          $ul.append(
            '<li>' +
              (i + 1) + '. <strong>' + jugador.nombre + '</strong> — ' +
              jugador.tiempo + 's' +
            '</li>'
          );
        });
      }
    }

    renderLista('facil', ranking.facil);
    renderLista('media', ranking.media);
    renderLista('dificil', ranking.dificil);

    // Se miestra después de ganar el juego
    $('.ranking').fadeIn(600);
  }

  // Esto es para que al cargar la página inicialmente no se vea el ranking
  $('.ranking').hide();


  // ELECCIÓN Y APLICACIÓN DE TEMA
  var $themeSelect = $('#theme');
  var temaGuardado = sessionStorage.getItem('treatzTheme') || 'pastel';
  aplicarTema(temaGuardado);
  $themeSelect.val(temaGuardado);

  // Cambiar tema al seleccionar otro
  $themeSelect.on('change', function () {
    var nuevoTema = $(this).val();
    aplicarTema(nuevoTema);
    sessionStorage.setItem('treatzTheme', nuevoTema);
  });

  // FONDO ANIMADO DE FRUTAS
  function crearFondoFrutas() {
    if ($('.frutas-fondo').length) $('.frutas-fondo').remove();

    var $fondo = $('<div class="frutas-fondo"></div>');
    $('body').append($fondo);

    var fondoFruit = ['🍓', '🍒', '🍋', '🍉', '🍇', '🍑', '🍍', '🍌'];
    var fondoForest = ['🌳', '🍄', '🐿️', '🦋', '🦉', '🌿', '🍃', '🌼'];
    var fondoOcean = ['🐚', '🐠', '🪼', '🪸', '🦀', '🐬', '🐙', '🐡'];

    var conjunto = fondoFruit;
    var tema = $('body').attr('class');

    if (tema.indexOf('theme-forest') !== -1) conjunto = fondoForest;
    if (tema.indexOf('theme-ocean') !== -1) conjunto = fondoOcean;

    // Bucle para crear muchas frutas
    for (var i = 0; i < 18; i++) {
      var emoji = conjunto[Math.floor(Math.random() * conjunto.length)];
      var left = Math.random() * 100;
      var size = 1 + Math.random() * 2.5;
      var delay = Math.random() * 10;
      var duracion = 8 + Math.random() * 12;

      // Crear el elemento fruta y aplicarle estilos
      var $fruta = $('<div class="fruta"></div>').text(emoji).css({
        left: left + '%',
        fontSize: size + 'rem',
        animationDelay: delay + 's',
        animationDuration: duracion + 's'
      });

      // Añadimos la fruta al fondo
      $fondo.append($fruta);
    }
  }

  // Aplicar tema seleccionado
  function aplicarTema(tema) {
    $('body')
      .removeClass('theme-pastel theme-forest theme-ocean')
      .addClass('theme-' + tema);
    crearFondoFrutas();
  }

  // VOLVER AL INICIO DE JUEGO
  $volverInicio.on('click', function () {
    detenerTiempo();
    juegoIniciado = false;
    $tablero.empty();
    $tiempo.text('0.0');
    $('#difficulty').val('media');
    dificultad = 'media';

    $('.info, .game-board, .ranking, .volver-inicio')
      .fadeOut(400, function () {
        $('#player-form').fadeIn(600);
        $('#form-msg').text('');
        $('#player-name').val('');
      });
  });

}); 








