$(document).ready(function() {
    // Credenciales de la aplicación Spotify (necesitarás registrar tu app en Spotify Developer)
    const clientId = '77f18f8e2d84455e948c2a4a28f76b3a';
    const clientSecret = '2ebef2de34f749edad2b730618af3acd';
    // Usamos la URL del callback específica para asegurar consistencia
    const redirectUri = 'http://127.0.0.1:5500/callback';
    // Scope de permisos necesarios para todas las funcionalidades
    const scopes = 'user-read-private user-read-email user-read-playback-state user-modify-playback-state user-library-read user-library-modify playlist-read-private playlist-read-collaborative user-read-currently-playing';
    
    // Función para obtener el token de acceso
    function getAccessToken() {
        // Si ya tenemos un token almacenado y es válido, lo usamos
        const expireTime = localStorage.getItem('tokenExpire');
        const accessToken = localStorage.getItem('spotifyToken');
        
        if (accessToken && expireTime && new Date().getTime() < expireTime) {
            // Verificar que el token sigue siendo válido con el servidor
            return verifyToken(accessToken)
                .then(valid => {
                    if (valid) {
                        console.log('Token validado correctamente');
                        return accessToken;
                    } else {
                        console.log('Token inválido o expirado, solicitando uno nuevo');
                        localStorage.removeItem('spotifyToken');
                        localStorage.removeItem('tokenExpire');
                        return refreshAuthentication();
                    }
                })
                .catch(error => {
                    console.error('Error al verificar el token:', error);
                    return accessToken; // En caso de error en la verificación, intentamos usar el token de todos modos
                });
        }
        
        // Verificar si estamos en la URL de callback con un código o si necesitamos redirigir
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        
        // Si no hay código ni token válido, redirigimos a la autenticación
        if (!code && !window.location.search.includes('code=')) {
            // Usamos la ruta del servidor para iniciar la autenticación (más segura)
            window.location = '/login';
            return Promise.reject('Redirecting to Spotify auth');
        }
        
        // Procesar el código de autorización de la URL tras redirección
        
        if (error) {
            console.error("Error de autenticación:", error);
            return Promise.reject(`Error de autenticación: ${error}`);
        }
        
        if (code) {
            // Intercambiar el código por un token de acceso usando nuestro proxy
            console.log('Intercambiando código por token...', code);
            return $.ajax({
                url: '/exchange-token',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({
                    code: code
                })
            }).then(response => {
                console.log('Respuesta de intercambio de token:', response);
                
                if (!response || !response.access_token) {
                    console.error('No se recibió un token válido:', response);
                    return Promise.reject('No se recibió un token válido');
                }
                
                const token = response.access_token;
                const expires = response.expires_in || 3600;
                
                console.log('Token recibido. Expira en:', expires, 'segundos');
                
                localStorage.setItem('spotifyToken', token);
                localStorage.setItem('tokenExpire', new Date().getTime() + (parseInt(expires) * 1000));
                
                // Limpiamos la URL
                history.pushState("", document.title, window.location.pathname);
                return token;
            }).catch(err => {
                console.error("Error al intercambiar el código:", err);
                return Promise.reject('Error al obtener el token');
            });
        }
        
        // Si no hay token ni código
        return Promise.reject('No hay autorización disponible');
    }
    
    // Función para verificar la validez de un token
    function verifyToken(token) {
        return $.ajax({
            url: `/verify-token?token=${encodeURIComponent(token)}`,
            method: 'GET'
        })
        .then(response => {
            if (response.valid) {
                // Actualizar información del usuario si está disponible
                if (response.user) {
                    localStorage.setItem('spotifyUser', JSON.stringify(response.user));
                    
                    // Actualizar UI si el usuario está disponible
                    $('.user-info .user-name').text(response.user.name || 'Usuario');
                    if (response.user.image) {
                        $('.user-info .avatar').html(`<img src="${response.user.image}" alt="Avatar" />`);
                    }
                }
                return true;
            }
            return false;
        })
        .catch(() => false);
    }
    
    // Función para renovar la autenticación
    function refreshAuthentication() {
        // Redirigir al flujo de autenticación
        window.location = '/login';
        return Promise.reject('Redirigiendo a autenticación');
    }
    
    // Exportamos las funciones para usarlas en otros módulos
    window.SpotifyAuth = {
        getToken: getAccessToken,
        verifyToken: verifyToken,
        refresh: refreshAuthentication
    };
});