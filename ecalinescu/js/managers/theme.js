/**
 * ThemeManager - Gestión del tema de la aplicación
 * Maneja el cambio entre tema claro y oscuro con persistencia
 */
class ThemeManager {
    static currentTheme = 'light';

    /**
     * Inicializa el sistema de temas
     */
    static init() {
        // Cargar tema guardado o detectar preferencia del sistema (usar localStorage para persistir)
        const savedTheme = this.loadTheme();
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        this.currentTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        this.applyTheme(this.currentTheme);

        // Escuchar cambios en la preferencia del sistema
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!savedTheme) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    /**
     * Cambia el tema
     */
    static setTheme(theme) {
        this.currentTheme = theme;
        this.applyTheme(theme);
        this.saveTheme(theme);
    }

    /**
     * Guarda el tema en localStorage (persiste entre sesiones)
     */
    static saveTheme(theme) {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, theme);
        } catch (error) {
            console.warn('No se pudo guardar el tema:', error);
        }
    }

    /**
     * Carga el tema desde localStorage
     */
    static loadTheme() {
        try {
            return localStorage.getItem(CONFIG.STORAGE_KEYS.THEME);
        } catch (error) {
            console.warn('No se pudo cargar el tema:', error);
            return null;
        }
    }

    /**
     * Alterna entre tema claro y oscuro
     */
    static toggle() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    /**
     * Aplica el tema al documento
     */
    static applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Actualizar icono del botón
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }
}

// Exportar a ventana global para compatibilidad
window.ThemeManager = ThemeManager;