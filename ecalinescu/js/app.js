/**
 * MusicApp - Clase principal de la aplicación
 * Maneja la búsqueda, favoritos, reproducción y toda la lógica principal
 */
class MusicApp {
    constructor() {
        this.currentResults = [];
        this.favorites = [];
        this.currentTab = 'results';
        this.isLoading = false;
        this.audioPlayer = null;
        
        this.initializeElements();
        this.initializeServices();
        this.bindEvents();
        this.loadInitialData();
    }

    /**
     * Inicializa elementos del DOM
     */
    initializeElements() {
        // Formulario de búsqueda
        this.searchForm = document.getElementById('searchForm');
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.errorMessage = document.getElementById('errorMessage');
        
        // Filtros y ordenación
        this.entityFilter = document.getElementById('entityFilter');
        this.limitFilter = document.getElementById('limitFilter');
        this.sortSelect = document.getElementById('sortSelect');
        
        // Tabs y secciones
        this.tabs = document.querySelectorAll('.tab');
        this.resultsSection = document.getElementById('resultsSection');
        this.favoritesSection = document.getElementById('favoritesSection');
        
        // Grillas de contenido
        this.resultsGrid = document.getElementById('resultsGrid');
        this.favoritesGrid = document.getElementById('favoritesGrid');
        
        // Controles adicionales
        this.loading = document.getElementById('loading');
        this.clearFavorites = document.getElementById('clearFavorites');
        this.themeToggle = document.getElementById('themeToggle');
        
        // Contadores
        this.resultsCounter = document.getElementById('resultsCounter');
        this.favoritesCounter = document.getElementById('favoritesCounter');
    }

    /**
     * Inicializa servicios
     */
    initializeServices() {
        // Inicializar servicios
        NotificationManager.init();
        ThemeManager.init();
        AuthManager.init(); // Inicializar autenticación
        
        // Crear reproductor de audio
        this.audioPlayer = new AudioPlayer();
    }

    /**
     * Vincula eventos
     */
    bindEvents() {
        // Búsqueda
        this.searchForm.addEventListener('submit', (e) => this.handleSearch(e));
        this.searchInput.addEventListener('input', () => this.handleSearchInput());
        
        // Filtros
        this.entityFilter.addEventListener('change', () => this.handleFilterChange());
        this.limitFilter.addEventListener('change', () => this.handleFilterChange());
        this.sortSelect.addEventListener('change', () => this.handleSortChange());
        
        // Tabs
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });
        
        // Controles
        this.clearFavorites.addEventListener('click', () => this.clearAllFavorites());
        this.themeToggle.addEventListener('click', () => ThemeManager.toggle());
    }

    /**
     * Carga datos iniciales
     */
    loadInitialData() {
        // Cargar favoritos desde localStorage
        this.loadFavorites();
        
        // Cargar última búsqueda si existe
        this.loadLastSearch();
        
        // Actualizar contadores
        this.updateCounters();
        
        // Actualizar UI según autenticación
        this.updateAuthenticationUI();
    }

    /**
     * Actualiza la UI según el estado de autenticación
     */
    updateAuthenticationUI() {
        const isAuthenticated = AuthManager.isAuthenticated;

        // Tab y sección de favoritos
        const favoritesTab = document.querySelector('[data-tab="favorites"]');
        if (favoritesTab) favoritesTab.style.display = isAuthenticated ? 'flex' : 'none';
        if (this.favoritesSection) {
            if (!isAuthenticated) { this.favoritesSection.classList.remove('active'); this.favoritesSection.style.display='none'; }
            else this.favoritesSection.style.display='';
        }

        // Desplegable de tipo de búsqueda
        const entityFilter = this.entityFilter;
        if (entityFilter) {
            if (!isAuthenticated) {
                const albumOpt = entityFilter.querySelector('option[value="album"]');
                const artistOpt = entityFilter.querySelector('option[value="musicArtist"]');
                if (albumOpt && !entityFilter.dataset.albumOptionSaved){ entityFilter.dataset.albumOptionText=albumOpt.textContent; entityFilter.dataset.albumOptionSaved='true'; albumOpt.remove(); }
                if (artistOpt && !entityFilter.dataset.artistOptionSaved){ entityFilter.dataset.artistOptionText=artistOpt.textContent; entityFilter.dataset.artistOptionSaved='true'; artistOpt.remove(); }
                entityFilter.value='musicTrack';
            } else {
                if (entityFilter.dataset.albumOptionSaved==='true'){ const o=document.createElement('option'); o.value='album'; o.textContent=entityFilter.dataset.albumOptionText; entityFilter.appendChild(o); delete entityFilter.dataset.albumOptionSaved; delete entityFilter.dataset.albumOptionText; }
                if (entityFilter.dataset.artistOptionSaved==='true'){ const o=document.createElement('option'); o.value='musicArtist'; o.textContent=entityFilter.dataset.artistOptionText; entityFilter.appendChild(o); delete entityFilter.dataset.artistOptionSaved; delete entityFilter.dataset.artistOptionText; }
            }
        }

        if (this.clearFavorites) this.clearFavorites.disabled = !isAuthenticated;
        if (!isAuthenticated && this.currentTab === 'favorites') this.switchTab('results');
        if (this.currentTab === 'results' && this.currentResults.length > 0) this.renderResults();
    }

    /**
     * Maneja el envío del formulario de búsqueda
     */
    async handleSearch(event) {
        event.preventDefault();
        
        const query = this.searchInput.value.trim();
        if (!this.validateSearch(query)) return;
        
        await this.performSearch(query);
    }

    /**
     * Valida la búsqueda usando RegExp
     */
    validateSearch(query) {
        this.hideError();
        
        // Validar longitud mínima
        if (query.length < CONFIG.VALIDATION.MIN_SEARCH_LENGTH) {
            this.showError(`La búsqueda debe tener al menos ${CONFIG.VALIDATION.MIN_SEARCH_LENGTH} caracteres`);
            return false;
        }
        
        // Validar longitud máxima
        if (query.length > CONFIG.VALIDATION.MAX_SEARCH_LENGTH) {
            this.showError(`La búsqueda no puede exceder ${CONFIG.VALIDATION.MAX_SEARCH_LENGTH} caracteres`);
            return false;
        }
        
        // Validar caracteres permitidos usando RegExp
        if (!CONFIG.VALIDATION.SEARCH_PATTERN.test(query)) {
            this.showError('Solo se permiten letras, números, espacios y guiones');
            return false;
        }
        
        return true;
    }

    /**
     * Realiza búsqueda en la API
     */
    async performSearch(query) {
        try {
            this.setLoading(true);
            this.switchTab('results');
            
            // Forzar búsqueda de canciones para usuarios no autenticados
            let entity = this.entityFilter.value;
            if (!AuthManager.isAuthenticated && (entity === 'album' || entity === 'musicArtist')) {
                entity = 'musicTrack';
                this.entityFilter.value = 'musicTrack';
            }
            
            const limit = parseInt(this.limitFilter.value);
            
            let response;
            
            // Usar AudioDB para artistas, iTunes para el resto
            if (entity === 'musicArtist') {
                response = await this.searchArtistsInAudioDB(query, limit);
            } else {
                response = await APIService.search(query, entity, limit);
                // Convertir resultados a instancias de Song
                this.currentResults = response.results.map(songData => new Song(songData));
            }
            
            await this.renderResults();
            this.updateCounters();
            
            // Guardar búsqueda en localStorage
            this.saveSearch(query, entity, limit);
            
            NotificationManager.show('Búsqueda completada', `Se encontraron ${response.results.length} resultados`, 'success');
            
        } catch (error) {
            console.error('Error en búsqueda:', error);
            this.showError(error.message);
            NotificationManager.show('Error', error.message, 'error');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Busca artistas exclusivamente en AudioDB API
     */
    async searchArtistsInAudioDB(query, limit = 20) {
        try {
            console.log('🎨 Buscando artistas en AudioDB:', query);
            
            // Buscar artistas similares
            const artistResults = await AudioDBService.searchSimilarArtists(query, limit);
            
            // Convertir resultados de AudioDB a formato compatible con Song
            const timestamp = Date.now();
            const songResults = artistResults.map((artistInfo, index) => {
                return {
                    trackId: `audiodb_${artistInfo.name.toLowerCase().replace(/\s+/g, '_')}_${timestamp}_${index}`,
                    artistName: artistInfo.name,
                    trackName: artistInfo.name, // Para compatibilidad
                    collectionName: artistInfo.genre || '',
                    artworkUrl100: artistInfo.image || Song.prototype.getDefaultArtwork(),
                    previewUrl: null, // Los artistas no tienen preview
                    wrapperType: 'artist',
                    trackViewUrl: artistInfo.website || null,
                    biography: artistInfo.biography,
                    genre: artistInfo.genre
                };
            });
            
            // Crear instancias de Song
            this.currentResults = songResults.map(songData => new Song(songData));
            
            return { results: songResults };
            
        } catch (error) {
            console.error('Error buscando artistas en AudioDB:', error);
            this.currentResults = [];
            return { results: [] };
        }
    }

    /**
     * Renderiza los resultados de búsqueda
     */
    async renderResults() {
        if (!this.currentResults.length) {
            this.showEmptyResults();
            return;
        }
        
        const sortedResults = this.sortResults(this.currentResults);
        
        // Crear las tarjetas de forma asíncrona
        const cardPromises = sortedResults.map(song => this.createSongCard(song, 'results'));
        const cards = await Promise.all(cardPromises);
        const html = cards.join('');
        
        this.resultsGrid.innerHTML = html;
        this.bindSongCardEvents();
    }

    /**
     * Renderiza los favoritos
     */
    async renderFavorites() {
        if (!this.favorites.length) {
            this.showEmptyFavorites();
            return;
        }
        
        // Crear las tarjetas de forma asíncrona
        const cardPromises = this.favorites.map(song => this.createSongCard(song, 'favorites'));
        const cards = await Promise.all(cardPromises);
        const html = cards.join('');
        
        this.favoritesGrid.innerHTML = html;
        this.bindSongCardEvents();
    }

    /**
     * Crea el HTML de una tarjeta de canción
     */
    async createSongCard(song, context) {
        // Usar el ID correcto dependiendo del tipo de contenido
        const itemId = song.trackId || song.collectionId;
        
        // Verificar si es favorito (solo si el ID existe y es válido y el usuario está autenticado)
        const isFavorite = itemId && AuthManager.isAuthenticated ? this.isFavorite(itemId) : false;
        
        // Configurar botón de favoritos según el estado de autenticación
        let favoriteClass, favoriteIcon, favoriteText;
        if (!AuthManager.isAuthenticated) {
            favoriteClass = 'disabled';
            favoriteIcon = 'fas fa-lock';
            favoriteText = 'Inicia sesión';
        } else {
            favoriteClass = isFavorite ? 'active' : '';
            favoriteIcon = isFavorite ? 'fas fa-heart' : 'far fa-heart';
            favoriteText = isFavorite ? 'Quitar' : 'Favorito';
        }
        
        // Detectar el tipo de contenido basado solo en los datos de la canción
        const isAlbum = song.wrapperType === 'collection';
        const isArtist = song.wrapperType === 'artist';
        const isTrack = song.wrapperType === 'track' || !song.wrapperType;
        
        // Configurar título y información según el tipo
        let title, artist, albumInfo, artworkUrl;
        
        if (isArtist) {
            title = song.artistName || 'Artista desconocido';
            artist = song.genre || ''; // Mostrar género en lugar de artista
            albumInfo = '';
            artworkUrl = song.artworkUrl100; // Ya viene de AudioDB
        } else if (isAlbum) {
            title = song.collectionName || 'Álbum desconocido';
            artist = song.artistName || 'Artista desconocido';
            // Para álbumes, mostrar información adicional
            const releaseYear = song.getReleaseYear();
            const genre = song.primaryGenreName || '';
            const trackCount = song.trackCount || '';
            
            let albumDetails = [];
            if (releaseYear && releaseYear !== new Date().getFullYear()) {
                albumDetails.push(releaseYear.toString());
            }
            if (genre) {
                albumDetails.push(genre);
            }
            if (trackCount) {
                albumDetails.push(`${trackCount} canciones`);
            }
            
            albumInfo = albumDetails.join(' • ');
            artworkUrl = song.artworkUrl100;
        } else { // isTrack o tipo por defecto
            title = song.trackName || 'Título desconocido';
            artist = song.artistName || 'Artista desconocido';
            albumInfo = song.collectionName || '';
            artworkUrl = song.artworkUrl100;
        }
        
        return `
            <div class="song-card" data-track-id="${itemId}">
                <img class="song-artwork" src="${artworkUrl}" alt="Portada de ${title}" loading="lazy">
                <div class="song-info">
                    <h3 class="song-title">${this.escapeHtml(title)}</h3>
                    ${artist ? `<p class="song-artist">${this.escapeHtml(artist)}</p>` : ''}
                    ${albumInfo ? `<p class="song-album">${this.escapeHtml(albumInfo)}</p>` : ''}
                    <div class="song-actions">
                        ${isTrack ? (song.hasPreview() ? `
                            <button class="action-btn play" data-action="play" aria-label="Reproducir ${title}">
                                <i class="fas fa-play"></i>
                                Reproducir
                            </button>
                        ` : `
                            <button class="action-btn play" disabled aria-label="Preview no disponible">
                                <i class="fas fa-times"></i>
                                Sin preview
                            </button>
                        `) : ''}
                        <button class="action-btn favorite ${favoriteClass}" data-action="favorite" aria-label="${favoriteText} ${title}">
                            <i class="${favoriteIcon}"></i>
                            ${favoriteText}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Vincula eventos a las tarjetas de canciones
     */
    bindSongCardEvents() {
        const playButtons = document.querySelectorAll('[data-action="play"]:not([disabled])');
        const favoriteButtons = document.querySelectorAll('[data-action="favorite"]');
        
        playButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handlePlaySong(e));
        });
        
        favoriteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleToggleFavorite(e));
        });
    }

    /**
     * Maneja la reproducción de una canción
     */
    handlePlaySong(event) {
        const card = event.target.closest('.song-card');
        const trackId = card.dataset.trackId;
        
        // Convertir a número solo si es un ID numérico, mantener como string si es de AudioDB
        const normalizedTrackId = this.normalizeId(trackId);
        
        const song = this.findSongById(normalizedTrackId);
        if (!song) return;
        
        // Determinar playlist actual
        const currentPlaylist = this.currentTab === 'favorites' ? this.favorites : this.currentResults;
        
        this.audioPlayer.play(song, currentPlaylist);
    }

    /**
     * Maneja agregar/quitar favoritos
     */
    handleToggleFavorite(event) {
        // Verificar que el usuario esté autenticado
        if (!AuthManager.isAuthenticated) {
            NotificationManager.show('Inicia sesión requerido', 'Debes iniciar sesión para gestionar favoritos', 'info');
            // Mostrar modal de login
            AuthManager.showModal();
            return;
        }

        const card = event.target.closest('.song-card');
        const trackId = card.dataset.trackId;
        
    // Convertir a número solo si es un ID numérico, mantener como string si es de AudioDB
    const normalizedTrackId = this.normalizeId(trackId);
        
        if (this.isFavorite(normalizedTrackId)) {
            this.removeFavorite(normalizedTrackId);
        } else {
            this.addFavorite(normalizedTrackId);
        }
        
        // Actualizar UI
        this.updateFavoriteButton(card, this.isFavorite(normalizedTrackId));
        this.updateCounters();
        
        // Re-renderizar favoritos si estamos en esa tab
        if (this.currentTab === 'favorites') {
            this.renderFavorites().catch(console.error);
        }
    }

    /**
     * Agrega una canción a favoritos
     */
    addFavorite(trackId) {
        const song = this.findSongById(trackId);
        if (!song || this.isFavorite(trackId)) return;
        
        this.favorites.push(song);
        this.saveFavorites();
        
        NotificationManager.show('Favorito agregado', `${song.trackName} se agregó a favoritos`, 'success');
    }

    /**
     * Elimina una canción de favoritos
     */
    removeFavorite(trackId) {
        // Normalizar el ID para comparación
        const normalizedTrackId = this.normalizeId(trackId);
        const songIndex = this.favorites.findIndex(song => song.trackId === normalizedTrackId);
        if (songIndex === -1) return;
        
        const song = this.favorites[songIndex];
        this.favorites.splice(songIndex, 1);
        this.saveFavorites();
        
        NotificationManager.show('Favorito eliminado', `${song.trackName} se quitó de favoritos`, 'warning');
    }

    /**
     * Verifica si una canción es favorita
     */
    isFavorite(trackId) {
        if (!trackId || !this.favorites || this.favorites.length === 0) return false;
        const normalizedTrackId = this.normalizeId(trackId);
        return this.favorites.some(song => song.trackId === normalizedTrackId);
    }

    /**
     * Encuentra una canción por ID
     */
    findSongById(trackId) {
        // Normalizar el ID para comparación
        const normalizedTrackId = this.normalizeId(trackId);
        return this.currentResults.find(song => song.trackId === normalizedTrackId) ||
               this.favorites.find(song => song.trackId === normalizedTrackId);
    }

    /**
     * Ordena los resultados según la selección
     */
    sortResults(results) {
        const sortBy = this.sortSelect.value;
        
        return [...results].sort((a, b) => {
            switch (sortBy) {
                case 'trackName':
                    return a.trackName.localeCompare(b.trackName);
                case 'artistName':
                    return a.artistName.localeCompare(b.artistName);
                case 'releaseDate':
                    return new Date(b.releaseDate) - new Date(a.releaseDate);
                default:
                    return 0;
            }
        });
    }

    /**
     * Cambia entre pestañas
     */
    switchTab(tabName) {
        // Verificar autenticación para acceder a favoritos
        if (tabName === 'favorites' && !AuthManager.isAuthenticated) {
            NotificationManager.show('Inicia sesión requerido', 'Debes iniciar sesión para ver tus favoritos', 'info');
            AuthManager.showModal();
            return;
        }

        this.currentTab = tabName;
        
        // Actualizar tabs
        this.tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // Mostrar sección correspondiente
        this.resultsSection.classList.toggle('active', tabName === 'results');
        this.favoritesSection.classList.toggle('active', tabName === 'favorites');
        
        // Renderizar contenido si es necesario
        if (tabName === 'favorites') {
            this.renderFavorites().catch(console.error);
        }
    }

    /**
     * Guarda favoritos en localStorage
     */
    saveFavorites() {
        const favoritesData = this.favorites.map(song => song.toJSON());
        StorageManager.save(CONFIG.STORAGE_KEYS.FAVORITES, favoritesData);
    }

    /**
     * Carga favoritos desde localStorage
     */
    loadFavorites() {
        try {
            const favoritesData = StorageManager.load(CONFIG.STORAGE_KEYS.FAVORITES, []);
            // Filtrar favoritos válidos (que tengan trackId)
            const validFavoritesData = favoritesData.filter(data => data && data.trackId);
            this.favorites = validFavoritesData.map(data => Song.fromJSON(data));
            
            // Limpiar favoritos duplicados por trackId
            this.removeDuplicateFavorites();
            
            console.log('📦 Favoritos cargados:', this.favorites.length);
        } catch (error) {
            console.error('Error cargando favoritos:', error);
            this.favorites = [];
        }
    }

    /**
     * Elimina favoritos duplicados basado en trackId
     */
    removeDuplicateFavorites() {
        const uniqueFavorites = [];
        const seenIds = new Set();
        
        for (const favorite of this.favorites) {
            if (!seenIds.has(favorite.trackId)) {
                seenIds.add(favorite.trackId);
                uniqueFavorites.push(favorite);
            }
        }
        
        if (uniqueFavorites.length !== this.favorites.length) {
            console.log('🧹 Eliminados favoritos duplicados:', this.favorites.length - uniqueFavorites.length);
            this.favorites = uniqueFavorites;
            this.saveFavorites(); // Guardar lista limpia
        }
    }

    /**
     * Guarda búsqueda en localStorage
     */
    saveSearch(query, entity, limit) {
        const searchData = { query, entity, limit, timestamp: Date.now() };
        StorageManager.save(CONFIG.STORAGE_KEYS.LAST_SEARCH, searchData);
    }

    /**
     * Carga última búsqueda desde localStorage
     */
    loadLastSearch() {
        const lastSearch = StorageManager.load(CONFIG.STORAGE_KEYS.LAST_SEARCH);
        if (lastSearch && (Date.now() - lastSearch.timestamp) < 86400000) { // 24 horas
            this.searchInput.value = lastSearch.query;
            this.entityFilter.value = lastSearch.entity;
            this.limitFilter.value = lastSearch.limit.toString();
        }
    }

    /**
     * Actualiza contadores
     */
    updateCounters() {
        this.resultsCounter.textContent = this.currentResults.length;
        this.favoritesCounter.textContent = this.favorites.length;
    }

    /**
     * Actualiza botón de favorito
     */
    updateFavoriteButton(card, isFavorite) {
        const favoriteBtn = card.querySelector('[data-action="favorite"]');
        const cls = isFavorite ? 'fas fa-heart' : 'far fa-heart';
        favoriteBtn.classList.toggle('active', isFavorite);
        favoriteBtn.innerHTML = `<i class="${cls}"></i>${isFavorite ? 'Quitar' : 'Favorito'}`;
        favoriteBtn.setAttribute('aria-label', `${isFavorite ? 'Quitar' : 'Agregar'} favorito`);
    }

    /**
     * Limpia todos los favoritos
     */
    clearAllFavorites() {
        // Verificar autenticación
        if (!AuthManager.isAuthenticated) {
            NotificationManager.show('Inicia sesión requerido', 'Debes iniciar sesión para gestionar favoritos', 'info');
            AuthManager.showModal();
            return;
        }

        if (this.favorites.length === 0) return;
        
        this.favorites = [];
        this.saveFavorites();
        this.renderFavorites().catch(console.error);
        this.updateCounters();
        
        NotificationManager.show('Favoritos eliminados', 'Se eliminaron todos los favoritos', 'warning');
    }

    /**
     * Limpia todos los cachés y datos (función de utilidad)
     */
    clearAllData() {
        // Limpiar favoritos
        this.favorites = [];
        this.saveFavorites();
        
        // Limpiar cachés
        StorageManager.remove(CONFIG.STORAGE_KEYS.SEARCH_CACHE);
        StorageManager.remove(CONFIG.STORAGE_KEYS.ARTIST_IMAGES_CACHE);
        StorageManager.remove(CONFIG.STORAGE_KEYS.LAST_SEARCH);
        
        // Limpiar resultados actuales
        this.currentResults = [];
        
        // Re-renderizar
        this.updateCounters();
        if (this.currentTab === 'favorites') {
            this.renderFavorites().catch(console.error);
        }
        
        console.log('🧹 Todos los datos han sido limpiados');
        NotificationManager.show('Datos limpiados', 'Se han eliminado todos los datos almacenados', 'info');
    }

    /**
     * Muestra estado de carga
     */
    setLoading(isLoading) {
        this.isLoading = isLoading;
        this.loading.classList.toggle('show', isLoading);
        this.searchBtn.disabled = isLoading;
        this.searchBtn.innerHTML = isLoading ? '<i class="fas fa-spinner fa-spin"></i> Buscando...' : '<i class="fas fa-search"></i> Buscar';
    }

    /**
     * Muestra error en el formulario
     */
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        this.searchInput.classList.add('error');
        
        // Auto-ocultar después de 5 segundos
        setTimeout(() => this.hideError(), 5000);
    }

    /**
     * Oculta error del formulario
     */
    hideError() {
        this.errorMessage.style.display = 'none';
        this.searchInput.classList.remove('error');
    }

    /**
     * Muestra estado vacío para resultados
     */
    showEmptyResults() {
        this.resultsGrid.innerHTML = `<div class="empty-state"><i class="fas fa-search"></i><h3>Sin resultados</h3><p>No se encontraron canciones para tu búsqueda. Intenta con otros términos.</p></div>`;
    }

    /**
     * Muestra estado vacío para favoritos
     */
    showEmptyFavorites() {
        this.favoritesGrid.innerHTML = `<div class="empty-state"><i class="fas fa-heart-broken"></i><h3>Sin favoritos aún</h3><p>Las canciones que marques como favoritas aparecerán aquí.</p></div>`;
    }

    /**
     * Escapa HTML para prevenir XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Maneja eventos de entrada en búsqueda
     */
    handleSearchInput() { this.hideError(); }

    /**
     * Maneja cambios en filtros
     */
    handleFilterChange() {
        // Re-ejecutar búsqueda si hay resultados
        if (this.currentResults.length > 0) {
            const query = this.searchInput.value.trim();
            if (query) {
                this.performSearch(query);
            }
        }
    }

    /**
     * Maneja cambios en ordenación
     */
    handleSortChange() { if (this.currentResults.length > 0) this.renderResults(); }

    /**
     * Normaliza IDs: número si es numérico, string si no
     */
    normalizeId(id){ return isNaN(id) ? id : parseInt(id); }

}

// Exportar a ventana global para compatibilidad
window.MusicApp = MusicApp;