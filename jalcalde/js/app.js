$(document).ready(function() {
    // Objeto para manejar la UI
    const UI = {
        // Mostrar notificaciones temporales
        showNotification: function(message, type = 'info') {
            // Crear elemento de notificación
            const notification = $(`<div class="notification ${type}">${message}</div>`);
            
            // Añadir a DOM
            $('body').append(notification);
            
            // Mostrar con animación
            setTimeout(() => {
                notification.addClass('show');
                
                // Eliminar después de 3 segundos
                setTimeout(() => {
                    notification.removeClass('show');
                    setTimeout(() => notification.remove(), 300);
                }, 3000);
            }, 100);
        },
        
        // Cargar vistas SPA
        loadView: function(route) {
            const views = {
                home: `
                    <div class="view-container">
                        <h1>Bienvenido a Mini Spotify</h1>
                        <p>Esta es una aplicación de ejemplo que utiliza la API de Spotify.</p>
                        <div class="home-cards">
                            <div class="feature-card">
                                <i class="fas fa-headphones"></i>
                                <h3>Escucha música</h3>
                                <p>Reproduce tus canciones favoritas</p>
                            </div>
                            <div class="feature-card">
                                <i class="fas fa-heart"></i>
                                <h3>Guarda tus favoritos</h3>
                                <p>Mantén una colección de tus temas preferidos</p>
                            </div>
                        </div>
                    </div>
                `,
                favorites: `
                    <div class="view-container">
                        <h1>Favoritos</h1>
                        <div class="favorites-container">
                            <div class="loader">Cargando tus favoritos...</div>
                        </div>
                    </div>
                `,
                playlists: `
                    <div class="view-container">
                        <h1>Playlists</h1>
                        <div class="playlists-container">
                            <div class="loader">Cargando tus playlists...</div>
                        </div>
                    </div>
                `
            };
            
            // Actualizar el contenido principal
            $('#main-content').html(views[route] || views.home);
            
            // Actualizar enlaces de navegación activos
            $('.nav-link').removeClass('active');
            $(`.nav-link[data-route="${route}"]`).addClass('active');
            
            // Inicializar la vista específica después de cargarla
            this.initView(route);
        },
        
        // Inicializar vista específica
        initView: function(route) {
            // Inicializar diferentes vistas según la ruta
            switch(route) {                    
                case 'favorites':
                    // Cargar favoritos solo si existe la función
                    if (window.Favorites) {
                        Favorites.loadFavorites();
                    } else {
                        $('.favorites-container').html('<p>Error: Módulo de favoritos no disponible.</p>');
                    }
                    break;
                    
                case 'playlists':
                    // Cargar playlists solo si existe la función
                    if (window.Playlists) {
                        Playlists.loadPlaylists();
                    } else {
                        $('.playlists-container').html('<p>Error: Módulo de playlists no disponible.</p>');
                    }
                    break;
                    
                case 'home':
                    // No hay inicialización especial para la vista home
                    break;
            }
        },
        
        // Comprobar el estado de autenticación
        checkAuthStatus: function() {
            return SpotifyAuth.getToken()
                .then(token => {
                    console.log('Usuario autenticado correctamente');
                    $('.user-info .user-name').text('Usuario conectado');
                    $('#login-button').hide();
                    UI.showNotification('¡Conectado a Spotify!', 'success');
                    return true;
                })
                .catch(err => {
                    console.log('Usuario no autenticado', err);
                    $('.user-info .user-name').text('No conectado');
                    $('#login-button').show();
                    return false;
                });
        }
    };
    
    // Inicializar app SPA
    function initApp() {
        console.log('Iniciando aplicación Mini Spotify...');
        
        // Verificar si hay un código de autenticación en la URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
            console.log('Código de autenticación encontrado en la URL');
            UI.showNotification('Procesando autenticación...', 'info');
        }
        
        // Inicializar autenticación y comprobar si tenemos sesión
        UI.checkAuthStatus()
            .then(isAuthenticated => {
                // Cargar vista inicial
                UI.loadView('home');
                
                // Inicializar reproductor
                Player.init();
            });
        
        // Manejar navegación SPA
        $('.nav-link').on('click', function(e) {
            e.preventDefault();
            const route = $(this).data('route');
            UI.loadView(route);
        });
        
        // Evento para botón de login
        $('#login-button').on('click', function() {
            window.location.href = '/login';
        });
    }
    
    // Exportar objeto UI
    window.UI = UI;
    
    // Iniciar la aplicación
    initApp();
});