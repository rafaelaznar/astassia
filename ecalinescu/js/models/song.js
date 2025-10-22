/**
 * 🎵 MODELO SONG - Representación de canciones y artistas
 * Clase para manejar datos de iTunes API y AudioDB API
 */

'use strict';

// ===== CLASE SONG - Representación de una canción =====
class Song {
    constructor(trackData) {
        // Manejar tanto canciones (trackId) como álbumes (collectionId)
        this.trackId = trackData.trackId || trackData.collectionId || Date.now();
        this.collectionId = trackData.collectionId;
        this.wrapperType = trackData.wrapperType || 'track';
        
        this.trackName = trackData.trackName || 'Título desconocido';
        this.artistName = trackData.artistName || 'Artista desconocido';
        this.collectionName = trackData.collectionName || 'Álbum desconocido';
        this.artworkUrl100 = trackData.artworkUrl100 || this.getDefaultArtwork();
        this.artworkUrl60 = trackData.artworkUrl60 || this.artworkUrl100;
        this.previewUrl = trackData.previewUrl;
        this.trackViewUrl = trackData.trackViewUrl || trackData.collectionViewUrl;
        this.releaseDate = trackData.releaseDate ? new Date(trackData.releaseDate) : new Date();
        this.primaryGenreName = trackData.primaryGenreName || trackData.genre || 'Desconocido';
        this.country = trackData.country || 'US';
        this.currency = trackData.currency || 'USD';
        this.trackPrice = trackData.trackPrice || 0;
        this.collectionPrice = trackData.collectionPrice || 0;
        this.trackTimeMillis = trackData.trackTimeMillis || 0;
        this.trackCount = trackData.trackCount || 0; // Número de canciones en el álbum
        
        // Propiedades específicas para artistas de AudioDB
        this.biography = trackData.biography || null;
        this.genre = trackData.genre || null;
    }

    /**
     * Obtiene una imagen por defecto cuando no hay artwork disponible
     */
    getDefaultArtwork() {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik01MCA3NUMzNi4xOTMgNzUgMjUgNjMuODA3IDI1IDUwQzI1IDM2LjE5MyAzNi4xOTMgMjUgNTAgMjVDNjMuODA3IDI1IDc1IDM2LjE5MyA3NSA1MEM3NSA2My44MDcgNjMuODA3IDc1IDUwIDc1WiIgZmlsbD0iIzllYTNhOCIvPgo8cGF0aCBkPSJNNTAgNjVDNTcuMTggNjUgNjMgNTkuMTggNjMgNTJDNjMgNDQuODIgNTcuMTggMzkgNTAgMzlDNDIuODIgMzkgMzcgNDQuODIgMzcgNTJDMzcgNTkuMTggNDIuODIgNjUgNTAgNjVaIiBmaWxsPSIjZjNmNGY2Ii8+Cjwvc3ZnPgo=';
    }

    /**
     * Formatea la duración de la canción
     */
    getFormattedDuration() {
        if (!this.trackTimeMillis) return '0:30';
        const seconds = Math.floor(this.trackTimeMillis / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    /**
     * Obtiene el año de lanzamiento
     */
    getReleaseYear() {
        return this.releaseDate.getFullYear();
    }

    /**
     * Verifica si la canción tiene preview disponible
     */
    hasPreview() {
        return Boolean(this.previewUrl);
    }

    /**
     * Convierte la canción a objeto plano para almacenamiento
     */
    toJSON() {
        return {
            trackId: this.trackId,
            collectionId: this.collectionId,
            wrapperType: this.wrapperType,
            trackName: this.trackName,
            artistName: this.artistName,
            collectionName: this.collectionName,
            artworkUrl100: this.artworkUrl100,
            artworkUrl60: this.artworkUrl60,
            previewUrl: this.previewUrl,
            trackViewUrl: this.trackViewUrl,
            releaseDate: this.releaseDate.toISOString(),
            primaryGenreName: this.primaryGenreName,
            country: this.country,
            currency: this.currency,
            trackPrice: this.trackPrice,
            collectionPrice: this.collectionPrice,
            trackTimeMillis: this.trackTimeMillis,
            trackCount: this.trackCount,
            biography: this.biography,
            genre: this.genre
        };
    }

    /**
     * Crea una instancia Song desde datos JSON
     */
    static fromJSON(data) {
        return new Song(data);
    }
}

// Exportar para uso global
window.Song = Song;