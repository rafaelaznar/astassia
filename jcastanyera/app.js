// esperar a que cargue todo
$(document).ready(function() {
    
    // array para guardar todas las festividades
    var todasLasFestividades = [];
    
    // array para guardar los favoritos
    var festivalesFavoritos = [];
    
    // variable para saber que filtro esta activo
    var filtroActivo = 'todos';
    
    // la url de la API
    var url = 'https://date.nager.at/api/v3/PublicHolidays/2025/ES';

    // hacer la peticion ajax con callback
    obtenerFestividades(url, function(data) {
        // guardar en el array global
        todasLasFestividades = data;
        // mostrar las festividades
        procesarYMostrarFestividades(todasLasFestividades, function(festividades) {
            renderizarFestividades(festividades);
        });
    });
    
    // funcion con callback para obtener festividades
    function obtenerFestividades(urlApi, callback) {
        $.ajax({
            url: urlApi,
            method: 'GET',
            dataType: 'json',
            success: function(data) {
                // ejecutar el callback si funciona
                callback(data);
            },
            error: function(error) {
                // si hay error mostrar mensaje
                $('#content').html('<div class="error">⚠️ Error al cargar las festividades. Por favor, intenta de nuevo más tarde.</div>');
                console.error('Error:', error);
            }
        });
    }
    
    // funcion callback para procesar las festividades
    function procesarYMostrarFestividades(arrayFestividades, callback) {
        // crear nuevo array procesado
        var festividadesProcesadas = [];
        
        // recorrer el array original
        for (var i = 0; i < arrayFestividades.length; i++) {
            var fest = arrayFestividades[i];
            
            // crear objeto fecha
            var fecha = new Date(fest.date);
            
            // formatear la fecha bonita
            var opciones = {
                day: 'numeric',
                month: 'long',
                weekday: 'long'
            };
            var fechaFormateada = fecha.toLocaleDateString('es-ES', opciones);
            
            // agregar propiedades extra al objeto
            fest.fechaFormateada = fechaFormateada;
            fest.mes = fecha.getMonth() + 1;
            fest.esFavorito = false;
            
            // verificar si ya esta en favoritos
            for (var j = 0; j < festivalesFavoritos.length; j++) {
                if (festivalesFavoritos[j].date == fest.date) {
                    fest.esFavorito = true;
                    break;
                }
            }
            
            // añadir al array procesado
            festividadesProcesadas.push(fest);
        }
        
        // ejecutar callback con el array procesado
        callback(festividadesProcesadas);
    }
    
    // funcion para renderizar (dibujar) las festividades
    function renderizarFestividades(arrayFestividades) {
        // si el array esta vacio
        if (arrayFestividades.length == 0) {
            $('#content').html('<div class="sin-resultados">😔 No se encontraron festividades con esos criterios</div>');
            return;
        }
        
        var html = '';
        html = html + '<div class="festividades-grid">';
        
        // recorrer el array de festividades
        for (var i = 0; i < arrayFestividades.length; i++) {
            var fest = arrayFestividades[i];
            
            // ver si es nacional o no
            var tipoClase = '';
            var tipoTexto = '';
            if (fest.global == true) {
                tipoClase = 'nacional';
                tipoTexto = 'Nacional';
            } else {
                tipoClase = '';
                tipoTexto = 'Local/Regional';
            }
            
            // icono de favorito
            var iconoFavorito = fest.esFavorito ? '⭐' : '☆';

            // empezar a construir la tarjeta
            html = html + '<div class="festividad-card" data-date="' + fest.date + '">';
            html = html + '<button class="btn-favorito" data-date="' + fest.date + '">' + iconoFavorito + '</button>';
            html = html + '<div class="fecha">' + fest.fechaFormateada + '</div>';
            html = html + '<div class="nombre">' + fest.localName + '</div>';
            
            // si el nombre internacional es diferente mostrarlo
            if (fest.localName != fest.name) {
                html = html + '<div class="nombre-local">' + fest.name + '</div>';
            }
            
            html = html + '<div class="tipo ' + tipoClase + '">' + tipoTexto + '</div>';
            html = html + '</div>';
        }

        html = html + '</div>';
        
        // poner el html en el div content
        $('#content').html(html);
        
        // agregar eventos a los botones de favorito
        agregarEventosFavoritos();
        
        // agregar eventos para ir a wikipedia
        agregarEventosWikipedia();
    }
    
    // funcion para agregar eventos a botones favoritos
    function agregarEventosFavoritos() {
        $('.btn-favorito').click(function(e) {
            e.stopPropagation();
            var fechaFestival = $(this).attr('data-date');
            toggleFavorito(fechaFestival);
        });
    }
    
    // funcion para agregar eventos para ir a wikipedia
    
    //NO SIEMPRE FUNCIONA EL ENLACE porque los nombres en la api no siempre 
    //coinciden con los de la wiki
    function agregarEventosWikipedia() {
        $('.festividad-card').click(function() {
            // obtener la fecha de la festividad
            var fechaFestival = $(this).attr('data-date');
            
            // buscar la festividad en el array
            var festividad = null;
            for (var i = 0; i < todasLasFestividades.length; i++) {
                if (todasLasFestividades[i].date == fechaFestival) {
                    festividad = todasLasFestividades[i];
                    break;
                }
            }
            
            if (festividad != null) {
                // crear la url de wikipedia con el nombre local
                var nombreParaWikipedia = festividad.localName;
                // reemplazar espacios por guiones bajos
                nombreParaWikipedia = nombreParaWikipedia.replace(/ /g, '_');
                
                // construir url de wikipedia en español
                var urlWikipedia = 'https://es.wikipedia.org/wiki/' + nombreParaWikipedia;
                
                // abrir en nueva pestaña
                window.open(urlWikipedia, '_blank');
            }
        });
    }
    
    // funcion callback para alternar favorito
    function toggleFavorito(fecha) {
        // buscar la festividad en el array
        var festividad = null;
        for (var i = 0; i < todasLasFestividades.length; i++) {
            if (todasLasFestividades[i].date == fecha) {
                festividad = todasLasFestividades[i];
                break;
            }
        }
        
        if (festividad == null) {
            return;
        }
        
        // verificar si ya esta en favoritos
        var estaEnFavoritos = false;
        var indiceFavorito = -1;
        for (var j = 0; j < festivalesFavoritos.length; j++) {
            if (festivalesFavoritos[j].date == fecha) {
                estaEnFavoritos = true;
                indiceFavorito = j;
                break;
            }
        }
        
        // si esta en favoritos quitarlo, si no agregarlo
        if (estaEnFavoritos == true) {
            // quitar del array usando splice
            festivalesFavoritos.splice(indiceFavorito, 1);
        } else {
            // agregar al array
            festivalesFavoritos.push(festividad);
        }
        
        // volver a mostrar con callback
        aplicarFiltroActual();
    }
    
    // eventos de los botones de filtro
    $('.btn-filtro').click(function() {
        // quitar clase activo de todos
        $('.btn-filtro').removeClass('activo');
        // agregar clase activo al clickeado
        $(this).addClass('activo');
        
        // obtener el filtro
        var filtro = $(this).attr('data-filtro');
        filtroActivo = filtro;
        
        // aplicar filtro con callback
        aplicarFiltroActual();
    });
    
    // funcion para aplicar el filtro actual
    function aplicarFiltroActual() {
        filtrarFestividades(todasLasFestividades, filtroActivo, function(festividadesFiltradas) {
            procesarYMostrarFestividades(festividadesFiltradas, function(festividades) {
                renderizarFestividades(festividades);
            });
        });
    }
    
    // funcion callback para filtrar festividades
    function filtrarFestividades(arrayOriginal, tipoFiltro, callback) {
        var arrayFiltrado = [];
        
        if (tipoFiltro == 'todos') {
            // devolver todas
            arrayFiltrado = arrayOriginal;
        } else if (tipoFiltro == 'nacional') {
            // filtrar solo nacionales
            for (var i = 0; i < arrayOriginal.length; i++) {
                if (arrayOriginal[i].global == true) {
                    arrayFiltrado.push(arrayOriginal[i]);
                }
            }
        } else if (tipoFiltro == 'regional') {
            // filtrar solo regionales
            for (var i = 0; i < arrayOriginal.length; i++) {
                if (arrayOriginal[i].global == false) {
                    arrayFiltrado.push(arrayOriginal[i]);
                }
            }
        } else if (tipoFiltro == 'favoritos') {
            // devolver solo favoritos
            arrayFiltrado = festivalesFavoritos;
        }
        
        // ejecutar callback con el array filtrado
        callback(arrayFiltrado);
    }
    
    // validacion con expresiones regulares
    function validarFormulario(nombre, mes) {
        var esValido = true;
        
        // limpiar mensajes de error
        $('#error-nombre').text('');
        $('#error-mes').text('');
        
        // expresion regular para validar el nombre (solo letras y espacios)
        var regexNombre = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
        
        // si hay texto en nombre validarlo
        if (nombre != '') {
            if (nombre.length < 3) {
                $('#error-nombre').text('Debe tener al menos 3 caracteres');
                esValido = false;
            } else if (!regexNombre.test(nombre)) {
                $('#error-nombre').text('Solo se permiten letras y espacios');
                esValido = false;
            }
        }
        
        // expresion regular para validar el mes (solo numeros del 1 al 12)
        var regexMes = /^([1-9]|1[0-2])$/;
        
        // si hay texto en mes validarlo
        if (mes != '') {
            if (!regexMes.test(mes)) {
                $('#error-mes').text('Debe ser un número entre 1 y 12');
                esValido = false;
            }
        }
        
        return esValido;
    }
    
    // evento del formulario
    $('#form-buscar').submit(function(e) {
        // prevenir que se recargue la pagina
        e.preventDefault();
        
        // obtener los valores
        var nombreBuscar = $('#buscar-nombre').val().trim();
        var mesBuscar = $('#buscar-mes').val().trim();
        
        // validar con regex
        if (!validarFormulario(nombreBuscar, mesBuscar)) {
            return;
        }
        
        // buscar con callback
        buscarFestividades(todasLasFestividades, nombreBuscar, mesBuscar, function(resultados) {
            procesarYMostrarFestividades(resultados, function(festividades) {
                renderizarFestividades(festividades);
            });
        });
    });
    
    // funcion callback para buscar
    function buscarFestividades(arrayOriginal, nombre, mes, callback) {
        var resultados = [];
        
        // convertir nombre a minusculas para buscar
        var nombreMin = nombre.toLowerCase();
        
        // recorrer array
        for (var i = 0; i < arrayOriginal.length; i++) {
            var fest = arrayOriginal[i];
            var coincide = true;
            
            // si hay nombre buscar
            if (nombre != '') {
                var nombreFestMin = fest.name.toLowerCase();
                var nombreLocalMin = fest.localName.toLowerCase();
                
                // si no esta en ninguno de los nombres no coincide
                if (nombreFestMin.indexOf(nombreMin) == -1 && nombreLocalMin.indexOf(nombreMin) == -1) {
                    coincide = false;
                }
            }
            
            // si hay mes buscar
            if (mes != '') {
                var fechaFest = new Date(fest.date);
                var mesFest = fechaFest.getMonth() + 1;
                
                // convertir mes a numero
                var mesBuscarNum = parseInt(mes);
                
                if (mesFest != mesBuscarNum) {
                    coincide = false;
                }
            }
            
            // si coincide agregarlo
            if (coincide == true) {
                resultados.push(fest);
            }
        }
        
        // ejecutar callback con resultados
        callback(resultados);
    }
    
    // boton limpiar
    $('#btn-limpiar').click(function() {
        // limpiar los inputs
        $('#buscar-nombre').val('');
        $('#buscar-mes').val('');
        $('#error-nombre').text('');
        $('#error-mes').text('');
        
        // volver a mostrar todas
        aplicarFiltroActual();
    });
    
});