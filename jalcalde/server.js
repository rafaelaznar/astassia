const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto'); // Para generar estados aleatorios

// Cargar configuración
let config;
try {
    config = require('./config.json');
} catch (error) {
    console.error('Error al cargar el archivo de configuración:', error);
    config = {
        server: { host: '127.0.0.1', port: 5500 },
        spotify: {
            clientId: '77f18f8e2d84455e948c2a4a28f76b3a',
            clientSecret: '2ebef2de34f749edad2b730618af3acd',
            redirectUri: 'http://127.0.0.1:5500/callback'
        }
    };
}

const app = express();
const PORT = process.env.PORT || config.server.port;
const HOST = config.server.host;

// Función para verificar si estamos en el directorio correcto
function ensureCorrectDirectory() {
    // Simplemente verificamos que exista el archivo package.json en el directorio actual
    // para comprobar que estamos en un directorio de proyecto válido
    try {
        require('./package.json');
        console.log('Ejecutando desde un directorio de proyecto válido: ' + process.cwd());
        return true;
    } catch (error) {
        console.error('Error: No se encontró el archivo package.json en el directorio actual.');
        console.error('Asegúrate de ejecutar el servidor desde el directorio raíz del proyecto.');
        return false;
    }
}

// Configuración de CORS
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname)));

// Redirección de /jalcalde/index.html a la raíz
app.get('/jalcalde/index.html', (req, res) => {
    res.redirect('/');
});

// Ruta para servir index.html en la ruta raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta para iniciar el proceso de autenticación de Spotify desde el servidor
app.get('/login', (req, res) => {
    const state = crypto.randomBytes(16).toString('hex');
    const { clientId, redirectUri } = config.spotify;
    // Ampliamos los permisos para incluir todas las funcionalidades necesarias
    const scopes = 'user-read-private user-read-email user-read-playback-state user-modify-playback-state user-library-read user-library-modify playlist-read-private playlist-read-collaborative user-read-currently-playing';
    
    const authUrl = new URL('https://accounts.spotify.com/authorize');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('scope', scopes);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('state', state);
    
    console.log('Redirigiendo a Spotify para autenticación con permisos completos');
    res.redirect(authUrl.toString());
});

// Ruta para intercambiar el código por un token
app.post('/exchange-token', async (req, res) => {
    try {
        const { code } = req.body;
        
        if (!code) {
            return res.status(400).json({ error: 'Código de autorización no proporcionado' });
        }
        
        // Credenciales de Spotify desde la configuración
        const { clientId, clientSecret, redirectUri } = config.spotify;
        
        // Datos para la solicitud a Spotify
        const data = new URLSearchParams();
        data.append('grant_type', 'authorization_code');
        data.append('code', code);
        data.append('redirect_uri', redirectUri);
        
        // Solicitud a la API de Spotify
        console.log('Enviando solicitud a Spotify para intercambiar código...');
        const response = await axios({
            method: 'post',
            url: 'https://accounts.spotify.com/api/token',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
            },
            data: data
        });
        
        console.log('Respuesta de Spotify recibida:', {
            access_token: response.data.access_token ? '***TOKEN***' : undefined,
            token_type: response.data.token_type,
            expires_in: response.data.expires_in,
            scope: response.data.scope
        });
        
        if (!response.data.access_token) {
            console.error('Error: No se recibió un token de acceso válido de Spotify');
            return res.status(401).json({
                error: 'No se recibió un token válido de Spotify',
                details: response.data
            });
        }
        
        // Enviar la respuesta al cliente
        return res.json(response.data);
    } catch (error) {
        console.error('Error al intercambiar el token:', error.response?.data || error.message);
        
        // Registro detallado para depuración
        if (error.response) {
            console.error('Respuesta de error de Spotify:', error.response.data);
            console.error('Código de estado:', error.response.status);
            console.error('Headers:', error.response.headers);
        } else if (error.request) {
            console.error('No se recibió respuesta de Spotify:', error.request);
        } else {
            console.error('Error al configurar la solicitud:', error.message);
        }
        
        return res.status(500).json({ 
            error: 'Error al procesar la solicitud',
            details: error.response?.data || error.message
        });
    }
});

// Manejo de la ruta de callback
app.get('/callback', (req, res) => {
    // Verificar si hay un código o error en la URL
    const code = req.query.code;
    const error = req.query.error;
    
    console.log('Callback recibido:', code ? 'Con código de autorización' : 'Sin código');
    
    if (error) {
        console.error('Error en la autorización de Spotify:', error);
    }
    
    // Enviamos el index.html para que el cliente maneje el código
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta para verificar la validez de un token
app.get('/verify-token', async (req, res) => {
    try {
        const token = req.query.token;
        
        if (!token) {
            return res.status(401).json({ valid: false, error: 'No se proporcionó un token' });
        }
        
        console.log('Verificando token de Spotify...');
        
        const response = await axios({
            method: 'get',
            url: 'https://api.spotify.com/v1/me',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Token válido. Usuario:', response.data.display_name);
        
        return res.json({
            valid: true,
            user: {
                id: response.data.id,
                name: response.data.display_name,
                email: response.data.email,
                image: response.data.images?.[0]?.url
            }
        });
    } catch (error) {
        console.error('Error al verificar token:', error.response?.data || error.message);
        return res.status(401).json({
            valid: false,
            error: 'Token inválido o expirado'
        });
    }
});

// Todas las demás rutas no manejadas anteriormente deben servir index.html para la SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar el servidor
if (ensureCorrectDirectory()) {
    app.listen(PORT, HOST, () => {
        console.log(`===========================================`);
        console.log(`Servidor iniciado en http://${HOST}:${PORT}`);
        console.log(`Abre tu navegador en http://${HOST}:${PORT} para usar la aplicación`);
        console.log(`===========================================`);
    });
} else {
    console.error('Error: El servidor debe ejecutarse desde el directorio raíz del proyecto');
}