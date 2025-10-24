/**
 * AudioPlayer - Reproductor de audio para las previews de canciones
 * Maneja la reproducción, controles, playlist y eventos de audio
 */
class AudioPlayer {
    constructor() {
        this.audioElement = document.getElementById('audioElement');
        this.currentSong = null;
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = CONFIG.AUDIO.PREVIEW_DURATION;
        this.playlist = [];
        this.currentIndex = -1;
        
        this.initializeElements();
        this.bindEvents();
    }

    /**
     * Inicializa elementos del DOM
     */
    initializeElements() {
        this.playerContainer = document.getElementById('audioPlayer');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.progressBar = document.getElementById('progressBar');
        this.progressFill = document.getElementById('progressFill');
        this.currentTimeDisplay = document.getElementById('currentTime');
        this.totalTimeDisplay = document.getElementById('totalTime');
        this.playerTitle = document.getElementById('playerTitle');
        this.playerArtist = document.getElementById('playerArtist');
        this.playerArtwork = document.getElementById('playerArtwork');
        this.playerClose = document.getElementById('playerClose');
    }

    /**
     * Vincula eventos del reproductor
     */
    bindEvents() {
        // Controles de reproducción
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.prevBtn.addEventListener('click', () => this.previousTrack());
        this.nextBtn.addEventListener('click', () => this.nextTrack());
        this.playerClose.addEventListener('click', () => this.hide());

        // Barra de progreso
        this.progressBar.addEventListener('click', (e) => this.seekTo(e));

        // Eventos del audio
        this.audioElement.addEventListener('loadstart', () => this.onLoadStart());
        this.audioElement.addEventListener('loadedmetadata', () => this.onLoadedMetadata());
        this.audioElement.addEventListener('timeupdate', () => this.onTimeUpdate());
        this.audioElement.addEventListener('ended', () => this.onEnded());
        this.audioElement.addEventListener('error', (e) => this.onError(e));
        this.audioElement.addEventListener('play', () => this.onPlay());
        this.audioElement.addEventListener('pause', () => this.onPause());

        // Teclas de atajo
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
    }

    /**
     * Reproduce una canción
     */
    async play(song, playlist = []) {
        try {
            if (!song || !song.hasPreview()) {
                throw new Error('La canción no tiene preview disponible');
            }

            this.currentSong = song;
            this.playlist = playlist;
            this.currentIndex = playlist.findIndex(s => s.trackId === song.trackId);

            // Actualizar UI del reproductor
            this.updatePlayerInfo();
            this.show();

            // Cargar y reproducir audio
            this.audioElement.src = song.previewUrl;
            await this.audioElement.load();
            await this.audioElement.play();

            NotificationManager.show('Reproduciendo', `${song.trackName} - ${song.artistName}`, 'success');

        } catch (error) {
            console.error('Error al reproducir:', error);
            NotificationManager.show('Error', 'No se pudo reproducir la canción', 'error');
        }
    }

    /**
     * Alterna entre reproducir y pausar
     */
    togglePlayPause() {
        if (!this.audioElement.src) return;

        if (this.isPlaying) {
            this.pause();
        } else {
            this.resume();
        }
    }

    /**
     * Pausa la reproducción
     */
    pause() {
        this.audioElement.pause();
    }

    /**
     * Reanuda la reproducción
     */
    async resume() {
        try {
            await this.audioElement.play();
        } catch (error) {
            console.error('Error al reanudar:', error);
            NotificationManager.show('Error', 'No se pudo reanudar la reproducción', 'error');
        }
    }

    /**
     * Detiene la reproducción
     */
    stop() {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        this.isPlaying = false;
        this.updatePlayPauseButton();
    }

    /**
     * Canción anterior
     */
    previousTrack() {
        if (this.playlist.length === 0 || this.currentIndex <= 0) return;
        
        const prevSong = this.playlist[this.currentIndex - 1];
        this.play(prevSong, this.playlist);
    }

    /**
     * Siguiente canción
     */
    nextTrack() {
        if (this.playlist.length === 0 || this.currentIndex >= this.playlist.length - 1) return;
        
        const nextSong = this.playlist[this.currentIndex + 1];
        this.play(nextSong, this.playlist);
    }

    /**
     * Busca a una posición específica
     */
    seekTo(event) {
        if (!this.audioElement.src) return;

        const rect = this.progressBar.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const width = rect.width;
        const percentage = clickX / width;
        const newTime = percentage * this.duration;

        this.audioElement.currentTime = Math.max(0, Math.min(newTime, this.duration));
    }

    /**
     * Actualiza la información del reproductor
     */
    updatePlayerInfo() {
        if (!this.currentSong) return;

        this.playerTitle.textContent = this.currentSong.trackName;
        this.playerArtist.textContent = this.currentSong.artistName;
        this.playerArtwork.src = this.currentSong.artworkUrl100;
        this.playerArtwork.alt = `Portada de ${this.currentSong.trackName}`;
    }

    /**
     * Actualiza la barra de progreso
     */
    updateProgress() {
        if (!this.audioElement.src) return;

        const currentTime = this.audioElement.currentTime;
        const duration = this.audioElement.duration || this.duration;
        const percentage = (currentTime / duration) * 100;

        this.progressFill.style.width = `${Math.min(percentage, 100)}%`;
        this.currentTimeDisplay.textContent = this.formatTime(currentTime);
        this.totalTimeDisplay.textContent = this.formatTime(duration);
    }

    /**
     * Actualiza el botón de play/pause
     */
    updatePlayPauseButton() {
        const icon = this.playPauseBtn.querySelector('i');
        icon.className = this.isPlaying ? 'fas fa-pause' : 'fas fa-play';
    }

    /**
     * Formatea tiempo en mm:ss
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Muestra el reproductor
     */
    show() {
        this.playerContainer.classList.add('show');
    }

    /**
     * Oculta el reproductor
     */
    hide() {
        this.stop();
        this.playerContainer.classList.remove('show');
        this.currentSong = null;
    }

    /**
     * Maneja teclas de atajo
     */
    handleKeydown(event) {
        if (!this.playerContainer.classList.contains('show')) return;

        switch (event.code) {
            case 'Space':
                event.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowLeft':
                this.previousTrack();
                break;
            case 'ArrowRight':
                this.nextTrack();
                break;
            case 'Escape':
                this.hide();
                break;
        }
    }

    // ===== EVENTOS DEL AUDIO =====
    onLoadStart() {
        console.log('Cargando audio...');
    }

    onLoadedMetadata() {
        this.duration = Math.min(this.audioElement.duration, CONFIG.AUDIO.PREVIEW_DURATION);
        this.updateProgress();
    }

    onTimeUpdate() {
        this.currentTime = this.audioElement.currentTime;
        this.updateProgress();

        // Detener después de 30 segundos (preview)
        if (this.currentTime >= CONFIG.AUDIO.PREVIEW_DURATION) {
            this.stop();
        }
    }

    onEnded() {
        this.isPlaying = false;
        this.updatePlayPauseButton();
        
        // Reproducir siguiente canción automáticamente
        setTimeout(() => {
            this.nextTrack();
        }, 1000);
    }

    onError(event) {
        console.error('Error de audio:', event);
        this.isPlaying = false;
        this.updatePlayPauseButton();
        NotificationManager.show('Error', 'Error al reproducir el audio', 'error');
    }

    onPlay() {
        this.isPlaying = true;
        this.updatePlayPauseButton();
    }

    onPause() {
        this.isPlaying = false;
        this.updatePlayPauseButton();
    }
}

// Exportar a ventana global para compatibilidad
window.AudioPlayer = AudioPlayer;