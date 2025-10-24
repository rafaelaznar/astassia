// CONSTANTES API + NÂº PREGUNTAS
var CLAVE_API = 'b68cb153';
var NUM_PREGUNTAS = 5;

// Variables globales para el juego
var puntuacion = 0;
var rep_Inc = 0; 
var pregunta_Actual = 0; 
var peliculas = [];
var main_juego;
var marcador_Puntuacion; 
var tiempo_Inicio_Pregunta = 0;
var tiempos_Pregunta = [];
var tiempo_Total = 0;
var tiempo_Parar = null;

// FUNCION PARA INICIAR EL JUEGO
var iniciarJuego = function() { 
    main_juego = document.getElementById('game-container');
    marcador_Puntuacion = document.getElementById('score');
    
    // Mostrar mensaje de carga
    main_juego.innerHTML = '<div class="loading">Cargando preguntas...</div>';

    // Cargar las peliculas
    cargarPeliculas();
};

// FUNCION PARA CARGAR PELICULAS
var cargarPeliculas = function() {
    // Lista de IDs de peli­culas famosas
    var id_Peliculas = ['tt0111161', 'tt0068646', 'tt0468569', 'tt0137523', 'tt0816692'];
    
    // Mezclar los IDs
    var id_Mezclados = [];
    for (var i = 0; i < id_Peliculas.length; i++) {
        id_Mezclados.push(id_Peliculas[i]);
    }
    
    // Mezclar el array
    for (var i = id_Mezclados.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temporal = id_Mezclados[i]; 
        id_Mezclados[i] = id_Mezclados[j];
        id_Mezclados[j] = temporal;
    }
    
    // CARGAR LAS PELICULAS
    var pelis_Cargadas = 0;
    for (var i = 0; i < NUM_PREGUNTAS; i++) {
        var id = id_Mezclados[i];
        
        fetch(`https://www.omdbapi.com/?i=${id}&apikey=${CLAVE_API}`)
            .then(function(respuesta) {
                return respuesta.json();
            })
            .then(function(datos_Pelicula) {
                if (datos_Pelicula.Response === 'True') {
                    peliculas.push(datos_Pelicula);
                    pelis_Cargadas = pelis_Cargadas + 1;
                    
                    if (pelis_Cargadas === NUM_PREGUNTAS) {
                        mostrarPregunta();
                    }
                }
            })
            .catch(function(error) {
                console.error('Error:', error);
            });
    }
};

// MEZCLAR LOS ARRAYS
var Mezclar_Pel_Resp = function(array) { 
    var copia_Original = [];
    
    for (var i = 0; i < array.length; i++) {
        copia_Original.push(array[i]);
    }
    
    for (var i = copia_Original.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var elementoActual = copia_Original[i];
        copia_Original[i] = copia_Original[j];
        copia_Original[j] = elementoActual;
    }
    
    return copia_Original; 
};

// GENERAR RESPUESTAS INCORRECTAS
var obtener_resp_inc = function(tipo, callback) {
    var id_Peliculas_Incorrectas = ['tt0114369', 'tt0120737', 'tt0110357'];
    
    var resp_Incorrectas = [];
    var incorrectas_Cargadas = 0;
    
    for (var i = 0; i < id_Peliculas_Incorrectas.length; i++) {
        var id = id_Peliculas_Incorrectas[i];
        
        fetch(`https://www.omdbapi.com/?i=${id}&apikey=${CLAVE_API}`)
            .then(function(respuesta) {
                return respuesta.json();
            })
            .then(function(datos_Pelicula) {
                if (datos_Pelicula.Response === 'True') {
                    if (tipo === 'year') {
                        resp_Incorrectas.push(datos_Pelicula.Year);
                    } else {
                        resp_Incorrectas.push(datos_Pelicula.Title);
                    }
                    incorrectas_Cargadas = incorrectas_Cargadas + 1;
                    
                    if (incorrectas_Cargadas === 3) {
                        callback(resp_Incorrectas);
                    }
                }
            })
            .catch(function(error) {
                console.error('Error:', error);
            });
    }
};

// MOSTRAR PREGUNTA
var mostrarPregunta = function() {
    if (pregunta_Actual >= NUM_PREGUNTAS) {
        mostrarPantallaFinal();
        return;
    }
    
    tiempo_Inicio_Pregunta = Date.now();
    
    var pelicula = peliculas[pregunta_Actual];
    
    var numero_Random = Math.random();
    var tipo_Pregunta = 'title';
    
    if (numero_Random > 0.5) {
        tipo_Pregunta = 'year';
    }
    
    var pregunta = '';
    var resp_Correcta = '';
    
    // Decidir tipo de pregunta
    if (tipo_Pregunta === 'year') {
        pregunta = '¿En que año se ha estrenado: "' + pelicula.Title + '"?';
        resp_Correcta = pelicula.Year;
        
        obtener_resp_inc('year', function(resp_Incorrectas) {
            mostrar_Pregunta(pelicula, pregunta, resp_Correcta, resp_Incorrectas);
        });
    } else {
        pregunta = '¿Como se llama la pelicula?';
        resp_Correcta = pelicula.Title;
        
        obtener_resp_inc('title', function(resp_Incorrectas) {
            mostrar_Pregunta(pelicula, pregunta, resp_Correcta, resp_Incorrectas);
        });
    }
};

// MOSTRAR LA PREGUNTA EN PANTALLA
var mostrar_Pregunta = function(pelicula, pregunta, resp_Correcta, resp_Incorrectas) {
    var opciones_Pregunta = [resp_Correcta];
    
    for (var i = 0; i < resp_Incorrectas.length; i++) {
        opciones_Pregunta.push(resp_Incorrectas[i]);
    }

    // Mezclar opciones
    var opciones_Mix = Mezclar_Pel_Resp(opciones_Pregunta);
    var contenidoHTML = '<div class="question-container">';
    contenidoHTML += '<div class="timer">Tiempo: <span id="tiempo-display">0.0s</span></div>';
    
    if (pelicula.Poster !== 'N/A') {
        contenidoHTML += '<img src="' + pelicula.Poster + '" alt="' + pelicula.Title + '" class="movie-poster">';
    }

    contenidoHTML += '<div class="question">' + pregunta + '</div>';
    contenidoHTML += '<div class="options">';
    
    for (var i = 0; i < opciones_Mix.length; i++) {
        var opcion = opciones_Mix[i];
        contenidoHTML += '<div class="option" data-answer="' + opcion + '">' + opcion + '</div>';
    }

    contenidoHTML += '</div>';
    contenidoHTML += '<div id="result-message"></div>';
    contenidoHTML += '<button class="btn" id="next-btn" style="display: none;">Siguiente pregunta</button>';
    contenidoHTML += '</div>';

    // Mostrar en el main
    main_juego.innerHTML = contenidoHTML;
    actualizarTemporizador();
    opciones(resp_Correcta);
};

// ACTUALIZAR TEMPORIZADOR
var actualizarTemporizador = function() {
    tiempo_Parar = setInterval(function() {
        var tiempo_Actual = Date.now();
        var tiempo = tiempo_Actual - tiempo_Inicio_Pregunta;
        var segundos = tiempo / 1000;
        
        var timer = document.getElementById('tiempo-display');
        if (timer) {
            timer.textContent = segundos.toFixed(1) + 's';
        }
    }, 100);
};

// DETENER TEMPORIZADOR
var detenerTemporizador = function() {
    if (tiempo_Parar) {
        clearInterval(tiempo_Parar);
        tiempo_Parar = null;
    }
};

// GUARDAR TIEMPO PREGUNTA
var guardarTiempoPregunta = function() {
    var tiempo_Final = Date.now();
    var tiempo_Pregunta = (tiempo_Final - tiempo_Inicio_Pregunta) / 1000;
    
    tiempos_Pregunta.push(tiempo_Pregunta);
    tiempo_Total = tiempo_Total + tiempo_Pregunta;
    
    detenerTemporizador();
};

// FUNCION PARA CONFIGURAR LAS OPCIONES
var opciones = function(resp_Correcta) {
    var opciones = document.querySelectorAll('.option');
    var mensaje_Resultado = document.getElementById('result-message');
    var boton_Siguiente = document.getElementById('next-btn');
    
    // Escuchar y guardar la pregunta
    for (var i = 0; i < opciones.length; i++) {
        var opcion = opciones[i];
        
        opcion.addEventListener('click', function() {
            if (this.classList.contains('disabled')) {
                return;
            }
            
            guardarTiempoPregunta();
            
            var resp_Seleccionada = this.dataset.answer;
            var correcto = false;
            
            if (resp_Seleccionada === resp_Correcta) {
                correcto = true;
            }
            
            // Quitar seleccion y poner seleccion usuario + respuestas
            var opciones_Pregunta = document.querySelectorAll('.option');
            for (var j = 0; j < opciones_Pregunta.length; j++) {
                var opcion_Actual = opciones_Pregunta[j];
                opcion_Actual.classList.add('disabled');
                
                if (opcion_Actual.dataset.answer === resp_Correcta) {
                    opcion_Actual.classList.add('correct');
                } else if (opcion_Actual === this && !correcto) {
                    opcion_Actual.classList.add('incorrect');
                }
            }
            
            if (correcto) {
                puntuacion = puntuacion + 1;
                marcador_Puntuacion.textContent = puntuacion;
                mensaje_Resultado.innerHTML = '<div class="result-message correct"> Muy bien, correcto </div>';
            } else {
                rep_Inc = rep_Inc + 1;
                mensaje_Resultado.innerHTML = '<div class="result-message incorrect"> Nuh uh, incorrecto </div>';
            }
            
            boton_Siguiente.style.display = 'block';
        });
    }
    
    boton_Siguiente.addEventListener('click', function() {
        pregunta_Actual = pregunta_Actual + 1;
        mostrarPregunta();
    });
};

// MOSTRAR PANTALLA PUNTUACION FINAL
var mostrarPantallaFinal = function() {
    var porcentaje = (puntuacion / NUM_PREGUNTAS) * 100;
    var mensaje = '';
    
    // Puntuaciones
    if (porcentaje === 100) {
        mensaje = 'Perfecto jefe, eres un sigma';
    } else if (porcentaje >= 60) {
        mensaje = 'K crack, sigue intentando';
    } else {
        mensaje = 'Y tu estas seguro que sabias de peliculas?';
    }
    
    var tiempo_Medio = tiempo_Total / NUM_PREGUNTAS;
    
    // Tarjetita final
    var htmlFinal = '<div class="final-screen">';
    htmlFinal += '<div class="final-score">' + puntuacion + '/' + NUM_PREGUNTAS + '</div>';
    htmlFinal += '<div class="final-message">' + mensaje + '</div>';
    htmlFinal += '<div class="stats-summary">';
    htmlFinal += '<div class="stat-item">Aciertos: ' + puntuacion + '</div>';
    htmlFinal += '<div class="stat-item">Errores: ' + rep_Inc + '</div>';
    htmlFinal += '<div class="stat-item">Tiempo total: ' + tiempo_Total.toFixed(2) + 's</div>';
    htmlFinal += '<div class="stat-item">tiempo medio: ' + tiempo_Medio.toFixed(2) + 's</div>';
    htmlFinal += '</div>';
    htmlFinal += '<br><br>';
    
    htmlFinal += '<div class="time-details">';
    htmlFinal += '<h3>Tiempos por pregunta:</h3>';
    for (var i = 0; i < tiempos_Pregunta.length; i++) {
        htmlFinal += '<div class="time-item">Pregunta ' + (i + 1) + ': ' + tiempos_Pregunta[i].toFixed(2) + 's</div>';
    }
    htmlFinal += '</div>';
    
    htmlFinal += '<button class="btn" onclick="location.reload()">Jugar de nuevo</button>';
    htmlFinal += '</div>';
    
    // Meterlo al main
    main_juego.innerHTML = htmlFinal;
};

// Iniciar el juego
iniciarJuego();