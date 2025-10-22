/**
 * 🎵 CONFIGURACIÓN GLOBAL - EXPLORADOR MUSICAL
 * Constantes y configuraciones centralizadas
 */

'use strict';

// ===== CONFIGURACIÓN Y CONSTANTES =====
const CONFIG = {
    ITUNES_API_URL: 'https://itunes.apple.com/search',
    AUDIODB_API_URL: 'https://www.theaudiodb.com/api/v1/json/2',
    CORS_PROXY: 'https://api.allorigins.win/raw?url=',
    STORAGE_KEYS: {
        FAVORITES: 'musicapp_favorites',
        THEME: 'musicapp_theme',
        LAST_SEARCH: 'musicapp_last_search',
        SEARCH_CACHE: 'musicapp_search_cache',
        ARTIST_IMAGES_CACHE: 'musicapp_artist_images_cache'
    },
    VALIDATION: {
        MIN_SEARCH_LENGTH: 2,
        MAX_SEARCH_LENGTH: 100,
        SEARCH_PATTERN: /^[a-zA-Z0-9\s\-_.áéíóúñüÁÉÍÓÚÑÜ]+$/,
        NAME_PATTERN: /^[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ\s]+$/,
        EMAIL_PATTERN: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        ARTIST_PATTERN: /^[a-zA-Z0-9\s\-_.áéíóúñüÁÉÍÓÚÑÜ&]+$/
    },
    AUDIO: {
        PREVIEW_DURATION: 30,
        FADE_DURATION: 500
    },
    CACHE: {
        EXPIRY_TIME: 3600000 // 1 hora
    }
};

// Exportar para uso global
window.CONFIG = CONFIG;