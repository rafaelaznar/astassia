// variables que voy a usar
var todasLasCanciones = [];
var cancionesDelJuego = [];
var cancionesCorrectas = [];
var albumActual = null;
var juegoTerminado = false;

// nombres de los albums
var nombres = {
    '1': "1989",
    '2': "Taylor Swift",
    '3': "Fearless",
    '4': "Speak Now",
    '5': "Red",
    '6': "Reputation",
    '7': "Lover",
    '8': "Folklore",
    '9': "Evermore",
    '10': "Midnights",
    '11': "The Tortured Poets Department"
};

// colores para cada album
var coloresFondo = {
    '1': 'linear-gradient(135deg, #89CFF0 0%, #5DADE2 100%)',
    '2': 'linear-gradient(135deg, #7FCD91 0%, #52BE80 100%)',
    '3': 'linear-gradient(135deg, #F9E79F 0%, #F4D03F 100%)',
    '4': 'linear-gradient(135deg, #BB8FCE 0%, #785586ff 100%)',
    '5': 'linear-gradient(135deg, #EC7063 0%, #C0392B 100%)',
    '6': 'linear-gradient(135deg, #9fa69cff 0%, #273746 100%)',
    '7': 'linear-gradient(135deg, #dfaae0ff 0%, #e97ba0ff 100%)',
    '8': 'linear-gradient(135deg, #c0c4c4ff 0%, #AEB6BF 100%)',
    '9': 'linear-gradient(135deg, #D7BCA0 0%, #B8956A 100%)',
    '10': 'linear-gradient(135deg, #22506eff 0%, #113349ff 100%)',
    '11': 'linear-gradient(135deg, #d1c8beff 0%, #D7CCC8 100%)'
};

// cuando carga la pagina
document.addEventListener('DOMContentLoaded', function() {
    cargarCanciones();
    
    // botones
    document.getElementById('finishBtn').addEventListener('click', finalizarJuego);
    document.getElementById('newGameBtn').addEventListener('click', nuevoJuego);
});

// funcion para cargar las canciones desde la API
async function cargarCanciones() {
    try {
        var response = await fetch('https://taylor-swift-api.sarbo.workers.dev/songs');
        todasLasCanciones = await response.json();
        console.log('Canciones cargadas:', todasLasCanciones.length);
        iniciarJuego();
    } catch (error) {
        alert('Error al cargar canciones. Por favor, recarga la página.');
        console.log(error);
    }
}

// funcion que inicia el juego
function iniciarJuego() {
    juegoTerminado = false;
    
    // elegir un album al azar
    var albumIds = Object.keys(nombres);
    var randomIndex = Math.floor(Math.random() * albumIds.length);
    albumActual = albumIds[randomIndex];
    
    console.log('Album elegido:', nombres[albumActual]);
    
    // buscar canciones del album elegido
    var cancionesAlbum = [];
    for (var i = 0; i < todasLasCanciones.length; i++) {
        if (todasLasCanciones[i].album_id == albumActual) {
            cancionesAlbum.push(todasLasCanciones[i]);
        }
    }
    
    // buscar canciones de otros albums
    var cancionesOtros = [];
    for (var i = 0; i < todasLasCanciones.length; i++) {
        if (todasLasCanciones[i].album_id != albumActual) {
            cancionesOtros.push(todasLasCanciones[i]);
        }
    }
    
    // mezclar las canciones
    cancionesAlbum.sort(function() { return Math.random() - 0.5; });
    cancionesOtros.sort(function() { return Math.random() - 0.5; });
    
    // elegir cuantas canciones correctas voy a poner (entre 5 y 8)
    var numCorrectas = 5 + Math.floor(Math.random() * 4);
    var seleccionCorrectas = [];
    for (var i = 0; i < numCorrectas; i++) {
        seleccionCorrectas.push(cancionesAlbum[i]);
    }
    
    // completar con canciones incorrectas hasta llegar a 15
    var numIncorrectas = 15 - numCorrectas;
    var seleccionIncorrectas = [];
    for (var i = 0; i < numIncorrectas; i++) {
        seleccionIncorrectas.push(cancionesOtros[i]);
    }
    
    // juntar todas las canciones
    cancionesDelJuego = seleccionCorrectas.concat(seleccionIncorrectas);
    
    // mezclar todo
    cancionesDelJuego.sort(function() { return Math.random() - 0.5; });
    
    // guardar los IDs de las canciones correctas para luego comparar
    cancionesCorrectas = [];
    for (var i = 0; i < seleccionCorrectas.length; i++) {
        cancionesCorrectas.push(seleccionCorrectas[i].song_id);
    }
    
    console.log('Canciones correctas:', cancionesCorrectas);
    
    mostrarJuego();
}

// funcion para mostrar el juego en pantalla
function mostrarJuego() {
    // cambiar el color de fondo segun el album
    document.body.style.background = coloresFondo[albumActual];

    // establecer variables CSS para que la selección de canciones se adapte al album
    // coloresFondo tiene valores tipo 'linear-gradient(135deg, #dfaae0ff 0%, #e97ba0ff 100%)'
    var gradient = coloresFondo[albumActual];
    // intentar extraer el primer color hexadecimal para usar como borde
    var firstColorMatch = gradient.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})/);
    var borderColor = firstColorMatch ? firstColorMatch[0] : '#667eea';
    // asignar variables CSS en el root (body)
    document.body.style.setProperty('--album-accent', gradient);
    document.body.style.setProperty('--album-accent-border', borderColor);
    
    // poner el nombre y la imagen del album
    var nombreAlbum = nombres[albumActual];
    document.getElementById('albumName').textContent = nombreAlbum;
    document.getElementById('albumImage').src = './imagenes/' + albumActual + '.jpeg';
    document.getElementById('albumImage').alt = nombreAlbum;
    
    // crear las tarjetas de las canciones
    var songsGrid = document.getElementById('songsGrid');
    songsGrid.innerHTML = '';
    
    for (var i = 0; i < cancionesDelJuego.length; i++) {
        var cancion = cancionesDelJuego[i];
        
        // crear div para la tarjeta
        var tarjeta = document.createElement('div');
        tarjeta.className = 'song-card';
        tarjeta.dataset.songId = cancion.song_id;
        
        // crear div para el titulo
        var divTitulo = document.createElement('div');
        divTitulo.className = 'song-title';
        if (cancion.title) {
            divTitulo.textContent = cancion.title;
        } else {
            divTitulo.textContent = 'Sin título';
        }
        
        // crear div para el nombre del album
        var divAlbum = document.createElement('div');
        divAlbum.className = 'song-album';
        if (nombres[cancion.album_id]) {
            divAlbum.textContent = nombres[cancion.album_id];
        } else {
            divAlbum.textContent = 'Desconocido';
        }
        
        // añadir los divs a la tarjeta
        tarjeta.appendChild(divTitulo);
        
        
        // añadir evento de click
        tarjeta.addEventListener('click', function() {
            if (!juegoTerminado) {
                this.classList.toggle('selected');
            }
        });
        
        // añadir la tarjeta al grid
        songsGrid.appendChild(tarjeta);
    }
    
    // esconder la pantalla de carga y mostrar el juego
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('gameSection').classList.remove('hidden');
    document.getElementById('results').style.display = 'none';
}

// funcion para cuando el usuario termina el juego
function finalizarJuego() {
    juegoTerminado = true;
    
    var tarjetas = document.querySelectorAll('.song-card');
    var aciertos = 0;
    var errores = 0;

    // revisar cada tarjeta
    for (var i = 0; i < tarjetas.length; i++) {
        var tarjeta = tarjetas[i];
        var songId = parseInt(tarjeta.dataset.songId);
        var estaSeleccionada = tarjeta.classList.contains('selected');
        var esCorrecta = false;
        
        // verificar si es correcta
        for (var j = 0; j < cancionesCorrectas.length; j++) {
            if (cancionesCorrectas[j] === songId) {
                esCorrecta = true;
                break;
            }
        }

        // añadir clase segun si acerto o no
        if (estaSeleccionada && esCorrecta) {
            tarjeta.classList.add('correct');
            aciertos++;
        } else if (estaSeleccionada && !esCorrecta) {
            tarjeta.classList.add('incorrect');
            errores++;
        } else if (!estaSeleccionada && esCorrecta) {
            // no la selecciono pero era correcta
            tarjeta.classList.add('correct');
            errores++;
        }
    }

    console.log('Aciertos:', aciertos, 'Errores:', errores);
    mostrarResultados(aciertos, errores);
}

// funcion para mostrar la pantalla de resultados
function mostrarResultados(aciertos, errores) {
    // calcular porcentajes basados en aciertos y errores
    var total = aciertos + errores;
    // si no hay ni aciertos ni errores (usuario no interactuó), tomar como total las canciones del juego
    if (total === 0 && typeof cancionesDelJuego !== 'undefined') {
        total = cancionesDelJuego.length || 0;
    }

    var percentCorrect = total > 0 ? Math.round((aciertos / total) * 100) : 0;
    var percentIncorrect = total > 0 ? Math.round((errores / total) * 100) : 0;

    // mostrar conteos y porcentajes
    document.getElementById('correctCount').textContent = aciertos + ' (' + percentCorrect + '%)';
    document.getElementById('incorrectCount').textContent = errores + ' (' + percentIncorrect + '%)';
    document.getElementById('finalScore').textContent = percentCorrect + '%';

    var scoreElement = document.getElementById('finalScore');
    var mensaje = '';

    // nueva tabla de puntuaciones basada en porcentaje
    // >= 80% -> excellent, >= 60% -> good, >= 40% -> fair, < 40% -> poor
    if (percentCorrect >= 80) {
        scoreElement.className = 'score excellent';
        mensaje = '¡Increíble! Eres un verdadero Swiftie';
    } else if (percentCorrect >= 60) {
        scoreElement.className = 'score good';
        mensaje = '¡Muy bien! Conoces bastante a Taylor';
    } else if (percentCorrect >= 40) {
        scoreElement.className = 'score fair';
        mensaje = '¡No está mal! Entiendes bastante';
    } else {
        scoreElement.className = 'score poor';
        mensaje = '¡Sigue intentándolo! Practica más';
    }

    document.getElementById('scoreMessage').textContent = mensaje;

    // esperar 2 segundos y mostrar resultados
    setTimeout(function() {
        document.getElementById('gameSection').classList.add('hidden');
        document.getElementById('results').style.display = 'block';
    }, 2000);
}

// funcion para empezar un nuevo juego
function nuevoJuego() {
    document.getElementById('results').style.display = 'none';
    iniciarJuego();
}