/**
 * Rompe Bloques - Breakout Game ES6
 * Desarrollado por Ian Palomares - 2º DAW
 * Usando características modernas de ECMAScript 6+
 */

// Configuración del juego - objeto congelado (inmutable)
const GAME_CONFIG = Object.freeze({
    // Dimensiones del canvas
    CANVAS: {
        WIDTH: 800,
        HEIGHT: 600,
        BACKGROUND: '#001122'
    },
    // Propiedades de la pala
    PADDLE: {
        WIDTH: 100,
        HEIGHT: 10,
        SPEED: 8,
        COLOR: '#00ff88'
    },
    // Propiedades de la pelota
    BALL: {
        RADIUS: 8,
        SPEED: 4,
        COLOR: '#ff6b6b'
    },
    // Propiedades de los ladrillos
    BRICK: {
        WIDTH: 75,
        HEIGHT: 20,
        PADDING: 5,
        ROWS: 8,
        COLS: 10,
        COLORS: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffc107', '#e74c3c', '#9b59b6', '#f39c12']
    },
    // Configuración de power-ups
    POWERUP: {
        SIZE: 15,
        SPEED: 2,
        TYPES: {
            EXPAND_PADDLE: { color: '#4ecdc4', symbol: '⬌', effect: 'expandPaddle' },
            SLOW_BALL: { color: '#ffc107', symbol: '🐌', effect: 'slowBall' },
            EXTRA_LIFE: { color: '#28a745', symbol: '❤️', effect: 'extraLife' },
            MULTI_BALL: { color: '#dc3545', symbol: '⚽', effect: 'multiBall' }
        }
    },
    // Niveles de dificultad
    DIFFICULTY: {
        easy: { ballSpeed: 3, paddleSpeed: 10, lives: 5 },
        normal: { ballSpeed: 4, paddleSpeed: 8, lives: 3 },
        hard: { ballSpeed: 6, paddleSpeed: 6, lives: 1 }
    }
});

// Clase Vector2D - manejo de coordenadas usando ES6
class Vector2D {
    // Constructor con valores por defecto
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    // Operaciones matemáticas con arrow functions y destructuring
    add = ({ x, y }) => new Vector2D(this.x + x, this.y + y);
    subtract = ({ x, y }) => new Vector2D(this.x - x, this.y + y);
    multiply = (scalar) => new Vector2D(this.x * scalar, this.y * scalar);
    magnitude = () => Math.sqrt(this.x ** 2 + this.y ** 2); // Operador exponencial
    normalize = () => {
        const mag = this.magnitude();
        return mag > 0 ? new Vector2D(this.x / mag, this.y / mag) : new Vector2D(0, 0);
    };
    
    // Getter y setter para ángulo
    get angle() {
        return Math.atan2(this.y, this.x);
    }
    
    set angle(value) {
        const mag = this.magnitude();
        this.x = Math.cos(value) * mag;
        this.y = Math.sin(value) * mag;
    }
}

// Clase base GameObject - herencia en ES6
class GameObject {
    // Constructor con parámetro por defecto
    constructor(x, y, width, height, color = '#ffffff') {
        this.position = new Vector2D(x, y); // Composición con Vector2D
        this.width = width;
        this.height = height;
        this.color = color;
        this.velocity = new Vector2D(0, 0);
    }

    // Método para renderizar el objeto
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }

    // Detección de colisiones AABB (Axis-Aligned Bounding Box)
    collidesWith(other) {
        return this.position.x < other.position.x + other.width &&
               this.position.x + this.width > other.position.x &&
               this.position.y < other.position.y + other.height &&
               this.position.y + this.height > other.position.y;
    }

    // Actualizar posición con velocidad
    update() {
        this.position = this.position.add(this.velocity);
    }
}

// Clase Paddle - herencia de GameObject
class Paddle extends GameObject {
    // Constructor con destructuring de config
    constructor(x, y, difficulty = 'normal') {
        const { WIDTH, HEIGHT, COLOR } = GAME_CONFIG.PADDLE;
        super(x, y, WIDTH, HEIGHT, COLOR); // Llamada al constructor padre
        this.speed = GAME_CONFIG.DIFFICULTY[difficulty].paddleSpeed;
        this.originalWidth = WIDTH;
        this.targetX = x; // Posición objetivo para suavizado
    }

    // Movimiento suavizado con restricciones de límites
    moveTo = (targetX, canvasWidth = GAME_CONFIG.CANVAS.WIDTH) => {
        this.targetX = Math.max(0, Math.min(targetX - this.width / 2, canvasWidth - this.width));
    };

    update() {
        // Movimiento suave hacia el objetivo
        const diff = this.targetX - this.position.x;
        if (Math.abs(diff) > 1) {
            this.position.x += diff * 0.2;
        } else {
            this.position.x = this.targetX;
        }
    }

    // Método para expandir la pala (power-up)
    expand() {
        this.width = Math.min(this.width * 1.5, GAME_CONFIG.CANVAS.WIDTH * 0.3);
    }

    reset() {
        this.width = this.originalWidth;
    }

    draw(ctx) {
        // Gradiente para la pala
        const gradient = ctx.createLinearGradient(this.position.x, this.position.y, 
                                                 this.position.x, this.position.y + this.height);
        gradient.addColorStop(0, '#00ff88');
        gradient.addColorStop(1, '#00cc66');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
        
        // Efecto de brillo
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(this.position.x, this.position.y, this.width, 2);
    }
}

// Clase Ball - física de movimiento y colisiones
class Ball extends GameObject {
    // Constructor adaptando propiedades circulares a rectangulares
    constructor(x, y, difficulty = 'normal') {
        const { RADIUS, COLOR } = GAME_CONFIG.BALL;
        super(x - RADIUS, y - RADIUS, RADIUS * 2, RADIUS * 2, COLOR);
        this.radius = RADIUS;
        this.speed = GAME_CONFIG.DIFFICULTY[difficulty].ballSpeed;
        this.originalSpeed = this.speed; // Para reset de efectos
        this.trail = []; // Array para efecto de estela
        this.maxTrailLength = 10;
    }

    // Lanzar pelota con ángulo específico
    launch(angle = -Math.PI / 4) {
        this.velocity = new Vector2D(
            Math.cos(angle) * this.speed,
            Math.sin(angle) * this.speed
        );
    }

    // Actualizar posición y efectos
    update() {
        // Guardar posición anterior para el efecto de rastro
        this.trail.push({ x: this.position.x + this.radius, y: this.position.y + this.radius });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        super.update();

        // Rebote en paredes laterales
        if (this.position.x <= 0 || this.position.x + this.width >= GAME_CONFIG.CANVAS.WIDTH) {
            this.velocity.x *= -1;
            this.position.x = Math.max(0, Math.min(this.position.x, GAME_CONFIG.CANVAS.WIDTH - this.width));
        }

        // Rebote en pared superior
        if (this.position.y <= 0) {
            this.velocity.y *= -1;
            this.position.y = 0;
        }
    }

    // Rebote con la pala con ángulo dinámico
    bounceOffPaddle(paddle) {
        const ballCenter = this.position.x + this.radius;
        const paddleCenter = paddle.position.x + paddle.width / 2;
        const relativeIntersectX = ballCenter - paddleCenter;
        const normalizedRelativeIntersectionX = relativeIntersectX / (paddle.width / 2);
        const bounceAngle = normalizedRelativeIntersectionX * Math.PI / 3; // Máximo 60 grados

        this.velocity = new Vector2D(
            Math.sin(bounceAngle) * this.speed,
            -Math.abs(Math.cos(bounceAngle)) * this.speed
        );
    }

    // Power-up para reducir velocidad
    slowDown() {
        this.speed = this.originalSpeed * 0.7;
    }

    resetSpeed() {
        this.speed = this.originalSpeed;
    }

    draw(ctx) {
        // Dibujar rastro
        this.trail.forEach((point, index) => {
            const alpha = index / this.trail.length * 0.5;
            const size = (index / this.trail.length) * this.radius;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.globalAlpha = 1;

        // Dibujar pelota con gradiente
        const gradient = ctx.createRadialGradient(
            this.position.x + this.radius, this.position.y + this.radius, 0,
            this.position.x + this.radius, this.position.y + this.radius, this.radius
        );
        gradient.addColorStop(0, '#ff8a8a');
        gradient.addColorStop(1, this.color);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.position.x + this.radius, this.position.y + this.radius, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Efecto de brillo
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(this.position.x + this.radius * 0.7, this.position.y + this.radius * 0.7, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Clase Brick - ladrillos destructibles
class Brick extends GameObject {
    // Constructor con sistema de puntuación por fila
    constructor(x, y, row, col) {
        const { WIDTH, HEIGHT, COLORS } = GAME_CONFIG.BRICK;
        const color = COLORS[row % COLORS.length]; // Color cíclico por fila
        super(x, y, WIDTH, HEIGHT, color);
        this.row = row;
        this.col = col;
        this.points = (8 - row) * 10; // Más puntos en filas superiores
        this.destroyed = false; // Estado de destrucción
    }

    // Marcar ladrillo como destruido
    destroy() {
        this.destroyed = true;
    }

    // Renderizar solo si no está destruido
    draw(ctx) {
        if (this.destroyed) return;

        // Gradiente para el bloque
        const gradient = ctx.createLinearGradient(this.position.x, this.position.y,
                                                 this.position.x, this.position.y + this.height);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, this.adjustBrightness(this.color, -20));

        ctx.fillStyle = gradient;
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);

        // Borde
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.position.x, this.position.y, this.width, this.height);
    }

    // Método auxiliar para ajustar brillo
    adjustBrightness(color, amount) {
        const usePound = color[0] === '#';
        const col = usePound ? color.slice(1) : color;
        const num = parseInt(col, 16);
        let r = (num >> 16) + amount;
        let g = (num >> 8 & 0x00FF) + amount;
        let b = (num & 0x0000FF) + amount;
        r = r > 255 ? 255 : r < 0 ? 0 : r;
        g = g > 255 ? 255 : g < 0 ? 0 : g;
        b = b > 255 ? 255 : b < 0 ? 0 : b;
        return (usePound ? '#' : '') + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
    }
}

// Clase PowerUp - mejoras temporales
class PowerUp extends GameObject {
    // Constructor con configuración de tipo específico
    constructor(x, y, type) {
        const { SIZE, SPEED } = GAME_CONFIG.POWERUP;
        const powerUpConfig = GAME_CONFIG.POWERUP.TYPES[type]; // Acceso a config específica
        super(x, y, SIZE, SIZE, powerUpConfig.color);
        this.type = type;
        this.symbol = powerUpConfig.symbol; // Emoji visual
        this.effect = powerUpConfig.effect; // Efecto a aplicar
        this.velocity = new Vector2D(0, SPEED); // Caída vertical
    }

    // Renderizado especial con gradiente
    draw(ctx) {
        // Círculo con gradiente radial
        const gradient = ctx.createRadialGradient(
            this.position.x + this.width / 2, this.position.y + this.height / 2, 0,
            this.position.x + this.width / 2, this.position.y + this.height / 2, this.width / 2
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, this.color);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.position.x + this.width / 2, this.position.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Símbolo
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.symbol, this.position.x + this.width / 2, this.position.y + this.height / 2 + 4);
    }
}

// Clase principal BreakoutGame - controlador del juego
class BreakoutGame {
    // Constructor con inicialización de propiedades
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gameState = 'menu'; // Estados: 'menu', 'playing', 'gameOver', 'levelComplete'
        this.currentPlayer = '';
        this.difficulty = 'normal';
        this.animationId = null;
        
        // Datos del juego usando Map (ES6) para mejor rendimiento
        this.gameData = new Map([
            ['score', 0],
            ['lives', 3],
            ['level', 1],
            ['balls', []],
            ['bricks', []],
            ['powerUps', []],
            ['startTime', null]
        ]);

        this.paddle = null;
        this.keys = new Set(); // Set para tracking eficiente de teclas presionadas
        this.mouse = { x: 0, y: 0 }; // Posición del mouse
        
        // Sistema de efectos temporales con Map
        this.effects = new Map([
            ['expandedPaddle', false],
            ['slowBall', false],
            ['multiBall', false]
        ]);
        
        this.timers = new Map();
        
        this.initialize();
    }

    // Inicialización asíncrona del juego
    async initialize() {
        this.setupDOM(); // Configurar elementos DOM
        this.setupEventListeners(); // Configurar eventos
        this.loadHighScores(); // Cargar puntuaciones guardadas
        this.updateUI(); // Actualizar interfaz
    }

    // Configuración de elementos DOM con destructuring
    setupDOM() {
        // Destructuring para obtener elementos del DOM
        const elements = {
            userForm: document.getElementById('userForm'),
            gameContainer: document.getElementById('gameContainer'),
            leaderboard: document.getElementById('leaderboard'),
            gameOverlay: document.getElementById('gameOverlay'),
            canvas: document.getElementById('gameCanvas')
        };
        
        console.log('Elementos DOM encontrados:', elements); // Debug
        
        // Object.assign para copiar propiedades al objeto actual
        Object.assign(this, elements);
        
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d'); // Contexto 2D del canvas
            this.setupCanvas();
        }
    }

    setupCanvas() {
        const { WIDTH, HEIGHT } = GAME_CONFIG.CANVAS;
        this.canvas.width = WIDTH;
        this.canvas.height = HEIGHT;
        
        // Optimización de rendering
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }

    setupEventListeners() {
        // Usando arrow functions para mantener el contexto
        const playerForm = document.getElementById('playerForm');
        console.log('PlayerForm encontrado:', playerForm); // Debug
        
        if (playerForm) {
            playerForm.addEventListener('submit', this.handlePlayerSubmit);
            console.log('Event listener agregado al formulario'); // Debug
        }
        
        // Validación en tiempo real del nombre de usuario
        const usernameInput = document.getElementById('username');
        if (usernameInput) {
            usernameInput.addEventListener('input', () => {
                this.clearValidationError();
            });
        }
        
        // Botón de nombre aleatorio
        const randomNameBtn = document.getElementById('randomNameBtn');
        if (randomNameBtn) {
            randomNameBtn.addEventListener('click', () => {
                this.generateRandomName();
            });
        }
        
        document.getElementById('startGameBtn')?.addEventListener('click', this.startGame);
        document.getElementById('restartBtn')?.addEventListener('click', this.restartGame);
        document.getElementById('nextLevelBtn')?.addEventListener('click', this.nextLevel);
        document.getElementById('newGameBtn')?.addEventListener('click', this.newGame);
        document.getElementById('clearScoresBtn')?.addEventListener('click', this.clearScores);

        // Event listeners usando arrow functions
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        this.canvas?.addEventListener('mousemove', this.handleMouseMove);

        // Filter buttons para el leaderboard
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', this.handleFilterChange);
        });
    }

    // Event handlers usando arrow functions
    handlePlayerSubmit = (e) => {
        e.preventDefault();
        console.log('Formulario enviado'); // Debug
        
        // Método más directo
        const username = document.getElementById('username').value.trim();
        const difficultyElement = document.querySelector('input[name="difficulty"]:checked');
        const difficulty = difficultyElement ? difficultyElement.value : 'normal';
        
        console.log('Username:', username, 'Difficulty:', difficulty); // Debug
        
        // Validación con regex: mínimo 3 caracteres, máximo 20, solo letras, números y espacios
        const usernameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]{3,20}$/;
        
        // Limpiar mensajes de error previos
        this.clearValidationError();
        
        if (!username) {
            this.showValidationError('Por favor, introduce tu nombre de usuario.');
            return;
        }
        
        if (!usernameRegex.test(username)) {
            const errorMessage = `❌ Nombre de usuario inválido.

📋 Requisitos:
• Mínimo 3 caracteres
• Máximo 20 caracteres  
• Solo letras, números y espacios
• No caracteres especiales (@, #, $, etc.)

✅ Ejemplos válidos: "Juan", "Player123", "Mi Nombre"`;
            
            this.showValidationError(errorMessage);
            return;
        }
        
        // Si la validación es exitosa
        this.currentPlayer = username;
        this.difficulty = difficulty;
        this.gameData.set('lives', GAME_CONFIG.DIFFICULTY[difficulty].lives);
        console.log('Llamando a showGameScreen'); // Debug
        this.showGameScreen();
    };

    handleKeyDown = (e) => {
        this.keys.add(e.code);
        
        // Prevent default para ciertas teclas
        if (['ArrowLeft', 'ArrowRight'].includes(e.code)) {
            e.preventDefault();
        }
    };

    handleKeyUp = (e) => {
        this.keys.delete(e.code);
    };

    handleMouseMove = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
    };

    handleFilterChange = (e) => {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        this.renderScoresList(e.target.dataset.difficulty);
    };

    showGameScreen() {
        console.log('showGameScreen llamado'); // Debug
        console.log('userForm:', this.userForm); // Debug
        console.log('gameContainer:', this.gameContainer); // Debug
        
        if (this.userForm) {
            this.userForm.style.display = 'none';
        }
        if (this.gameContainer) {
            this.gameContainer.style.display = 'block';
        }
        this.updatePlayerDisplay();
        this.showGameOverlay('¡Preparado!', 'Iniciar');
    }

    startGame = () => {
        this.gameState = 'playing';
        this.resetGame();
        this.createLevel();
        this.hideGameOverlay();
        this.gameData.set('startTime', Date.now());
        this.gameLoop();
    };

    restartGame = () => {
        this.startGame();
    };

    nextLevel = () => {
        this.gameData.set('level', this.gameData.get('level') + 1);
        // Usar resetLevel() para mantener la puntuación acumulada
        this.gameState = 'playing';
        this.resetLevel();
        this.createLevel();
        this.hideGameOverlay();
        this.gameData.set('startTime', Date.now());
        this.gameLoop();
    };

    newGame = () => {
        this.gameState = 'menu';
        this.leaderboard.style.display = 'none';
        this.gameContainer.style.display = 'none';
        this.userForm.style.display = 'block';
        document.getElementById('username').value = '';
        this.resetEffects();
    };

    clearScores = () => {
        if (confirm('¿Estás seguro de que quieres borrar todas las puntuaciones?')) {
            localStorage.removeItem('breakoutScores');
            this.renderScoresList();
        }
    };

    resetGame() {
        // Usando destructuring y valores por defecto
        const { CANVAS: { WIDTH, HEIGHT }, PADDLE, BALL } = GAME_CONFIG;
        
        this.gameData.set('score', 0);
        this.gameData.set('balls', []);
        this.gameData.set('powerUps', []);
        this.gameData.set('bricks', []);
        
        // Crear paddle
        this.paddle = new Paddle(WIDTH / 2 - PADDLE.WIDTH / 2, HEIGHT - 30, this.difficulty);
        
        // Crear pelota inicial
        this.addBall(WIDTH / 2, HEIGHT - 50);
        
        this.resetEffects();
        this.updateUI();
    }

    // Nueva función para cambiar de nivel sin reiniciar puntuación
    resetLevel() {
        // Usando destructuring y valores por defecto
        const { CANVAS: { WIDTH, HEIGHT }, PADDLE, BALL } = GAME_CONFIG;
        
        // NO reiniciar score, mantener puntuación acumulada
        this.gameData.set('balls', []);
        this.gameData.set('powerUps', []);
        this.gameData.set('bricks', []);
        
        // Crear paddle
        this.paddle = new Paddle(WIDTH / 2 - PADDLE.WIDTH / 2, HEIGHT - 30, this.difficulty);
        
        // Crear pelota inicial
        this.addBall(WIDTH / 2, HEIGHT - 50);
        
        this.resetEffects();
        this.updateUI();
    }

    addBall(x, y) {
        const ball = new Ball(x, y, this.difficulty);
        ball.launch((-Math.PI / 4) + (Math.random() - 0.5) * 0.5);
        this.gameData.get('balls').push(ball);
    }

    createLevel() {
        const bricks = [];
        const { BRICK: { WIDTH, HEIGHT, PADDING, ROWS, COLS } } = GAME_CONFIG;
        const { CANVAS: { WIDTH: CANVAS_WIDTH } } = GAME_CONFIG;
        
        const totalBricksWidth = COLS * WIDTH + (COLS - 1) * PADDING;
        const startX = (CANVAS_WIDTH - totalBricksWidth) / 2;
        const startY = 50;

        // Crear patrón de bloques basado en el nivel
        const level = this.gameData.get('level');
        const rowsToCreate = Math.min(ROWS, 3 + level);

        for (let row = 0; row < rowsToCreate; row++) {
            for (let col = 0; col < COLS; col++) {
                // Patrón especial para niveles avanzados
                if (level > 3 && (row + col) % 3 === 0) continue;
                
                const x = startX + col * (WIDTH + PADDING);
                const y = startY + row * (HEIGHT + PADDING);
                bricks.push(new Brick(x, y, row, col));
            }
        }

        this.gameData.set('bricks', bricks);
    }

    // Bucle principal del juego usando requestAnimationFrame
    gameLoop = () => {
        if (this.gameState !== 'playing') return; // Solo ejecutar si está jugando

        this.update(); // Actualizar lógica del juego
        this.render(); // Renderizar gráficos
        this.animationId = requestAnimationFrame(this.gameLoop); // Siguiente frame
    };

    // Actualizar todos los elementos del juego
    update() {
        this.handleInput(); // Procesar entrada del usuario
        this.updatePaddle(); // Actualizar posición de la pala
        this.updateBalls(); // Actualizar pelotas
        this.updatePowerUps(); // Actualizar power-ups
        this.checkCollisions(); // Detectar colisiones
        this.checkGameConditions();
        this.updateEffects();
    }

    handleInput() {
        if (this.keys.has('ArrowLeft')) {
            this.paddle.moveTo(this.paddle.position.x - this.paddle.speed);
        }
        if (this.keys.has('ArrowRight')) {
            this.paddle.moveTo(this.paddle.position.x + this.paddle.speed);
        }
        
        // Control con ratón
        if (this.mouse.x > 0) {
            this.paddle.moveTo(this.mouse.x);
        }
    }

    updatePaddle() {
        this.paddle.update();
    }

    updateBalls() {
        const balls = this.gameData.get('balls');
        
        // Usar filter para remover pelotas que salieron de la pantalla
        const activeBalls = balls.filter(ball => {
            ball.update();
            return ball.position.y < GAME_CONFIG.CANVAS.HEIGHT;
        });
        
        this.gameData.set('balls', activeBalls);
        
        // Si no quedan pelotas, perder vida
        if (activeBalls.length === 0) {
            this.loseLife();
        }
    }

    updatePowerUps() {
        const powerUps = this.gameData.get('powerUps');
        
        const activePowerUps = powerUps.filter(powerUp => {
            powerUp.update();
            return powerUp.position.y < GAME_CONFIG.CANVAS.HEIGHT;
        });
        
        this.gameData.set('powerUps', activePowerUps);
    }

    checkCollisions() {
        this.checkBallPaddleCollisions();
        this.checkBallBrickCollisions();
        this.checkPowerUpPaddleCollisions();
    }

    checkBallPaddleCollisions() {
        const balls = this.gameData.get('balls');
        
        balls.forEach(ball => {
            if (ball.collidesWith(this.paddle) && ball.velocity.y > 0) {
                ball.bounceOffPaddle(this.paddle);
                ball.position.y = this.paddle.position.y - ball.height;
            }
        });
    }

    checkBallBrickCollisions() {
        const balls = this.gameData.get('balls');
        const bricks = this.gameData.get('bricks');
        
        balls.forEach(ball => {
            bricks.forEach(brick => {
                if (!brick.destroyed && ball.collidesWith(brick)) {
                    brick.destroy();
                    ball.velocity.y *= -1;
                    
                    // Añadir puntuación
                    this.gameData.set('score', this.gameData.get('score') + brick.points);
                    // Actualizar UI inmediatamente cuando se gana puntuación
                    this.updateUI();
                    
                    // Posibilidad de generar power-up
                    if (Math.random() < 0.15) {
                        this.spawnPowerUp(brick.position.x + brick.width / 2, brick.position.y + brick.height);
                    }
                }
            });
        });
    }

    checkPowerUpPaddleCollisions() {
        const powerUps = this.gameData.get('powerUps');
        
        powerUps.forEach((powerUp, index) => {
            if (powerUp.collidesWith(this.paddle)) {
                this.applyPowerUp(powerUp);
                powerUps.splice(index, 1);
            }
        });
    }

    spawnPowerUp(x, y) {
        const powerUpTypes = Object.keys(GAME_CONFIG.POWERUP.TYPES);
        const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        const powerUp = new PowerUp(x, y, randomType);
        this.gameData.get('powerUps').push(powerUp);
    }

    applyPowerUp(powerUp) {
        switch (powerUp.effect) {
            case 'expandPaddle':
                this.paddle.expand();
                this.effects.set('expandedPaddle', true);
                this.setTimer('expandedPaddle', 10000, () => {
                    this.paddle.reset();
                    this.effects.set('expandedPaddle', false);
                });
                break;
                
            case 'slowBall':
                this.gameData.get('balls').forEach(ball => ball.slowDown());
                this.effects.set('slowBall', true);
                this.setTimer('slowBall', 8000, () => {
                    this.gameData.get('balls').forEach(ball => ball.resetSpeed());
                    this.effects.set('slowBall', false);
                });
                break;
                
            case 'extraLife':
                this.gameData.set('lives', this.gameData.get('lives') + 1);
                // Actualizar UI inmediatamente cuando se gana una vida
                this.updateUI();
                break;
                
            case 'multiBall':
                const balls = this.gameData.get('balls');
                const newBalls = [...balls]; // Spread operator para clonar
                balls.forEach(ball => {
                    this.addBall(ball.position.x, ball.position.y);
                });
                this.effects.set('multiBall', true);
                this.setTimer('multiBall', 15000, () => {
                    this.effects.set('multiBall', false);
                });
                break;
        }
    }

    setTimer(name, duration, callback) {
        if (this.timers.has(name)) {
            clearTimeout(this.timers.get(name));
        }
        
        const timer = setTimeout(() => {
            callback();
            this.timers.delete(name);
        }, duration);
        
        this.timers.set(name, timer);
    }

    updateEffects() {
        // Lógica adicional para efectos si es necesaria
    }

    checkGameConditions() {
        const bricks = this.gameData.get('bricks');
        const activeBricks = bricks.filter(brick => !brick.destroyed);
        
        // Nivel completado
        if (activeBricks.length === 0) {
            this.levelComplete();
        }
    }

    loseLife() {
        const lives = this.gameData.get('lives') - 1;
        this.gameData.set('lives', lives);
        
        if (lives <= 0) {
            this.gameOver();
        } else {
            // Reiniciar pelota
            this.addBall(GAME_CONFIG.CANVAS.WIDTH / 2, GAME_CONFIG.CANVAS.HEIGHT - 50);
            this.updateUI();
        }
    }

    levelComplete() {
        this.gameState = 'levelComplete';
        this.showGameOverlay(`¡Nivel ${this.gameData.get('level')} Completado!`, 'Siguiente Nivel');
        document.getElementById('startGameBtn').style.display = 'none';
        document.getElementById('nextLevelBtn').style.display = 'inline-block';
    }

    gameOver() {
        this.gameState = 'gameOver';
        this.saveScore();
        this.showGameOverlay(`💀 GAME OVER 💀`, `Puntuación Final: ${this.gameData.get('score')}`);
        document.getElementById('startGameBtn').style.display = 'none';
        document.getElementById('restartBtn').style.display = 'inline-block';
        
        setTimeout(() => {
            this.showLeaderboard();
        }, 2000);
    }

    render() {
        this.clearCanvas();
        this.drawBackground();
        this.drawPaddle();
        this.drawBalls();
        this.drawBricks();
        this.drawPowerUps();
        this.drawEffects();
    }

    clearCanvas() {
        this.ctx.fillStyle = GAME_CONFIG.CANVAS.BACKGROUND;
        this.ctx.fillRect(0, 0, GAME_CONFIG.CANVAS.WIDTH, GAME_CONFIG.CANVAS.HEIGHT);
    }

    drawBackground() {
        // Gradiente de fondo animado
        const gradient = this.ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.CANVAS.HEIGHT);
        gradient.addColorStop(0, '#001122');
        gradient.addColorStop(1, '#002244');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, GAME_CONFIG.CANVAS.WIDTH, GAME_CONFIG.CANVAS.HEIGHT);
        
        // Estrellas de fondo
        this.drawStars();
    }

    drawStars() {
        const time = Date.now() * 0.001;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        for (let i = 0; i < 50; i++) {
            const x = (i * 37) % GAME_CONFIG.CANVAS.WIDTH;
            const y = (i * 67 + time * 10) % GAME_CONFIG.CANVAS.HEIGHT;
            const size = Math.sin(time + i) * 0.5 + 1;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawPaddle() {
        this.paddle.draw(this.ctx);
    }

    drawBalls() {
        this.gameData.get('balls').forEach(ball => ball.draw(this.ctx));
    }

    drawBricks() {
        this.gameData.get('bricks').forEach(brick => brick.draw(this.ctx));
    }

    drawPowerUps() {
        this.gameData.get('powerUps').forEach(powerUp => powerUp.draw(this.ctx));
    }

    drawEffects() {
        // Efectos visuales adicionales
        if (this.effects.get('expandedPaddle')) {
            this.ctx.fillStyle = 'rgba(0, 255, 136, 0.3)';
            this.ctx.fillRect(this.paddle.position.x - 5, this.paddle.position.y - 5, 
                             this.paddle.width + 10, this.paddle.height + 10);
        }
    }

    updateUI() {
        document.getElementById('currentPlayer').textContent = this.currentPlayer;
        document.getElementById('currentScore').textContent = this.gameData.get('score');
        document.getElementById('currentLives').textContent = this.gameData.get('lives');
        document.getElementById('currentLevel').textContent = this.gameData.get('level');
    }

    updatePlayerDisplay() {
        this.updateUI();
        const highScores = this.loadHighScores();
        const personalBest = highScores
            .filter(score => score.player === this.currentPlayer && score.difficulty === this.difficulty)
            .reduce((max, score) => score.score > max ? score.score : max, 0);
        
        // Mostrar récord personal si existe
        if (personalBest > 0) {
            document.getElementById('highScore').textContent = personalBest;
        }
    }

    showGameOverlay(title, buttonText) {
        document.getElementById('overlayTitle').textContent = title;
        
        // Si es Game Over, personalizar el mensaje y estilos
        if (title.includes('GAME OVER')) {
            document.getElementById('overlayMessage').textContent = buttonText;
            document.getElementById('startGameBtn').textContent = '🔄 Nueva Partida';
            // Agregar clase CSS especial para Game Over
            this.gameOverlay.classList.add('game-over');
        } else {
            // Para otros casos, usar el comportamiento normal
            document.getElementById('overlayMessage').textContent = 'Usa las flechas ← → o el ratón para mover la pala';
            if (buttonText) {
                document.getElementById('startGameBtn').textContent = buttonText;
            }
            // Remover clase CSS de Game Over si existe
            this.gameOverlay.classList.remove('game-over');
        }
        
        if (buttonText) {
            document.getElementById('startGameBtn').style.display = 'inline-block';
        }
        this.gameOverlay.style.display = 'flex';
    }

    hideGameOverlay() {
        this.gameOverlay.style.display = 'none';
        // Remover clase CSS de Game Over cuando se oculta
        this.gameOverlay.classList.remove('game-over');
    }

    resetEffects() {
        // Limpiar todos los timers
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers.clear();
        
        // Resetear efectos
        this.effects.forEach((value, key) => this.effects.set(key, false));
    }

    // Sistema de puntuaciones mejorado
    saveScore() {
        const scores = this.loadHighScores();
        const gameTime = Math.floor((Date.now() - this.gameData.get('startTime')) / 1000);
        
        const newScore = {
            player: this.currentPlayer,
            score: this.gameData.get('score'),
            level: this.gameData.get('level'),
            difficulty: this.difficulty,
            time: gameTime,
            date: new Date().toLocaleDateString('es-ES'),
            timestamp: Date.now()
        };
        
        scores.push(newScore);
        
        // Ordenar por puntuación y mantener solo los mejores 50
        const sortedScores = scores
            .sort((a, b) => b.score - a.score)
            .slice(0, 50);
        
        localStorage.setItem('breakoutScores', JSON.stringify(sortedScores));
    }

    loadHighScores() {
        try {
            const saved = localStorage.getItem('breakoutScores');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading scores:', error);
            return [];
        }
    }

    showLeaderboard() {
        this.gameContainer.style.display = 'none';
        this.leaderboard.style.display = 'block';
        this.renderScoresList();
    }

    renderScoresList(filterDifficulty = 'all') {
        const scores = this.loadHighScores();
        const scoresList = document.getElementById('scoresList');
        
        let filteredScores = scores;
        if (filterDifficulty !== 'all') {
            filteredScores = scores.filter(score => score.difficulty === filterDifficulty);
        }
        
        if (filteredScores.length === 0) {
            scoresList.innerHTML = '<div class="empty-scores">No hay puntuaciones guardadas</div>';
            return;
        }

        const scoresHTML = filteredScores
            .slice(0, 20) // Mostrar solo top 20
            .map((score, index) => {
                const isCurrentPlayer = score.player === this.currentPlayer && 
                                      Math.abs(score.timestamp - Date.now()) < 10000; // Último juego
                const rank = index + 1;
                
                let medal = '';
                if (rank === 1) medal = '🥇';
                else if (rank === 2) medal = '🥈';
                else if (rank === 3) medal = '🥉';
                else medal = `${rank}.`;

                return `
                    <div class="score-item ${isCurrentPlayer ? 'current-player' : ''}">
                        <span class="score-rank">${medal}</span>
                        <span class="score-name">${score.player}</span>
                        <span class="score-points">${score.score.toLocaleString()}</span>
                        <span class="score-difficulty ${score.difficulty}">${this.getDifficultyText(score.difficulty)}</span>
                    </div>
                `;
            }).join('');

        scoresList.innerHTML = scoresHTML;
    }

    getDifficultyText(difficulty) {
        const difficultyMap = {
            easy: 'Fácil',
            normal: 'Normal',
            hard: 'Difícil'
        };
        return difficultyMap[difficulty] || difficulty;
    }

    // Métodos para validación de usuario usando ES6
    showValidationError(message) {
        // Limpiar error previo si existe
        this.clearValidationError();
        
        // Crear elemento de error usando template literals
        const errorDiv = document.createElement('div');
        errorDiv.className = 'validation-error';
        errorDiv.innerHTML = `
            <div style="
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
                animation: slideIn 0.3s ease-out;
            ">
                ${message}
            </div>
        `;
        
        // Añadir después del input group
        const usernameInput = document.getElementById('username');
        const inputGroup = usernameInput.parentElement;
        inputGroup.parentElement.insertBefore(errorDiv, inputGroup.nextSibling);
        
        // Añadir clase de error al input
        usernameInput.classList.add('input-error');
        
        // Enfocar el input
        usernameInput.focus();
        
        // Efecto de shake
        usernameInput.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            usernameInput.style.animation = '';
        }, 500);
    }

    clearValidationError() {
        const errorElement = document.querySelector('.validation-error');
        if (errorElement) {
            errorElement.remove();
        }
        
        const usernameInput = document.getElementById('username');
        if (usernameInput) {
            usernameInput.classList.remove('input-error');
            usernameInput.style.animation = '';
        }
    }

    // Generador de nombres aleatorios usando API externa con async/await
    async generateRandomName() {
        const button = document.getElementById('randomNameBtn');
        const input = document.getElementById('username');
        
        try {
            // Deshabilitar UI y mostrar estado de carga
            button.disabled = true;
            button.textContent = '⏳';
            
            // Limpiar errores de validación previos
            this.clearValidationError();
            
            // Fetch API con async/await para comunicación asíncrona
            const response = await fetch('https://randomuser.me/api/');
            
            // Verificar respuesta HTTP exitosa
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Parsear JSON de la respuesta
            const data = await response.json();
            
            // Extraer nombre y aplicar validación de longitud
            let randomName = data.results[0].name.first;
            if (randomName.length > 20) {
                randomName = randomName.substring(0, 20);
            }
            
            // Establecer el nombre con efecto de escritura
            input.value = '';
            input.focus();
            
            // Efecto de escritura gradual usando Promise y setTimeout
            await this.typeEffect(input, randomName);
            
            // Efecto visual de éxito
            input.style.animation = 'pulse 0.3s ease-in-out';
            setTimeout(() => {
                input.style.animation = '';
            }, 300);
            
        } catch (error) {
            console.error('Error al generar nombre aleatorio:', error);
            
            // Mostrar error usando template literals
            const errorMessage = `❌ Error al conectar con la API.

🌐 Problema de conexión:
• Verifica tu conexión a internet
• El servicio podría estar temporalmente no disponible
• Intenta nuevamente en unos momentos

💡 Mientras tanto, puedes escribir tu nombre manualmente.`;
            
            this.showValidationError(errorMessage);
            
            // Efecto de error en el botón
            button.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                button.style.animation = '';
            }, 500);
            
        } finally {
            // Restaurar botón
            button.disabled = false;
            button.textContent = '🎲';
        }
    }

    // Método auxiliar para efecto de escritura usando Promises
    typeEffect(input, text) {
        return new Promise((resolve) => {
            let index = 0;
            const timer = setInterval(() => {
                input.value = text.substring(0, index + 1);
                index++;
                if (index >= text.length) {
                    clearInterval(timer);
                    resolve();
                }
            }, 50);
        });
    }
}

// Inicialización del juego cuando se carga el DOM
document.addEventListener('DOMContentLoaded', () => {
    const game = new BreakoutGame();
    
    // Exponer el juego globalmente para debugging
    window.breakoutGame = game;
    
    // Prevenir el comportamiento por defecto de ciertas teclas
    document.addEventListener('keydown', (e) => {
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
            e.preventDefault();
        }
    });
});

// Export para uso como módulo ES6 (si fuera necesario)
export default BreakoutGame;