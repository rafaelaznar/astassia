// helpers.js
// Utilities encapsulados en el espacio de nombres `SR.helpers`.

(function(global, $){
    'use strict';

    const helpers = {};

    /**
     * Validar título de película
     * Solo permite letras, números, espacios y algunos caracteres comunes.
     * Longitud máxima: 100 caracteres.
     * @param {string} titulo
     * @returns {boolean}
     */
    helpers.validarTitulo = function(titulo) {
        const regex = /^[A-Za-z0-9\s:\-\'.,()]{1,100}$/;
        return regex.test(titulo);
    };

    /**
     * Crear un elemento jQuery con clases y texto
     * @param {string} tag - Nombre del tag HTML
     * @param {string} clases - Clases a añadir
     * @param {string} texto - Texto a incluir
     * @returns {jQuery}
     */
    helpers.crearElemento = function(tag, clases = '', texto = '') {
        const $el = $('<' + tag + '>');
        if (clases) $el.addClass(clases);
        if (texto) $el.text(texto);
        return $el;
    };

    // Exponer helpers en el espacio de nombres global SR
    global.SR = global.SR || {};
    global.SR.helpers = Object.assign(global.SR.helpers || {}, helpers);

})(window, window.jQuery);
