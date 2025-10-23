/**
 * Archivo de Configuración - Ejemplo
 * 
 * INSTRUCCIONES:
 * 1. Copiar este archivo y renombrarlo a 'config.js'
 * 2. Obtener tu API Key gratuita en: https://api.nasa.gov/
 * 3. Reemplazar 'DEMO_KEY' con tu API Key personal
 * 4. NO subir config.js a GitHub (está en .gitignore)
 * 
 * LÍMITES DE DEMO_KEY:
 * - 30 peticiones por hora
 * - 50 peticiones por día por dirección IP
 * 
 * LÍMITES DE API KEY PERSONAL (GRATIS):
 * - 1,000 peticiones por hora
 * - Sin límite diario
 */
/**
 * Archivo de Configuración - Monitor de Asteroides NEO
 */

const CONFIG = {
    // API Key de NASA
    NASA_API_KEY: 'x7y7fDZraWoSIDUSZiy2khtqQQeMpgMLWiSrcPUo',
    
    // URLs de las APIs
    NASA_APOD_URL: 'https://api.nasa.gov/planetary/apod',
    NASA_NEOWS_URL: 'https://api.nasa.gov/neo/rest/v1/feed',
    NASA_MARS_URL: 'https://api.nasa.gov/mars-photos/api/v1/rovers',
    NASA_EPIC_URL: 'https://api.nasa.gov/EPIC/api/natural',
    EPIC_IMAGE_BASE: 'https://epic.gsfc.nasa.gov/archive/natural',
    
    // Configuraciones del proyecto
    DANGER_THRESHOLD: 5000000,
    MOON_DISTANCE: 384400,
    
    // Timeouts
    API_TIMEOUT: 15000,
    
    // Desarrollo
    DEBUG_MODE: false,
    USE_BACKUP: false
};

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.APP_CONFIG = CONFIG;
}
/**
 * EJEMPLO DE USO:
 * 
 * En HTML:
 * <script src="config.js"></script>
 * 
 * En JavaScript:
 * fetch(`${CONFIG.NASA_APOD_URL}?api_key=${CONFIG.NASA_API_KEY}`)
 * 
 * NOTA: Si prefieres mantener la API key directamente en el código,
 * simplemente cambia 'DEMO_KEY' por tu clave en los archivos HTML.
 */