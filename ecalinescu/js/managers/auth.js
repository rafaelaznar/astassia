/**
 * AuthManager - Gestión de autenticación de usuarios
 * Maneja el login, logout, validación y gestión de usuarios
 */
class AuthManager {
    static currentUser = null;
    static isAuthenticated = false;

    /**
     * Inicializa el sistema de autenticación
     */
    static init() {
        this.bindEvents();
        this.loadUser();
    }

    /**
     * Vincula eventos del formulario
     */
    static bindEvents() {
        const authBtn = document.getElementById('authBtn');
        const authModal = document.getElementById('authModal');
        const authModalClose = document.getElementById('authModalClose');
        const authForm = document.getElementById('authForm');
        const cancelAuth = document.getElementById('cancelAuth');

        // Logout modal elementos
        const logoutModal = document.getElementById('logoutModal');
        const cancelLogout = document.getElementById('cancelLogout');
        const confirmLogout = document.getElementById('confirmLogout');

        // Abrir modal
        authBtn?.addEventListener('click', () => this.showModal());
        
        // Cerrar modal (solo si no está autenticado)
        authModalClose?.addEventListener('click', () => {
            if (!this.isAuthenticated) this.hideModal();
        });
        cancelAuth?.addEventListener('click', () => {
            if (!this.isAuthenticated) this.hideModal();
        });
        
        // Cerrar con clic fuera del modal (solo si no está autenticado)
        authModal?.addEventListener('click', (e) => {
            if (e.target === authModal && !this.isAuthenticated) {
                this.hideModal();
            }
        });

        // Eventos del logout modal
        cancelLogout?.addEventListener('click', () => this.hideLogoutModal());
        confirmLogout?.addEventListener('click', () => {
            this.hideLogoutModal();
            this.logout();
        });

        // Cerrar logout modal con clic fuera
        logoutModal?.addEventListener('click', (e) => {
            if (e.target === logoutModal) {
                this.hideLogoutModal();
            }
        });

        // Validación en tiempo real
        const inputs = ['userName', 'userEmail'];
        inputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            input?.addEventListener('input', () => this.validateField(inputId));
            input?.addEventListener('blur', () => this.validateField(inputId));
        });

        // Validación especial para artista favorito con debounce
        const favoriteArtistInput = document.getElementById('favoriteArtist');
        let artistValidationTimeout;
        
        favoriteArtistInput?.addEventListener('input', () => {
            // Limpiar timeout anterior
            clearTimeout(artistValidationTimeout);
            
            // Limpiar estado de validación anterior
            favoriteArtistInput.dataset.artistValidated = 'false';
            
            // Validación básica inmediata
            this.validateField('favoriteArtist');
            
            // Programar validación asíncrona con delay
            const value = favoriteArtistInput.value.trim();
            if (value && value.length >= 2) {
                artistValidationTimeout = setTimeout(() => {
                    this.validateArtistAsync('favoriteArtist', value);
                }, 1000); // 1 segundo de delay
            }
        });
        
        favoriteArtistInput?.addEventListener('blur', () => {
            const value = favoriteArtistInput.value.trim();
            if (value && value.length >= 2 && !favoriteArtistInput.classList.contains('validating')) {
                this.validateArtistAsync('favoriteArtist', value);
            }
        });

        // Submit del formulario
        authForm?.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    /**
     * Muestra el modal de autenticación o logout
     */
    static showModal() {
        // Si ya está autenticado, mostrar menú de logout
        if (this.isAuthenticated) {
            this.showLogoutMenu();
            return;
        }
        
        const modal = document.getElementById('authModal');
        modal?.classList.add('show');
        
        // Enfocar primer campo
        setTimeout(() => {
            document.getElementById('userName')?.focus();
        }, 100);
    }

    /**
     * Muestra el menú de logout
     */
    static showLogoutMenu() {
        const logoutModal = document.getElementById('logoutModal');
        const logoutUserName = document.getElementById('logoutUserName');
        
        if (logoutUserName && this.currentUser) {
            logoutUserName.textContent = this.currentUser.name;
        }
        
        logoutModal?.classList.add('show');
        
        // Enfocar botón de cancelar para mejor accesibilidad
        setTimeout(() => {
            document.getElementById('cancelLogout')?.focus();
        }, 100);
    }

    /**
     * Oculta el modal de logout
     */
    static hideLogoutModal() {
        const logoutModal = document.getElementById('logoutModal');
        logoutModal?.classList.remove('show');
    }

    /**
     * Oculta el modal de autenticación
     */
    static hideModal() {
        const modal = document.getElementById('authModal');
        modal?.classList.remove('show');
        this.clearForm();
    }

    /**
     * Maneja el envío del formulario con preventDefault
     */
    static async handleSubmit(event) {
        event.preventDefault(); // ¡Importante preventDefault!
        
        const formData = new FormData(event.target);
        const userData = {
            name: formData.get('userName').trim(),
            email: formData.get('userEmail').trim(),
            favoriteArtist: formData.get('favoriteArtist').trim()
        };

        // Validar campos básicos
        const nameValid = this.validateField('userName');
        const emailValid = this.validateField('userEmail');
        if (!nameValid || !emailValid) {
            NotificationManager.show('Error', 'Por favor corrige los errores en el formulario', 'error');
            return;
        }

        try {
            // Si hay artista, validar existencia en AudioDB antes de continuar
            const artist = userData.favoriteArtist;
            if (artist && artist.length >= 2) {
                const basicValid = this.validateField('favoriteArtist');
                if (!basicValid) return;
                let exists = false;
                try { exists = await AudioDBService.exists(artist); } catch { exists = true; }
                if (!exists) {
                    const input = document.getElementById('favoriteArtist');
                    const errorDiv = document.getElementById('favoriteArtistError');
                    input.classList.remove('valid');
                    input.classList.add('error');
                    errorDiv.textContent = 'Artista no encontrado. Por favor ingresa un artista musical real.';
                    errorDiv.classList.add('show');
                    NotificationManager.show('Error', 'El artista indicado no existe', 'error');
                    return;
                }
            }

            // Simular autenticación
            await this.authenticateUser(userData);
            
            // Añadir artista favorito si pasó validación y existe
            if (artist && artist.length >= 2) await this.searchAndAddFavoriteArtist(artist);

            this.hideModal();
            const msg = (artist && artist.length >= 2)
                ? `Hola ${userData.name}, se ha añadido ${artist} a tus favoritos`
                : `Hola ${userData.name}`;
            NotificationManager.show('¡Bienvenido!', msg, 'success');
            
        } catch (error) {
            console.error('Error en autenticación:', error);
            NotificationManager.show('Error', 'Error en el proceso de autenticación', 'error');
        }
    }

    /**
     * Valida un campo específico
     */
    static validateField(fieldId) {
        const input = document.getElementById(fieldId);
        const errorDiv = document.getElementById(`${fieldId}Error`);
        const value = input.value.trim();

        let isValid = true;
        let errorMessage = '';

        switch (fieldId) {
            case 'userName':
                if (!value) {
                    isValid = false;
                    errorMessage = 'El nombre es obligatorio';
                } else if (value.length < 2) {
                    isValid = false;
                    errorMessage = 'El nombre debe tener al menos 2 caracteres';
                } else if (value.length > 50) {
                    isValid = false;
                    errorMessage = 'El nombre no puede exceder 50 caracteres';
                } else if (!CONFIG.VALIDATION.NAME_PATTERN.test(value)) {
                    isValid = false;
                    errorMessage = 'Solo se permiten letras y espacios';
                }
                break;

            case 'userEmail':
                if (!value) {
                    isValid = false;
                    errorMessage = 'El email es obligatorio';
                } else if (!CONFIG.VALIDATION.EMAIL_PATTERN.test(value)) {
                    isValid = false;
                    errorMessage = 'Formato de email inválido';
                }
                break;

            case 'favoriteArtist':
                // Campo opcional: si está vacío, es válido y sin mensaje
                if (!value) {
                    isValid = true;
                    errorMessage = '';
                } else if (value.length < 2) {
                    isValid = false;
                    errorMessage = 'El nombre del artista debe tener al menos 2 caracteres';
                } else if (value.length > 100) {
                    isValid = false;
                    errorMessage = 'El nombre del artista no puede exceder 100 caracteres';
                } else if (!CONFIG.VALIDATION.ARTIST_PATTERN.test(value)) {
                    isValid = false;
                    errorMessage = 'Formato de artista inválido';
                } else {
                    // Validación asíncrona: verificar si el artista existe en AudioDB
                    this.validateArtistAsync(fieldId, value);
                    return true; // Retorno temporal, la validación real será asíncrona
                }
                break;
        }

        // Actualizar UI
        this.updateFieldValidation(input, errorDiv, isValid, errorMessage);
        return isValid;
    }

    /**
     * Actualiza la validación visual del campo
     */
    static updateFieldValidation(input, errorDiv, isValid, errorMessage) {
        if (isValid) {
            input.classList.remove('error');
            input.classList.add('valid');
            errorDiv.classList.remove('show');
            errorDiv.textContent = '';
        } else {
            input.classList.remove('valid');
            input.classList.add('error');
            errorDiv.textContent = errorMessage;
            errorDiv.classList.add('show');
        }
    }

    /**
     * Validación asíncrona de artistas en AudioDB
     */
    static async validateArtistAsync(fieldId, artistName) {
        const input = document.getElementById(fieldId);
        const errorDiv = document.getElementById(`${fieldId}Error`);
        
        try {
            // Mostrar estado de verificación
            input.classList.remove('valid', 'error');
            input.classList.add('validating');
            errorDiv.textContent = 'Verificando artista...';
            errorDiv.classList.add('show', 'info');
            
            // Verificar en AudioDB con un pequeño delay para evitar demasiadas peticiones
            setTimeout(async () => {
                try {
                    const exists = await AudioDBService.exists(artistName);
                    if (exists) {
                        // Artista encontrado
                        input.classList.remove('validating', 'error');
                        input.classList.add('valid');
                        errorDiv.classList.remove('show', 'info');
                        errorDiv.textContent = '';
                        
                        // Marcar como validado
                        input.dataset.artistValidated = 'true';
                    } else {
                        // Artista no encontrado
                        input.classList.remove('validating', 'valid');
                        input.classList.add('error');
                        errorDiv.classList.remove('info');
                        errorDiv.classList.add('show');
                        errorDiv.textContent = 'Artista no encontrado. Por favor ingresa un artista musical real.';
                        
                        // Marcar como no validado
                        input.dataset.artistValidated = 'false';
                    }
                } catch (error) {
                    console.warn('Error validando artista:', error);
                    // En caso de error de red, permitir continuar pero con advertencia
                    input.classList.remove('validating', 'error');
                    input.classList.add('valid');
                    errorDiv.classList.remove('show', 'info');
                    errorDiv.textContent = '';
                    input.dataset.artistValidated = 'true';
                }
            }, 800); // Delay de 800ms para evitar spam de peticiones
            
        } catch (error) {
            console.error('Error en validación asíncrona:', error);
            input.classList.remove('validating');
            input.dataset.artistValidated = 'true'; // Permitir continuar en caso de error
        }
    }

    /**
     * Valida todos los campos del formulario (simplificado)
     */
    static validateAllFields(userData) {
        const nameValid = this.validateField('userName');
        const emailValid = this.validateField('userEmail');
        const artistValid = this.validateField('favoriteArtist');
        
        return nameValid && emailValid && artistValid;
    }

    /**
     * Simula proceso de autenticación
     */
    static async authenticateUser(userData) {
        // Simular delay de autenticación
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        this.currentUser = userData;
        this.isAuthenticated = true;
        
        // Guardar datos del usuario
        StorageManager.save('user_data', userData);
        
        // Actualizar UI del header
        this.updateAuthButton();
        
        // Notificar a la aplicación del cambio de estado
        if (window.musicApp && window.musicApp.updateAuthenticationUI) {
            window.musicApp.updateAuthenticationUI();
        }
    }

    /**
     * Añade directamente el artista favorito usando AudioDB (sin búsqueda)
     */
    static async searchAndAddFavoriteArtist(artistName) {
        if (!window.musicApp) return false;
        if (!artistName || artistName.trim().length < 2) return false;
        
        try {
            console.log('🎨 Añadiendo artista favorito desde AudioDB:', artistName);
            
            // Obtener información del artista desde AudioDB
            const artistInfo = await AudioDBService.getArtistInfo(artistName);
            
            if (artistInfo.image || artistInfo.name) {
                // Crear objeto de artista compatible con Song
                const timestamp = Date.now();
                const artistData = {
                    trackId: `audiodb_favorite_${artistInfo.name.toLowerCase().replace(/\s+/g, '_')}_${timestamp}`,
                    artistName: artistInfo.name,
                    trackName: artistInfo.name, // Para compatibilidad
                    collectionName: artistInfo.genre || 'Artista',
                    artworkUrl100: artistInfo.image || Song.prototype.getDefaultArtwork(),
                    previewUrl: null, // Los artistas no tienen preview
                    wrapperType: 'artist',
                    trackViewUrl: artistInfo.website || null,
                    biography: artistInfo.biography,
                    genre: artistInfo.genre
                };
                
                // Crear instancia de Song
                const artistSong = new Song(artistData);
                
                // Verificar que no esté ya en favoritos
                if (!window.musicApp.isFavorite(artistSong.trackId)) {
                    window.musicApp.favorites.push(artistSong);
                    
                    window.musicApp.saveFavorites();
                    window.musicApp.updateCounters();
                    
                    // Si estamos en la tab de favoritos, re-renderizar
                    if (window.musicApp.currentTab === 'favorites') {
                        window.musicApp.renderFavorites().catch(console.error);
                    }
                    
                    console.log('✅ Artista favorito añadido:', artistInfo.name);
                } else {
                    console.log('ℹ️ El artista ya está en favoritos:', artistInfo.name);
                }
                } else {
                console.warn('⚠️ No se encontró información del artista en AudioDB:', artistName);
                // Crear entrada básica si AudioDB no tiene información
                const basicArtistData = {
                    trackId: `audiodb_favorite_${artistName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
                    artistName: artistName,
                    trackName: artistName,
                    collectionName: 'Artista',
                    artworkUrl100: Song.prototype.getDefaultArtwork(),
                    previewUrl: null,
                    wrapperType: 'artist',
                    trackViewUrl: null,
                    biography: null,
                    genre: null
                };
                
                const basicArtistSong = new Song(basicArtistData);
                
                if (!window.musicApp.isFavorite(basicArtistSong.trackId)) {
                    window.musicApp.favorites.push(basicArtistSong);
                    window.musicApp.saveFavorites();
                    window.musicApp.updateCounters();
                    
                    if (window.musicApp.currentTab === 'favorites') {
                        window.musicApp.renderFavorites().catch(console.error);
                    }
                }
            }
            return true;
        } catch (error) {
            console.error('Error al añadir artista favorito:', error);
            return false;
        }
    }

    /**
     * Actualiza el botón de autenticación
     */
    static updateAuthButton() {
        const authBtn = document.getElementById('authBtn');
        if (authBtn && this.isAuthenticated) {
            authBtn.innerHTML = `
                <i class="fas fa-user-check"></i>
                ${this.currentUser.name.split(' ')[0]}
                <i class="fas fa-sign-out-alt" style="margin-left: 8px; opacity: 0.7;"></i>
            `;
            authBtn.setAttribute('aria-label', `Usuario: ${this.currentUser.name} - Clic para cerrar sesión`);
            authBtn.title = `Cerrar sesión de ${this.currentUser.name}`;
        } else if (authBtn) {
            authBtn.innerHTML = `
                <i class="fas fa-user"></i>
                Acceder
            `;
            authBtn.setAttribute('aria-label', 'Iniciar sesión');
            authBtn.title = 'Iniciar sesión';
        }
    }

    /**
     * Carga datos del usuario si existen
     */
    static loadUser() {
        const userData = StorageManager.load('user_data');
        if (userData) {
            this.currentUser = userData;
            this.isAuthenticated = true;
            this.updateAuthButton();
            
            // Notificar a la aplicación del cambio de estado
            if (window.musicApp && window.musicApp.updateAuthenticationUI) {
                window.musicApp.updateAuthenticationUI();
            }
        }
    }

    /**
     * Limpia el formulario
     */
    static clearForm() {
        const form = document.getElementById('authForm');
        if (form) {
            form.reset();
            
            // Limpiar estados de validación
            const inputs = form.querySelectorAll('.form-input');
            const errors = form.querySelectorAll('.form-error');
            
            inputs.forEach(input => {
                input.classList.remove('error', 'valid', 'validating');
                // Limpiar estado de validación asíncrona
                input.dataset.artistValidated = 'false';
            });
            
            errors.forEach(error => {
                error.classList.remove('show', 'info');
                error.textContent = '';
            });
        }
    }

    /**
     * Cerrar sesión
     */
    static logout() {
        // Guardar nombre para mensaje de despedida
        const userName = this.currentUser ? this.currentUser.name.split(' ')[0] : 'Usuario';
        
        // Limpiar datos de usuario
        this.currentUser = null;
        this.isAuthenticated = false;
        StorageManager.remove('user_data');
        
        // Limpiar favoritos cuando se cierra sesión
        if (window.musicApp) {
            window.musicApp.favorites = [];
            window.musicApp.saveFavorites();
            window.musicApp.updateCounters();
            
            // Si estamos en la tab de favoritos, re-renderizar
            if (window.musicApp.currentTab === 'favorites') {
                window.musicApp.renderFavorites().catch(console.error);
            }
        }
        
        // Actualizar botón de autenticación
        this.updateAuthButton();
        
        // Notificar a la aplicación del cambio de estado
        if (window.musicApp && window.musicApp.updateAuthenticationUI) {
            window.musicApp.updateAuthenticationUI();
        }
        
        NotificationManager.show(
            'Sesión cerrada', 
            `¡Hasta pronto ${userName}! Tus favoritos se han borrado.`, 
            'info'
        );
    }
}

// Exportar a ventana global para compatibilidad
window.AuthManager = AuthManager;