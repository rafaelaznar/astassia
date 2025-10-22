/**
 * Init - Inicialización y manejo de errores globales de la aplicación
 * Punto de entrada principal para arrancar el Explorador Musical
 */

// ===== INICIALIZACIÓN DE LA APLICACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎵 Iniciando Explorador Musical...');
    
    // Verificar compatibilidad del navegador
    if (!window.fetch) {
        alert('Tu navegador no es compatible. Por favor actualiza a una versión más reciente.');
        return;
    }
    
    if (!StorageManager.isAvailable()) {
        console.warn('sessionStorage no disponible. Los favoritos y configuraciones no se guardarán.');
    }
    
    // Inicializar aplicación
    try {
        window.musicApp = new MusicApp();
        
        // Funciones de debugging disponibles en consola
        window.debugMusicApp = {
            clearAllData: () => window.musicApp.clearAllData(),
            showFavorites: () => console.table(window.musicApp.favorites.map(f => ({id: f.trackId, name: f.trackName, artist: f.artistName}))),
            clearFavorites: () => {
                window.musicApp.favorites = [];
                window.musicApp.saveFavorites();
                window.musicApp.updateCounters();
                console.log('✅ Favoritos limpiados');
            }
        };
        
        console.log('✅ Aplicación iniciada correctamente');
        console.log('🐛 Usa window.debugMusicApp para debugging');
    } catch (error) {
        console.error('❌ Error al inicializar la aplicación:', error);
        alert('Error al cargar la aplicación. Por favor recarga la página.');
    }
});

// ===== MANEJO DE ERRORES GLOBALES =====
window.addEventListener('error', (event) => {
    console.error('Error global:', event.error);
    
    // Solo mostrar notificación para errores críticos, no para errores menores
    if (window.musicApp && event.error && event.error.message && 
        !event.error.message.includes('Non-Error promise rejection captured') &&
        !event.filename?.includes('input') &&
        event.error.name !== 'TypeError') {
        NotificationManager.show('Error', 'Se produjo un error inesperado', 'error');
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Promesa rechazada:', event.reason);
    
    // Solo mostrar notificación para promesas críticas rechazadas
    if (window.musicApp && event.reason && 
        typeof event.reason === 'object' && 
        event.reason.message &&
        !event.reason.message.includes('fetch')) {
        NotificationManager.show('Error', 'Error en operación asíncrona', 'error');
    }
});