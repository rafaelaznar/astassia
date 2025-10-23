# Mini Reproductor de Spotify

Esta es una pequeña aplicación web que utiliza la API de Spotify para crear un minireproductor de música dentro de la página web.

## Características

- Autenticación con OAuth 2.0 usando la API de Spotify
- Reproducción de música (requiere una sesión activa de Spotify en otro dispositivo)
- Gestión de canciones favoritas
- Visualización de playlists
- Interfaz responsive y moderna
- Aplicación de página única (SPA) construida con jQuery

## Credenciales de Spotify

Esta aplicación utiliza las siguientes credenciales de Spotify:
- **Client ID**: 77f18f8e2d84455e948c2a4a28f76b3a
- **Client Secret**: 2ebef2de34f749edad2b730618af3acd
- **Redirect URIs**: 
  - http://127.0.0.1:5500
  - http://127.0.0.1:5500/callback

## Configuración

### En Windows

1. Asegúrate de tener Node.js instalado en tu sistema.
2. Haz doble clic en el archivo `iniciar_servidor.bat` o abre una terminal en la carpeta del proyecto y ejecuta:
   ```
   npm install
   npm start
   ```
3. Abre la aplicación en tu navegador accediendo a http://127.0.0.1:5500
4. Inicia sesión con tu cuenta de Spotify cuando se te solicite.

### En Linux

1. Asegúrate de tener Node.js instalado en tu sistema.
2. Abre una terminal en la carpeta del proyecto.
3. Da permisos de ejecución al script de inicio:
   ```
   chmod +x iniciar_servidor.sh
   ```
4. Ejecuta el script de inicio:
   ```
   ./iniciar_servidor.sh
   ```
   
   Alternativamente, puedes usar npm:
   ```
   npm run linux
   ```
5. Abre la aplicación en tu navegador accediendo a http://127.0.0.1:5500
6. Inicia sesión con tu cuenta de Spotify cuando se te solicite.

## Estructura de Archivos

```
jalcalde/
├── index.html              # Página de instrucciones (entrada principal)
├── inicio.html             # Aplicación del reproductor de Spotify
├── iniciar_servidor.bat    # Script de inicio para Windows
├── iniciar_servidor.sh     # Script de inicio para Linux
├── server.js               # Servidor Node.js
├── package.json            # Configuración y dependencias del proyecto
├── css/
│   ├── styles.css          # Estilos generales
│   ├── player.css          # Estilos específicos del reproductor
│   └── extras.css          # Estilos adicionales
└── js/
    ├── app.js              # Lógica principal de la aplicación
    ├── auth.js             # Manejo de autenticación con Spotify
    ├── api.js              # Interacción con la API de Spotify
    ├── player.js           # Control del reproductor de música
    ├── favorites.js        # Gestión de favoritos
    └── playlists.js        # Gestión de playlists
```

## Instrucciones de uso

1. **Inicio**: Página principal con información general.
2. **Buscar**: Busca canciones, artistas o álbumes.
3. **Favoritos**: (Funcionalidad futura) Guarda tus canciones favoritas.
4. **Playlists**: (Funcionalidad futura) Visualiza y gestiona tus playlists.

## Requisitos

- Un navegador web moderno (Chrome, Firefox, Edge, Safari)
- Conexión a internet
- Cuenta de Spotify (gratuita o premium)

## Notas importantes

- Para la reproducción de música, necesitas tener abierto Spotify en otro dispositivo (por restricciones de la API).
- El token de autenticación expira después de 1 hora, por lo que podrías necesitar iniciar sesión nuevamente.
- Esta es una aplicación de demostración y no para uso comercial.

## Desarrollo

Para modificar o extender esta aplicación:

1. Clona este repositorio.
2. Realiza tus cambios.
3. Si necesitas cambiar las credenciales de Spotify, actualiza los valores en `js/auth.js`.