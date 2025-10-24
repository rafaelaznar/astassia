$(document).ready(function() {
    // Objeto para manejar el reproductor
    const Player = {
        currentTrack: null,
        isPlaying: false,
        audioElement: null,
        progressInterval: null,
        queue: [],
        
        // Inicializar el reproductor
        init: function() {
            console.log('Inicializando reproductor...');
            this.renderPlayer();
            this.attachEvents();
            this.audioElement = new Audio();
            
            // Verificar si hay una canción guardada en la sesión
            const savedTrack = localStorage.getItem('currentTrack');
            if (savedTrack) {
                try {
                    console.log('Recuperando canción guardada...');
                    const track = JSON.parse(savedTrack);
                    this.currentTrack = track;
                    this.updatePlayerUI(track);
                } catch (error) {
                    console.error('Error al cargar la canción guardada:', error);
                    localStorage.removeItem('currentTrack');
                }
            }
            
            // Configurar eventos del audio
            this.setupAudioEvents();
            
            // Verificar dispositivos disponibles
            SpotifyAPI.getDevices()
                .then(response => {
                    if (response && response.devices && response.devices.length > 0) {
                        const activeDevices = response.devices.filter(d => d.is_active);
                        if (activeDevices.length === 0) {
                            console.log('No hay dispositivos activos, intentando activar uno...');
                            return SpotifyAPI.transferPlayback(response.devices[0].id);
                        }
                    }
                })
                .catch(err => console.error('Error al verificar dispositivos:', err))
                .finally(() => {
                    // Obtener la canción actual de Spotify después de verificar dispositivos
                    console.log('Comprobando canción actual...');
                    this.getCurrentlyPlaying();
                    
                    // Actualizar el estado del reproductor cada 10 segundos
                    setInterval(() => this.getCurrentlyPlaying(), 10000);
                });
        },
        
        // Renderizar la estructura del reproductor
        renderPlayer: function() {
            const playerHtml = `
                <div class="spotify-mini-player">
                    <div class="track-info">
                        <img src="https://via.placeholder.com/150?text=Cover" class="cover" id="track-cover">
                        <div class="details">
                            <p class="title" id="track-title">No track selected</p>
                            <p class="artist" id="track-artist">-</p>
                        </div>
                    </div>
                    <div class="controls">
                        <button id="prev-btn" class="control-btn"><i class="fas fa-step-backward"></i></button>
                        <button id="play-btn" class="control-btn play"><i class="fas fa-play"></i></button>
                        <button id="next-btn" class="control-btn"><i class="fas fa-step-forward"></i></button>
                        <button id="like-btn" class="control-btn"><i class="far fa-heart"></i></button>
                    </div>
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress" id="song-progress"></div>
                        </div>
                        <div class="time">
                            <span id="current-time">0:00</span>
                            <span id="duration">0:00</span>
                        </div>
                    </div>
                </div>
            `;
            
            $('#player-container').html(playerHtml);
        },
        
        // Adjuntar eventos a los controles
        attachEvents: function() {
            $('#play-btn').on('click', function() {
                Player.togglePlay();
            });
            
            $('#prev-btn').on('click', function() {
                Player.playPrevious();
            });
            
            $('#next-btn').on('click', function() {
                Player.playNext();
            });
            
            $('#like-btn').on('click', function() {
                if (Player.currentTrack) {
                    const trackId = Player.currentTrack.id;
                    Favorites.addToFavorites(trackId)
                        .then(() => {
                            $('#like-btn i').removeClass('far').addClass('fas');
                        });
                } else {
                    UI.showNotification('No hay canción seleccionada', 'info');
                }
            });
            
            $('.progress-bar').on('click', function(e) {
                const progressBar = $(this);
                const position = (e.pageX - progressBar.offset().left) / progressBar.width();
                Player.seek(position);
            });
        },
        
        // Configurar eventos del elemento de audio
        setupAudioEvents: function() {
            const audio = this.audioElement;
            
            audio.addEventListener('timeupdate', () => {
                if (audio.duration) {
                    const progress = (audio.currentTime / audio.duration) * 100;
                    $('#song-progress').css('width', `${progress}%`);
                    $('#current-time').text(this.formatTime(audio.currentTime));
                }
            });
            
            audio.addEventListener('ended', () => {
                this.playNext();
            });
            
            audio.addEventListener('error', (e) => {
                console.error('Error de audio:', e);
                UI.showNotification('Error al reproducir la canción', 'error');
            });
        },
        
        // Cargar y reproducir una canción
        loadTrack: function(track) {
            console.log('Cargando canción:', track);
            
            if (!track) {
                console.error('Error: No se proporcionó una canción válida');
                return;
            }
            
            this.currentTrack = track;
            
            // Guardar en localStorage para persistencia
            localStorage.setItem('currentTrack', JSON.stringify(track));
            
            // Actualizar UI
            this.updatePlayerUI(track);
            
            // Verificar si la canción está en favoritos
            if (window.Favorites) {
                Favorites.isInFavorites(track.id)
                    .then(isFavorite => {
                        if (isFavorite) {
                            $('#like-btn i').removeClass('far').addClass('fas');
                        } else {
                            $('#like-btn i').removeClass('fas').addClass('far');
                        }
                    });
            }
            
            // Intentar reproducir si es posible
            this.play();
            
            // Mostrar notificación
            UI.showNotification(`Reproduciendo: ${track.name}`, 'success');
        },
        
        // Actualizar la UI del reproductor
        updatePlayerUI: function(track) {
            if (!track) return;
            
            const coverUrl = track.album?.images?.[0]?.url || 'https://via.placeholder.com/150?text=Cover';
            const artistNames = track.artists?.map(artist => artist.name).join(', ') || '-';
            const duration = track.duration_ms ? this.formatTime(track.duration_ms / 1000) : '0:00';
            
            $('#track-cover').attr('src', coverUrl);
            $('#track-title').text(track.name || 'Sin título');
            $('#track-artist').text(artistNames);
            $('#duration').text(duration);
        },
        
        // Obtener canción actual de Spotify
        getCurrentlyPlaying: function() {
            console.log('Verificando canción en reproducción actual...');
            
            SpotifyAuth.getToken()
                .then(token => {
                    return $.ajax({
                        url: 'https://api.spotify.com/v1/me/player',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                })
                .then(response => {
                    console.log('Respuesta del reproductor:', response);
                    
                    if (response && response.item) {
                        console.log('Canción actual:', response.item.name);
                        this.currentTrack = response.item;
                        this.isPlaying = response.is_playing;
                        this.updatePlayerUI(response.item);
                        
                        // Actualizar botón de reproducción
                        if (this.isPlaying) {
                            $('#play-btn i').removeClass('fa-play').addClass('fa-pause');
                        } else {
                            $('#play-btn i').removeClass('fa-pause').addClass('fa-play');
                        }
                        
                        // Actualizar progreso
                        if (response.progress_ms && response.item.duration_ms) {
                            const progress = (response.progress_ms / response.item.duration_ms) * 100;
                            $('#song-progress').css('width', `${progress}%`);
                            $('#current-time').text(this.formatTime(response.progress_ms / 1000));
                        }
                    } else if (response && response.device) {
                        // Hay un dispositivo activo pero no hay canción reproduciéndose
                        console.log('Dispositivo activo sin reproducción:', response.device.name);
                        
                        // Limpiar información del reproductor
                        $('#track-title').text('Sin reproducción');
                        $('#track-artist').text('Selecciona una canción para reproducir');
                        $('#play-btn i').removeClass('fa-pause').addClass('fa-play');
                    } else {
                        console.log('No hay información de reproducción disponible');
                    }
                })
                .catch(error => {
                    console.log('Info: No hay canción reproduciéndose actualmente');
                    console.log('Detalles del error:', error.responseJSON?.error);
                    
                    // Si hay error de autenticación, intentamos renovar el token
                    if (error.status === 401) {
                        SpotifyAuth.refresh()
                            .catch(() => {
                                // Si falla, no hacemos nada, se manejará en otro lugar
                            });
                    }
                });
        },
        
        // Alternar reproducción/pausa
        togglePlay: function() {
            if (!this.currentTrack) {
                UI.showNotification('No hay canción seleccionada', 'info');
                return;
            }
            
            this.isPlaying = !this.isPlaying;
            
            if (this.isPlaying) {
                $('#play-btn i').removeClass('fa-play').addClass('fa-pause');
                SpotifyAPI.playTrack(this.currentTrack.uri)
                    .catch(err => {
                        console.error('Error al reproducir:', err);
                        UI.showNotification('Error: Necesitas tener Spotify activo en otro dispositivo', 'error');
                        this.isPlaying = false;
                        $('#play-btn i').removeClass('fa-pause').addClass('fa-play');
                    });
            } else {
                $('#play-btn i').removeClass('fa-pause').addClass('fa-play');
                
                // Pausar reproducción en Spotify
                SpotifyAuth.getToken()
                    .then(token => {
                        return $.ajax({
                            url: 'https://api.spotify.com/v1/me/player/pause',
                            method: 'PUT',
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                    })
                    .catch(err => {
                        console.error('Error al pausar:', err);
                        UI.showNotification('Error al pausar la reproducción', 'error');
                    });
            }
        },
        
        // Reproducir canción anterior
        playPrevious: function() {
            console.log('Intentando reproducir canción anterior...');
            UI.showNotification('Cambiando a canción anterior...', 'info');
            
            // Primero verificamos si hay un dispositivo activo
            this.checkForActiveDevice()
                .then(hasDevice => {
                    if (!hasDevice) {
                        UI.showNotification('No hay dispositivo activo. Abre Spotify en otro dispositivo primero', 'error');
                        return Promise.reject('No hay dispositivo activo');
                    }
                    
                    // Si hay dispositivo activo, reproducimos la canción anterior
                    return SpotifyAuth.getToken()
                        .then(token => {
                            return $.ajax({
                                url: 'https://api.spotify.com/v1/me/player/previous',
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${token}`
                                }
                            });
                        });
                })
                .then(() => {
                    // Actualizar la UI después de un momento
                    console.log('Comando enviado correctamente, actualizando reproductor...');
                    setTimeout(() => this.getCurrentlyPlaying(), 1000);
                })
                .catch(err => {
                    console.error('Error al reproducir canción anterior:', err);
                    
                    if (err.responseJSON?.error?.reason === 'NO_ACTIVE_DEVICE') {
                        UI.showNotification('Error: Necesitas tener Spotify activo en otro dispositivo', 'error');
                    } else if (err.responseJSON?.error?.reason === 'NO_PREVIOUS_TRACK') {
                        UI.showNotification('No hay canción anterior disponible', 'info');
                    } else {
                        UI.showNotification('Error al cambiar de canción: ' + (err.responseJSON?.error?.message || 'Verifica tu conexión'), 'error');
                    }
                });
        },
        
        // Reproducir siguiente canción
        playNext: function() {
            console.log('Intentando reproducir siguiente canción...');
            UI.showNotification('Cambiando a canción siguiente...', 'info');
            
            // Primero verificamos si hay un dispositivo activo
            this.checkForActiveDevice()
                .then(hasDevice => {
                    if (!hasDevice) {
                        UI.showNotification('No hay dispositivo activo. Abre Spotify en otro dispositivo primero', 'error');
                        return Promise.reject('No hay dispositivo activo');
                    }
                    
                    // Si hay dispositivo activo, reproducimos la siguiente canción
                    return SpotifyAuth.getToken()
                        .then(token => {
                            return $.ajax({
                                url: 'https://api.spotify.com/v1/me/player/next',
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${token}`
                                }
                            });
                        });
                })
                .then(() => {
                    // Actualizar la UI después de un momento
                    console.log('Comando enviado correctamente, actualizando reproductor...');
                    setTimeout(() => this.getCurrentlyPlaying(), 1000);
                })
                .catch(err => {
                    console.error('Error al reproducir siguiente canción:', err);
                    
                    if (err.responseJSON?.error?.reason === 'NO_ACTIVE_DEVICE') {
                        UI.showNotification('Error: Necesitas tener Spotify activo en otro dispositivo', 'error');
                    } else {
                        UI.showNotification('Error al cambiar de canción: ' + (err.responseJSON?.error?.message || 'Verifica tu conexión'), 'error');
                    }
                });
        },
        
        // Verificar si hay un dispositivo activo para reproducción
        checkForActiveDevice: function() {
            return SpotifyAPI.getDevices()
                .then(response => {
                    if (response && response.devices && response.devices.length > 0) {
                        const activeDevices = response.devices.filter(device => device.is_active);
                        if (activeDevices.length > 0) {
                            console.log('Dispositivo activo encontrado:', activeDevices[0].name);
                            return true;
                        }
                        console.log('Hay dispositivos disponibles, pero ninguno está activo');
                        return false;
                    }
                    console.log('No se encontraron dispositivos disponibles');
                    return false;
                })
                .catch(err => {
                    console.error('Error al verificar dispositivos:', err);
                    return false;
                });
        },
        
        // Buscar en la canción
        seek: function(position) {
            if (!this.currentTrack || !this.currentTrack.duration_ms) return;
            
            const positionMs = Math.floor(position * this.currentTrack.duration_ms);
            
            SpotifyAuth.getToken()
                .then(token => {
                    return $.ajax({
                        url: `https://api.spotify.com/v1/me/player/seek?position_ms=${positionMs}`,
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                })
                .then(() => {
                    // Actualizar UI inmediatamente para mejor feedback
                    $('#song-progress').css('width', `${position * 100}%`);
                    $('#current-time').text(this.formatTime(positionMs / 1000));
                })
                .catch(err => {
                    console.error('Error al buscar posición:', err);
                });
        },
        
        // Reproducir canción
        play: function() {
            if (!this.currentTrack) return;
            
            this.isPlaying = true;
            $('#play-btn i').removeClass('fa-play').addClass('fa-pause');
            
            SpotifyAPI.playTrack(this.currentTrack.uri)
                .catch(err => {
                    console.error('Error al reproducir:', err);
                    UI.showNotification('Error: Necesitas tener Spotify activo en otro dispositivo', 'error');
                    this.isPlaying = false;
                    $('#play-btn i').removeClass('fa-pause').addClass('fa-play');
                });
        },
        
        // Formatear tiempo en minutos:segundos
        formatTime: function(seconds) {
            const min = Math.floor(seconds / 60);
            const sec = Math.floor(seconds % 60);
            return `${min}:${sec < 10 ? '0' + sec : sec}`;
        }
    };
    
    // Exportamos el objeto Player
    window.Player = Player;
});