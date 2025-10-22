/**
 * NotificationManager - Gestión de notificaciones toast
 * Maneja el sistema de notificaciones emergentes de la aplicación
 */
class NotificationManager {
    static container = null;

    /**
     * Inicializa el sistema de notificaciones
     */
    static init() {
        this.container = document.getElementById('toastContainer');
        if (!this.container) {
            console.error('Container de notificaciones no encontrado');
        }
    }

    /**
     * Muestra una notificación
     */
    static show(title, message, type = 'success', duration = 4000) {
        if (!this.container) return;

        const toast = this.createToast(title, message, type);
        this.container.appendChild(toast);

        // Auto-eliminar después del tiempo especificado
        setTimeout(() => {
            this.remove(toast);
        }, duration);

        return toast;
    }

    /**
     * Crea elemento de notificación
     */
    static createToast(title, message, type) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        toast.innerHTML = `
            <div class="toast-content">
                <strong>${title}</strong>
                ${message ? `<br>${message}` : ''}
            </div>
            <button class="toast-close" aria-label="Cerrar notificación">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Evento para cerrar manualmente
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.remove(toast));

        return toast;
    }

    /**
     * Elimina una notificación
     */
    static remove(toast) {
        if (toast && toast.parentNode) {
            toast.classList.add('fade-out');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }
    }

    /**
     * Limpia todas las notificaciones
     */
    static clear() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Exportar a ventana global para compatibilidad
window.NotificationManager = NotificationManager;