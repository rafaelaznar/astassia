// Funciones para manejar favoritos de Spotify
$(document).ready(function() {
    // Objeto para manejar los favoritos
    const Favorites = {
        // Obtener canciones favoritas del usuario
        getUserFavorites: function() {
            console.log('Obteniendo canciones favoritas...');
            
            return SpotifyAuth.getToken()
                .then(token => {
                    console.log('Token obtenido para favoritos:', token.substring(0, 10) + '...');
                    
                    return $.ajax({
                        url: 'https://api.spotify.com/v1/me/tracks',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    })
                    .then(response => {
                        console.log('Favoritos recibidos:', response);
                        return response;
                    })
                    .catch(error => {
                        console.error('Error al obtener favoritos:', error);
                        UI.showNotification('Error al cargar favoritos: ' + (error.responseJSON?.error?.message || error.statusText || 'Error desconocido'), 'error');
                        throw error;
                    });
                })
                .catch(error => {
                    console.error('Error de autenticación para favoritos:', error);
                    UI.showNotification('Necesitas iniciar sesión para ver tus favoritos', 'error');
                    throw error;
                });
        },
        
        // Renderizar favoritos en la interfaz
        renderFavorites: function(favorites) {
            if (!favorites || !favorites.items || favorites.items.length === 0) {
                return '<div class="empty-state">No tienes canciones favoritas</div>';
            }
            
            let html = '<div class="favorites-grid">';
            
            favorites.items.forEach(item => {
                if (item.track) {
                    const track = item.track;
                    const artists = track.artists.map(a => a.name).join(', ');
                    const image = track.album.images.length > 0 ? track.album.images[1].url : '';
                    
                    html += `
                        <div class="favorite-card" data-uri="${track.uri}" data-id="${track.id}">
                            <div class="favorite-image" style="background-image: url('${image}')"></div>
                            <div class="favorite-info">
                                <h3>${track.name}</h3>
                                <p>${artists}</p>
                            </div>
                            <button class="play-btn"><i class="fas fa-play"></i></button>
                        </div>
                    `;
                }
            });
            
            html += '</div>';
            return html;
        },
        
        // Cargar favoritos en la vista
        loadFavorites: function() {
            const container = $('.favorites-container');
            container.html('<div class="loader">Cargando favoritos...</div>');
            
            this.getUserFavorites()
                .then(data => {
                    container.html(this.renderFavorites(data));
                    
                    // Eventos para los favoritos
                    $('.favorite-card').on('click', function() {
                        const uri = $(this).data('uri');
                        const trackId = $(this).data('id');
                        
                        SpotifyAPI.getTrack(trackId)
                            .then(track => {
                                Player.loadTrack(track);
                            })
                            .catch(err => {
                                console.error('Error al cargar la canción:', err);
                                UI.showNotification('Error al cargar la canción', 'error');
                            });
                    });
                })
                .catch(() => {
                    container.html('<div class="empty-state">Error al cargar favoritos.<br>Asegúrate de iniciar sesión en Spotify.</div>');
                });
        },
        
        // Añadir canción a favoritos
        addToFavorites: function(trackId) {
            return SpotifyAuth.getToken()
                .then(token => {
                    return $.ajax({
                        url: `https://api.spotify.com/v1/me/tracks`,
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        data: JSON.stringify({
                            ids: [trackId]
                        })
                    });
                })
                .then(() => {
                    UI.showNotification('Canción añadida a favoritos', 'success');
                })
                .catch(error => {
                    console.error('Error al añadir a favoritos:', error);
                    UI.showNotification('Error al añadir a favoritos', 'error');
                });
        },
        
        // Comprobar si una canción está en favoritos
        isInFavorites: function(trackId) {
            return SpotifyAuth.getToken()
                .then(token => {
                    return $.ajax({
                        url: `https://api.spotify.com/v1/me/tracks/contains?ids=${trackId}`,
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                })
                .then(response => {
                    return response[0] || false;
                })
                .catch(() => {
                    return false;
                });
        }
    };
    
    // Exportar el objeto
    window.Favorites = Favorites;
});