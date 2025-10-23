// Clase principal del juego Snake usando jQuery
// Desarrollado por Ian Palomares - 2º DAW
// Demuestra uso de JavaScript clásico + jQuery para DOM

class AppleWormGame {
    // Constructor con inicialización de propiedades del juego
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gridSize = 20; // Tamaño de cada celda
        this.tileCount = 20; // Número de celdas por lado
        this.gameRunning = false;
        this.currentPlayer = '';
        
        // Estado del juego Snake
        this.snake = [{ x: 10, y: 10 }]; // Array de segmentos de la serpiente
        this.food = { x: 5, y: 5 }; // Posición de la comida
        this.dx = 0; // Dirección horizontal
        this.dy = 0; // Dirección vertical
        this.score = 0; // Puntuación actual
        
        // Referencias DOM usando jQuery ($ sintaxis)
        this.$userForm = $('#userForm');
        this.$gameContainer = $('#gameContainer');
        this.$leaderboard = $('#leaderboard');
        this.$gameOverlay = $('#gameOverlay');
        
        this.initializeGame(); // Inicializar componentes
    }

    // Configuración inicial del juego
    initializeGame() {
        this.setupEventListeners(); // Configurar eventos jQuery
        this.loadHighScores(); // Cargar puntuaciones desde localStorage
        this.updateHighScoreDisplay();
    }

    // Configuración de event listeners usando jQuery
    setupEventListeners() {
        // Manejo de formulario con .on() de jQuery
        $('#playerForm').on('submit', (e) => {
            e.preventDefault();
            this.startGame();
        });

        // Validación en tiempo real usando input event
        $('#username').on('input', () => {
            this.clearValidationError(); // Limpiar errores al escribir
        });

        // Event listeners para botones del juego
        $('#startGameBtn').on('click', () => {
            this.beginGameplay(); // Iniciar gameplay
        });

        $('#restartBtn').on('click', () => {
            this.restartGame(); // Reiniciar partida
        });

        $('#newGameBtn').on('click', () => {
            this.newGame();
        });

        $('#clearScoresBtn').on('click', () => {
            this.clearAllScores();
        });

        // Botón de nombre aleatorio usando jQuery
        $('#randomNameBtn').on('click', () => {
            this.generateRandomName();
        });

        // Controles del teclado usando jQuery
        $(document).on('keydown', (e) => {
            if (this.gameRunning) {
                this.handleKeyPress(e);
            }
        });
    }

    startGame() {
        const username = $('#username').val().trim();
        
        // Validación con regex: mínimo 3 caracteres, máximo 20, solo letras, números y espacios
        const usernameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]{3,20}$/;
        
        // Limpiar mensajes de error previos
        this.clearValidationError();
        
        if (!username) {
            this.showValidationError('Por favor, introduce tu nombre de usuario.');
            return;
        }
        
        if (!usernameRegex.test(username)) {
            let errorMessage = '❌ Nombre de usuario inválido.\n\n';
            errorMessage += '📋 Requisitos:\n';
            errorMessage += '• Mínimo 3 caracteres\n';
            errorMessage += '• Máximo 20 caracteres\n';
            errorMessage += '• Solo letras, números y espacios\n';
            errorMessage += '• No caracteres especiales (@, #, $, etc.)\n\n';
            errorMessage += '✅ Ejemplos válidos: "Juan", "Player123", "Mi Nombre"';
            
            this.showValidationError(errorMessage);
            return;
        }
        
        // Si la validación es exitosa
        this.currentPlayer = username;
        $('#currentPlayer').text(username);
        
        // Ocultar formulario y mostrar juego usando jQuery
        this.$userForm.hide();
        this.$gameContainer.show();
        
        this.setupCanvas();
        this.showGameOverlay('¡Preparado!', 'Iniciar');
    }

    setupCanvas() {
        this.canvas = $('#gameCanvas')[0]; // Obtener el elemento DOM del canvas
        this.ctx = this.canvas.getContext('2d');
        
        // Ajustar el tamaño del canvas
        this.canvas.width = this.gridSize * this.tileCount;
        this.canvas.height = this.gridSize * this.tileCount;
    }

    beginGameplay() {
        this.hideGameOverlay();
        this.resetGameState();
        this.generateFood();
        this.gameRunning = true;
        this.gameLoop();
    }

    resetGameState() {
        this.snake = [{ x: 10, y: 10 }];
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.updateScore();
    }

    // Bucle principal del juego usando setTimeout (JavaScript clásico)
    gameLoop() {
        if (!this.gameRunning) return; // Salir si el juego no está corriendo

        setTimeout(() => {
            this.clearCanvas(); // Limpiar canvas
            this.moveSnake(); // Mover serpiente
            
            // Verificar colisiones fatales
            if (this.checkCollision()) {
                this.gameOver();
                return;
            }
            
            // Verificar si la serpiente come
            if (this.checkFoodCollision()) {
                this.eatFood(); // Crecer serpiente y sumar puntos
            }
            
            this.drawFood(); // Dibujar comida
            this.drawSnake(); // Dibujar serpiente
            
            this.gameLoop(); // Llamada recursiva para continuar
        }, 150); // Velocidad del juego en milisegundos
    }

    // Limpiar el canvas completamente
    clearCanvas() {
        this.ctx.fillStyle = 'black'; // Fondo negro
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    moveSnake() {
        const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };
        this.snake.unshift(head);
        
        // Si no ha comido, remover la cola
        if (!this.checkFoodCollision()) {
            this.snake.pop();
        }
    }

    checkCollision() {
        const head = this.snake[0];
        
        // Colisión con paredes
        if (head.x < 0 || head.x >= this.tileCount || 
            head.y < 0 || head.y >= this.tileCount) {
            return true;
        }
        
        // Colisión con el propio cuerpo
        for (let i = 1; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                return true;
            }
        }
        
        return false;
    }

    checkFoodCollision() {
        const head = this.snake[0];
        return head.x === this.food.x && head.y === this.food.y;
    }

    eatFood() {
        this.score += 10;
        this.updateScore();
        this.generateFood();
        
        // Efecto visual con jQuery cuando come
        $('#currentScore').addClass('score-pulse');
        setTimeout(() => {
            $('#currentScore').removeClass('score-pulse');
        }, 300);
    }

    generateFood() {
        let validPosition = false;
        
        while (!validPosition) {
            this.food = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
            
            // Verificar que la comida no aparezca en el cuerpo de la serpiente
            validPosition = !this.snake.some(segment => 
                segment.x === this.food.x && segment.y === this.food.y
            );
        }
    }

    drawSnake() {
        this.ctx.fillStyle = '#4CAF50';
        
        this.snake.forEach((segment, index) => {
            if (index === 0) {
                // Cabeza de la serpiente
                this.ctx.fillStyle = '#2E7D32';
            } else {
                this.ctx.fillStyle = '#4CAF50';
            }
            
            this.ctx.fillRect(
                segment.x * this.gridSize + 1, 
                segment.y * this.gridSize + 1, 
                this.gridSize - 2, 
                this.gridSize - 2
            );
        });
    }

    drawFood() {
        this.ctx.fillStyle = '#F44336';
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2 - 2,
            0,
            2 * Math.PI
        );
        this.ctx.fill();
    }

    handleKeyPress(event) {
        const LEFT_KEY = 37;
        const RIGHT_KEY = 39;
        const UP_KEY = 38;
        const DOWN_KEY = 40;

        const keyPressed = event.keyCode;
        const goingUp = this.dy === -1;
        const goingDown = this.dy === 1;
        const goingRight = this.dx === 1;
        const goingLeft = this.dx === -1;

        if (keyPressed === LEFT_KEY && !goingRight) {
            this.dx = -1;
            this.dy = 0;
        }
        if (keyPressed === UP_KEY && !goingDown) {
            this.dx = 0;
            this.dy = -1;
        }
        if (keyPressed === RIGHT_KEY && !goingLeft) {
            this.dx = 1;
            this.dy = 0;
        }
        if (keyPressed === DOWN_KEY && !goingUp) {
            this.dx = 0;
            this.dy = 1;
        }
    }

    updateScore() {
        $('#currentScore').text(this.score);
    }

    gameOver() {
        this.gameRunning = false;
        
        // Obtener puntuaciones antes de guardar para comparar
        const previousScores = this.loadHighScores();
        const previousBest = previousScores.find(score => score.player === this.currentPlayer);
        
        this.saveScore();
        
        // Crear mensaje personalizado
        let message = `¡Fin del juego! Puntuación: ${this.score}`;
        if (this.score > 0) {
            if (!previousBest || this.score > previousBest.score) {
                message += '\n🎉 ¡Nuevo récord personal!';
            } else if (this.score === previousBest.score) {
                message += '\n👍 ¡Igualaste tu récord!';
            }
        }
        
        this.showGameOverlay(message, 'Reiniciar');
        $('#startGameBtn').hide();
        $('#restartBtn').show();
        
        // Mostrar tabla de puntuaciones después de un breve delay usando jQuery
        setTimeout(() => {
            this.showLeaderboard();
        }, 2000);
    }

    restartGame() {
        this.beginGameplay();
    }

    newGame() {
        // Usar jQuery para ocultar/mostrar elementos con animaciones
        this.$leaderboard.fadeOut(300);
        this.$gameContainer.fadeOut(300, () => {
            this.$userForm.fadeIn(300);
        });
        
        $('#username').val('');
        $('#startGameBtn').show();
        $('#restartBtn').hide();
    }

    clearAllScores() {
        // Crear modal de confirmación personalizado con jQuery
        const $modal = $(`
            <div class="modal-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            ">
                <div class="modal-content" style="
                    background: white;
                    padding: 30px;
                    border-radius: 20px;
                    text-align: center;
                    max-width: 400px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                ">
                    <h3 style="margin-bottom: 20px; color: #333;">⚠️ Confirmar Acción</h3>
                    <p style="margin-bottom: 25px; color: #666;">¿Estás seguro de que quieres borrar TODAS las puntuaciones del ranking?</p>
                    <p style="margin-bottom: 25px; color: #dc3545; font-weight: bold;">Esta acción no se puede deshacer.</p>
                    <div style="display: flex; gap: 15px; justify-content: center;">
                        <button class="modal-cancel" style="
                            background: #6c757d;
                            color: white;
                            padding: 10px 20px;
                            border: none;
                            border-radius: 15px;
                            cursor: pointer;
                            font-weight: bold;
                        ">Cancelar</button>
                        <button class="modal-confirm" style="
                            background: #dc3545;
                            color: white;
                            padding: 10px 20px;
                            border: none;
                            border-radius: 15px;
                            cursor: pointer;
                            font-weight: bold;
                        ">🗑️ Borrar Todo</button>
                    </div>
                </div>
            </div>
        `);

        // Añadir el modal al body con animación
        $modal.hide().appendTo('body').fadeIn(300);

        // Event listeners para los botones del modal
        $modal.find('.modal-cancel').on('click', () => {
            $modal.fadeOut(300, () => {
                $modal.remove();
            });
        });

        $modal.find('.modal-confirm').on('click', () => {
            // Borrar las puntuaciones
            localStorage.removeItem('appleWormScores');
            
            // Mostrar efecto de éxito
            const $scoresList = $('#scoresList');
            $scoresList.html(`
                <div class="clear-success" style="
                    text-align: center;
                    padding: 40px 20px;
                    color: #28a745;
                    font-weight: bold;
                    font-size: 1.2em;
                ">
                    ✅ Ranking borrado exitosamente
                </div>
            `);

            // Actualizar el récord mostrado
            $('#highScore').text('0');

            // Cerrar modal con animación
            $modal.fadeOut(300, () => {
                $modal.remove();
            });

            // Efecto visual en el botón de borrar
            $('#clearScoresBtn').addClass('score-pulse');
            setTimeout(() => {
                $('#clearScoresBtn').removeClass('score-pulse');
            }, 300);

            // Después de 2 segundos, mostrar mensaje de ranking vacío
            setTimeout(() => {
                this.renderScoresList();
            }, 2000);
        });

        // Cerrar modal al hacer clic fuera de él
        $modal.on('click', (e) => {
            if (e.target === $modal[0]) {
                $modal.fadeOut(300, () => {
                    $modal.remove();
                });
            }
        });
    }

    showGameOverlay(message, buttonText) {
        $('#overlayMessage').text(message);
        this.$gameOverlay.fadeIn(300);
    }

    hideGameOverlay() {
        this.$gameOverlay.fadeOut(300);
    }

    // Sistema de puntuaciones con localStorage usando jQuery
    saveScore() {
        // No guardar puntuaciones de 0
        if (this.score === 0) {
            return;
        }
        
        const scores = this.loadHighScores();
        const newScore = {
            player: this.currentPlayer,
            score: this.score,
            date: new Date().toLocaleDateString('es-ES')
        };
        
        // Buscar si el usuario ya existe en el ranking
        const existingUserIndex = scores.findIndex(score => score.player === this.currentPlayer);
        
        if (existingUserIndex !== -1) {
            // Si el usuario ya existe, solo actualizar si la nueva puntuación es mejor
            if (this.score > scores[existingUserIndex].score) {
                scores[existingUserIndex] = newScore;
            }
            // Si la nueva puntuación es igual o menor, no hacer nada
        } else {
            // Si el usuario no existe, añadir la nueva puntuación
            scores.push(newScore);
        }
        
        // Ordenar por puntuación descendente
        scores.sort((a, b) => b.score - a.score);
        
        // Mantener solo los 10 mejores
        const topScores = scores.slice(0, 10);
        
        localStorage.setItem('appleWormScores', JSON.stringify(topScores));
        this.updateHighScoreDisplay();
    }

    loadHighScores() {
        const saved = localStorage.getItem('appleWormScores');
        const scores = saved ? JSON.parse(saved) : [];
        
        // Limpiar duplicados existentes y quedarse solo con la mejor puntuación de cada jugador
        const cleanedScores = this.removeDuplicateScores(scores);
        
        // Si se limpiaron duplicados, guardar la versión limpia
        if (cleanedScores.length !== scores.length) {
            localStorage.setItem('appleWormScores', JSON.stringify(cleanedScores));
        }
        
        return cleanedScores;
    }

    removeDuplicateScores(scores) {
        const playerBestScores = new Map();
        
        // Para cada puntuación, mantener solo la mejor de cada jugador
        scores.forEach(score => {
            const existingScore = playerBestScores.get(score.player);
            if (!existingScore || score.score > existingScore.score) {
                playerBestScores.set(score.player, score);
            }
        });
        
        // Convertir de vuelta a array y ordenar
        return Array.from(playerBestScores.values()).sort((a, b) => b.score - a.score);
    }

    updateHighScoreDisplay() {
        const scores = this.loadHighScores();
        const highScore = scores.length > 0 ? scores[0].score : 0;
        $('#highScore').text(highScore);
    }

    showLeaderboard() {
        // Transición suave usando jQuery
        this.$gameContainer.fadeOut(300, () => {
            this.$leaderboard.fadeIn(300);
            this.renderScoresList();
        });
    }

    renderScoresList() {
        const scores = this.loadHighScores();
        const $scoresList = $('#scoresList');
        
        if (scores.length === 0) {
            $scoresList.html('<div class="empty-scores">No hay puntuaciones guardadas</div>');
            return;
        }

        // Crear HTML usando jQuery de manera más eficiente
        const $scoresContainer = $('<div>');
        
        scores.forEach((score, index) => {
            // Mejorar la identificación del jugador actual
            const isCurrentPlayer = score.player === this.currentPlayer;
            const rank = index + 1;
            
            let medal = '';
            if (rank === 1) medal = '🥇';
            else if (rank === 2) medal = '🥈';
            else if (rank === 3) medal = '🥉';
            else medal = `${rank}.`;

            const $scoreItem = $(`
                <div class="score-item ${isCurrentPlayer ? 'current-player' : ''}">
                    <span class="score-rank">${medal}</span>
                    <span class="score-name">${score.player}${isCurrentPlayer ? ' (Tú)' : ''}</span>
                    <span class="score-points">${score.score} pts</span>
                </div>
            `);
            
            // Agregar animación de entrada con jQuery
            $scoreItem.hide().appendTo($scoresContainer).fadeIn(200 + (index * 100));
        });

        $scoresList.empty().append($scoresContainer.children());
    }

    // Método adicional para efectos con jQuery
    addScoreEffect() {
        $('#currentScore').animate({
            fontSize: '+=5px'
        }, 100).animate({
            fontSize: '-=5px'
        }, 100);
    }

    // Métodos para validación de usuario
    showValidationError(message) {
        // Remover error previo si existe
        this.clearValidationError();
        
        // Crear elemento de error
        const $errorDiv = $(`
            <div class="validation-error" style="
                background: linear-gradient(45deg, #dc3545, #c82333);
                color: white;
                padding: 15px;
                border-radius: 10px;
                margin-top: 15px;
                font-size: 14px;
                line-height: 1.4;
                box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
                white-space: pre-line;
                text-align: left;
            ">
                ${message}
            </div>
        `);
        
        // Añadir después del input con animación
        $errorDiv.hide().insertAfter('#username').fadeIn(300);
        
        // Añadir efecto de shake al input
        $('#username').addClass('shake');
        setTimeout(() => {
            $('#username').removeClass('shake');
        }, 500);
        
        // Enfocar el input
        $('#username').focus();
    }

    clearValidationError() {
        $('.validation-error').fadeOut(200, function() {
            $(this).remove();
        });
        $('#username').removeClass('shake');
    }

    // Generador de nombres usando API externa con jQuery + async/await
    async generateRandomName() {
        const $button = $('#randomNameBtn'); // Selector jQuery
        const $input = $('#username');
        
        try {
            // Manipulación DOM con jQuery
            $button.prop('disabled', true); // .prop() para propiedades
            $button.html('⏳'); // .html() para contenido
            
            // Limpiar errores previos
            this.clearValidationError();
            
            // Fetch API con async/await para comunicación asíncrona
            const response = await fetch('https://randomuser.me/api/');
            
            // Manejo de errores HTTP
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json(); // Parsear JSON
            
            // Procesamiento de datos de la API
            let randomName = data.results[0].name.first;
            if (randomName.length > 20) { // Validación de longitud
                randomName = randomName.substring(0, 20);
            }
            
            // Establecer el nombre en el input con animación
            $input.val('').focus();
            
            // Efecto de escritura gradual usando jQuery
            let index = 0;
            const typeEffect = setInterval(() => {
                $input.val(randomName.substring(0, index + 1));
                index++;
                if (index >= randomName.length) {
                    clearInterval(typeEffect);
                    
                    // Efecto de éxito
                    $input.addClass('score-pulse');
                    setTimeout(() => {
                        $input.removeClass('score-pulse');
                    }, 300);
                }
            }, 50);
            
        } catch (error) {
            console.error('Error al generar nombre aleatorio:', error);
            
            // Mostrar error al usuario
            const errorMessage = `❌ Error al conectar con la API.

🌐 Problema de conexión:
• Verifica tu conexión a internet
• El servicio podría estar temporalmente no disponible
• Intenta nuevamente en unos momentos

💡 Mientras tanto, puedes escribir tu nombre manualmente.`;
            
            this.showValidationError(errorMessage);
            
            // Efecto de error en el botón
            $button.addClass('shake');
            setTimeout(() => {
                $button.removeClass('shake');
            }, 500);
            
        } finally {
            // Restaurar botón
            $button.prop('disabled', false);
            $button.html('🎲');
        }
    }
}

// Inicializar el juego cuando se carga la página usando jQuery
$(document).ready(() => {
    const game = new AppleWormGame();
    
    // Almacenar globalmente para debugging
    window.gameInstance = game;
    
    // Efectos adicionales con jQuery
    $('.start-btn, .game-btn, .new-game-btn, .clear-scores-btn').hover(
        function() {
            $(this).animate({ scale: 1.05 }, 100);
        },
        function() {
            $(this).animate({ scale: 1 }, 100);
        }
    );
    
    // Prevenir el scroll con las flechas del teclado usando jQuery
    $(window).on('keydown', (e) => {
        if ([37, 38, 39, 40].includes(e.keyCode)) {
            e.preventDefault();
        }
    });
    
    // Advertir al usuario si está en medio de una partida usando jQuery
    $(window).on('beforeunload', (e) => {
        if (window.gameInstance && window.gameInstance.gameRunning) {
            e.preventDefault();
            e.returnValue = '¿Estás seguro de que quieres salir? Perderás tu progreso actual.';
        }
    });
});

// Funciones adicionales con jQuery para efectos visuales
$.fn.extend({
    pulse: function(times = 1) {
        return this.each(function() {
            const $this = $(this);
            for (let i = 0; i < times; i++) {
                $this.delay(i * 200)
                    .animate({ opacity: 0.5 }, 100)
                    .animate({ opacity: 1 }, 100);
            }
        });
    },
    
    shake: function() {
        return this.each(function() {
            const $this = $(this);
            const originalPosition = $this.position();
            
            for (let i = 0; i < 4; i++) {
                $this.animate({ left: originalPosition.left + 10 }, 50)
                    .animate({ left: originalPosition.left - 10 }, 50)
                    .animate({ left: originalPosition.left }, 50);
            }
        });
    }
});