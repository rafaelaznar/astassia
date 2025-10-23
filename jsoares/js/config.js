
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
    // API Key de NASA (pon aquí tu clave personal)
    // Esta clave es pública y sirve para hacer pruebas. Si usas la app mucho, pon tu propia clave.
    NASA_API_KEY: 'x7y7fDZraWoSIDUSZiy2khtqQQeMpgMLWiSrcPUo',

    // URLs de las APIs principales
    // Aquí se definen las URLs de las APIs que la app utiliza para obtener datos.
    NASA_APOD_URL: 'https://api.nasa.gov/planetary/apod',
    NASA_NEOWS_URL: 'https://api.nasa.gov/neo/rest/v1/feed',
    NASA_MARS_URL: 'https://api.nasa.gov/mars-photos/api/v1/rovers',
    NASA_EPIC_URL: 'https://api.nasa.gov/EPIC/api/natural',
    EPIC_IMAGE_BASE: 'https://epic.gsfc.nasa.gov/archive/natural',

    // Parámetros de lógica de la app
    // Aquí se definen los parámetros que afectan el comportamiento de la app.
    DANGER_THRESHOLD: 5000000, // Distancia (km) para considerar un asteroide peligroso
    MOON_DISTANCE: 384400,     // Distancia media Tierra-Luna (km)
    API_TIMEOUT: 15000,        // Tiempo máximo de espera para peticiones (ms)
    // Opciones de desarrollo
    DEBUG_MODE: false,
    USE_BACKUP: false
};

// Hacemos la configuración accesible globalmente para otros scripts
if (typeof window !== 'undefined') {
    window.APP_CONFIG = CONFIG;
}