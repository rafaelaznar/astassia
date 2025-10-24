// Funciones para manejar playlists de Spotify
$(document).ready(function() {
    // Objeto para manejar las playlists
    const Playlists = {
        // Obtener playlists del usuario
        getUserPlaylists: function() {
            console.log('Obteniendo playlists del usuario...');
            
            return SpotifyAuth.getToken()
                .then(token => {
                    console.log('Token obtenido para playlists:', token.substring(0, 10) + '...');
                    
                    return $.ajax({
                        url: 'https://api.spotify.com/v1/me/playlists',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    })
                    .then(response => {
                        console.log('Playlists recibidas:', response);
                        return response;
                    })
                    .catch(error => {
                        console.error('Error al obtener playlists:', error);
                        UI.showNotification('Error al cargar las playlists: ' + (error.responseJSON?.error?.message || error.statusText || 'Error desconocido'), 'error');
                        throw error;
                    });
                })
                .catch(error => {
                    console.error('Error de autenticación para playlists:', error);
                    UI.showNotification('Necesitas iniciar sesión para ver tus playlists', 'error');
                    throw error;
                });
        },
        
        // Renderizar playlists en la interfaz
        renderPlaylists: function(playlists) {
            if (!playlists || !playlists.items || playlists.items.length === 0) {
                return '<div class="empty-state">No tienes playlists disponibles</div>';
            }
            
            let html = '<div class="playlists-grid">';
            
            playlists.items.forEach(playlist => {
                const image = playlist.images && playlist.images.length > 0 
                    ? playlist.images[0].url 
                    : 'https://via.placeholder.com/150?text=Playlist';
                
                html += `
                    <div class="playlist-card" data-id="${playlist.id}">
                        <div class="playlist-image" style="background-image: url('${image}')"></div>
                        <div class="playlist-info">
                            <h3>${playlist.name}</h3>
                            <p>${playlist.tracks.total} canciones</p>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            return html;
        },
        
        // Cargar playlist en la vista
        loadPlaylists: function() {
            const container = $('.playlists-container');
            container.html('<div class="loader">Cargando playlists...</div>');
            
            this.getUserPlaylists()
                .then(data => {
                    container.html(this.renderPlaylists(data));
                    
                    // Eventos para las playlists
                    $('.playlist-card').on('click', function() {
                        const playlistId = $(this).data('id');
                        Playlists.getPlaylistTracks(playlistId);
                    });
                })
                .catch(() => {
                    container.html('<div class="empty-state">Error al cargar playlists.<br>Asegúrate de iniciar sesión en Spotify.</div>');
                });
        },
        
        // Obtener canciones de una playlist
        getPlaylistTracks: function(playlistId) {
            SpotifyAuth.getToken()
                .then(token => {
                    return $.ajax({
                        url: `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                })
                .then(data => {
                    // Mostrar las canciones de la playlist
                    let tracksHTML = '<div class="playlist-tracks">';
                    tracksHTML += '<h2>Canciones de la playlist</h2>';
                    
                    if (data.items && data.items.length > 0) {
                        tracksHTML += '<ul class="tracks-list">';
                        
                        data.items.forEach(item => {
                            if (item.track) {
                                const track = item.track;
                                const artists = track.artists.map(a => a.name).join(', ');
                                const image = track.album.images.length > 0 ? track.album.images[2].url : '';
                                
                                tracksHTML += `
                                    <li class="track-item" data-uri="${track.uri}">
                                        <img src="${image}" alt="${track.name}" class="track-image">
                                        <div class="track-details">
                                            <span class="track-name">${track.name}</span>
                                            <span class="track-artist">${artists}</span>
                                        </div>
                                        <button class="play-track-btn"><i class="fas fa-play"></i></button>
                                    </li>
                                `;
                            }
                        });
                        
                        tracksHTML += '</ul>';
                    } else {
                        tracksHTML += '<p>Esta playlist no tiene canciones</p>';
                    }
                    
                    tracksHTML += '</div>';
                    
                    // Mostrar en la interfaz
                    $('.playlists-container').html(tracksHTML);
                    
                    // Agregar eventos de reproducción
                    $('.track-item').on('click', function() {
                        const uri = $(this).data('uri');
                        SpotifyAPI.playTrack(uri)
                            .then(() => {
                                UI.showNotification('Reproduciendo canción');
                            })
                            .catch(err => {
                                console.error('Error al reproducir:', err);
                                UI.showNotification('Error: Necesitas tener Spotify activo en otro dispositivo', 'error');
                            });
                    });
                })
                .catch(error => {
                    console.error('Error al obtener canciones de la playlist:', error);
                    UI.showNotification('Error al cargar las canciones', 'error');
                });
        }
    };
    
    // Exportar el objeto
    window.Playlists = Playlists;
});