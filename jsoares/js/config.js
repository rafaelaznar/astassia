
/**
 * config.js
 *
 * Este archivo contiene toda la configuración de la app Monitor de Asteroides.
 * Aquí se guardan las claves de API, URLs de los servicios de la NASA, y otros parámetros globales.
 *
 * Separar la configuración de la lógica principal es una buena práctica porque:
 * - Hace el código más ordenado y fácil de mantener.
 * - Permite cambiar claves o URLs sin tocar la lógica de la app.
 * - Ayuda a proteger información sensible (aunque en este caso, las claves son públicas de demo).
 *
 * Si eres principiante, piensa en este archivo como el "panel de control" donde puedes ajustar cómo se conecta la app con los servicios externos.
 */


const CONFIG = {
    // Yo: aquí guardo la API Key de la NASA para que la use la aplicación.
    // Si eres principiante, piensa: esto es como mi tarjeta de acceso para pedir datos a la NASA.
    // Nota: en proyectos reales no se suben claves secretas al repositorio.
    NASA_API_KEY: 'x7y7fDZraWoSIDUSZiy2khtqQQeMpgMLWiSrcPUo',

    // Yo: estas son las direcciones web (endpoints) que usaré para pedir información.
    NASA_APOD_URL: 'https://api.nasa.gov/planetary/apod',
    NASA_NEOWS_URL: 'https://api.nasa.gov/neo/rest/v1/feed',
    NASA_MARS_URL: 'https://api.nasa.gov/mars-photos/api/v1/rovers',
    NASA_EPIC_URL: 'https://api.nasa.gov/EPIC/api/natural',
    EPIC_IMAGE_BASE: 'https://epic.gsfc.nasa.gov/archive/natural',

    // Yo: parámetros que controlan el comportamiento de la app.
    DANGER_THRESHOLD: 5000000, // km - cuando un asteroide está más cerca que esto lo considero peligroso
    MOON_DISTANCE: 384400,     // km - distancia media Tierra-Luna (para comparar)
    API_TIMEOUT: 15000,        // ms - tiempo máximo que espero por una respuesta
    DEBUG_MODE: false,
    USE_BACKUP: false
};

// Yo: hago la configuración accesible desde cualquier script que cargue la página.
// Algunas partes del código usan `APP_CONFIG`, otras usan `NASA_API_KEY`. Me aseguro
// de exponer ambos para compatibilidad.
if (typeof window !== 'undefined') {
    window.APP_CONFIG = CONFIG;
    if (typeof window.NASA_API_KEY === 'undefined') {
        window.NASA_API_KEY = CONFIG.NASA_API_KEY;
    }
}