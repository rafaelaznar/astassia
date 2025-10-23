$(document).ready(function() {
    // Objeto para manejar llamadas a la API
    const SpotifyAPI = {
        // Obtener detalles de una canción
        getTrack: async function(trackId) {
            try {
                console.log('Obteniendo información de la canción:', trackId);
                const token = await SpotifyAuth.getToken();
                const response = await $.ajax({
                    url: `https://api.spotify.com/v1/tracks/${trackId}`,
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log('Información de canción recibida:', response);
                return response;
            } catch (error) {
                console.error("Error al obtener información de la canción:", error);
                UI.showNotification('Error al obtener información de la canción', 'error');
                throw error;
            }
        },
        
        // Controlar la reproducción (requiere una sesión activa de Spotify)
        playTrack: function(uri) {
            console.log('Intentando reproducir:', uri);
            
            return SpotifyAuth.getToken()
                .then(token => {
                    return $.ajax({
                        url: 'https://api.spotify.com/v1/me/player/play',
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        data: JSON.stringify({
                            uris: [uri]
                        })
                    })
                    .then(() => {
                        console.log('Reproducción iniciada correctamente');
                        return true;
                    })
                    .catch(error => {
                        console.error('Error al iniciar reproducción:', error);
                        
                        // Detectar error específico de falta de dispositivo activo
                        if (error.responseJSON?.error?.reason === 'NO_ACTIVE_DEVICE') {
                            UI.showNotification('Error: Necesitas tener Spotify activo en otro dispositivo', 'error');
                        } else {
                            UI.showNotification('Error al reproducir: ' + (error.responseJSON?.error?.message || 'Verifica tu cuenta de Spotify'), 'error');
                        }
                        throw error;
                    });
                });
        },
        
        // Obtener las canciones favoritas del usuario
        getUserFavorites: async function() {
            try {
                console.log('Obteniendo canciones favoritas...');
                const token = await SpotifyAuth.getToken();
                const response = await $.ajax({
                    url: 'https://api.spotify.com/v1/me/tracks',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log('Favoritos recibidos:', response);
                return response;
            } catch (error) {
                console.error('Error al obtener favoritos:', error);
                UI.showNotification('Error al cargar favoritos', 'error');
                throw error;
            }
        },
        
        // Obtener playlists del usuario
        getUserPlaylists: async function() {
            try {
                console.log('Obteniendo playlists...');
                const token = await SpotifyAuth.getToken();
                const response = await $.ajax({
                    url: 'https://api.spotify.com/v1/me/playlists',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log('Playlists recibidas:', response);
                return response;
            } catch (error) {
                console.error('Error al obtener playlists:', error);
                UI.showNotification('Error al cargar playlists', 'error');
                throw error;
            }
        },
        
        // Obtener canción que se está reproduciendo actualmente
        getCurrentlyPlaying: async function() {
            try {
                const token = await SpotifyAuth.getToken();
                const response = await $.ajax({
                    url: 'https://api.spotify.com/v1/me/player/currently-playing',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log('Reproducción actual:', response);
                return response;
            } catch (error) {
                console.log('No hay reproducción actual o error al obtenerla:', error);
                return null;
            }
        },
        
        // Obtener dispositivos disponibles
        getDevices: async function() {
            try {
                console.log('Obteniendo dispositivos disponibles...');
                const token = await SpotifyAuth.getToken();
                const response = await $.ajax({
                    url: 'https://api.spotify.com/v1/me/player/devices',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log('Dispositivos disponibles:', response);
                
                // Si hay dispositivos, mostrar información
                if (response && response.devices && response.devices.length > 0) {
                    const activeDevice = response.devices.find(d => d.is_active);
                    if (activeDevice) {
                        console.log('Dispositivo activo encontrado:', activeDevice.name, '(volumen:', activeDevice.volume_percent, '%)');
                        UI.showNotification(`Usando dispositivo: ${activeDevice.name}`, 'info');
                    } else {
                        console.log('Hay dispositivos disponibles pero ninguno está activo');
                        // Intentar activar el primer dispositivo disponible
                        this.transferPlayback(response.devices[0].id)
                            .then(() => console.log('Playback transferido a:', response.devices[0].name))
                            .catch(err => console.error('Error al transferir playback:', err));
                    }
                } else {
                    console.log('No se encontraron dispositivos disponibles');
                    UI.showNotification('No hay dispositivos de Spotify disponibles. Abre Spotify en tu dispositivo.', 'error');
                }
                
                return response;
            } catch (error) {
                console.error('Error al obtener dispositivos:', error);
                UI.showNotification('Error al verificar dispositivos de Spotify', 'error');
                return { devices: [] };
            }
        },
        
        // Transferir reproducción a un dispositivo específico
        transferPlayback: async function(deviceId) {
            try {
                console.log('Transfiriendo reproducción al dispositivo:', deviceId);
                const token = await SpotifyAuth.getToken();
                const response = await $.ajax({
                    url: 'https://api.spotify.com/v1/me/player',
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    data: JSON.stringify({
                        device_ids: [deviceId],
                        play: false
                    })
                });
                console.log('Reproducción transferida correctamente');
                return true;
            } catch (error) {
                console.error('Error al transferir reproducción:', error);
                return false;
            }
        }
    };
    
    // Exportamos el objeto API
    window.SpotifyAPI = SpotifyAPI;
});