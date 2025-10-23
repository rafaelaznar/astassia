
  // PARA SELECCIONAR ELEMENTOS
  const $ = sel => document.querySelector(sel);

  // TEMA DINÁMICO 
  const themeSelector = $("#theme-selector");
  const body = document.body;

  themeSelector.addEventListener("change", e => {
    body.className = `theme-${e.target.value}`;
  });

  // VARIABLES DEL JUEGO
  const form = $("#player-form"); // Formulario
  const avatarImg = $("#player-avatar"); // Imagen avatar
  const avatarStyle = $("#avatar-style"); // Selector estilo de avatar
  const playerInput = $("#player-name"); // Input nombre jugador
  const playerDisplay = $("#player-display"); // Mostrar nombre jugador 
  const gameArea = $("#game-area"); // Área de juego
  const basket = $("#basket"); // Cesta
  const scoreDisplay = $("#score"); // Mostrar puntuación
  const timeDisplay = $("#time"); // Mostrar tiempo
  const missedDisplay = $("#missed"); // Mostrar frutas perdidas
  const rankingDiv = $("#ranking"); // Ranking
  const rankingList = $("#ranking-list"); // Lista del ranking
  const restartBtn = $("#restart-btn"); // Botón reiniciar 
  const playerAvatarGame = $("#player-avatar-game"); // Avatar en juego
  const infoBar = $(".info"); // Barra de información
  const formMsg = $("#form-msg"); // Mensaje del formulario
  const difficultySelect = $("#difficulty"); // Selector de dificultad
  const penaltiesPanel = $("#penalties"); // Panel de penalizaciones

  const MAX_MISSED = 10; // Máximo de frutas perdidas 

  // CONFIGURACIÓN DEL JUEGO
  // Usamos un símbolo para identificar objetos Fruit
  const FRUIT_SYMBOL = Symbol("fruit");

  // Configuración inicial 
  const gameConfig = {
    fruitSpeed: 3,
    duration: 90,
    spawnRate: 1200
  };

  let playerName = ""; // Nombre del jugador
  let score = 0; // Puntuación
  let fruits = []; // Array de frutas en juego
  let gameRunning = false; // Estado del juego
  let timeLeft = gameConfig.duration; // Tiempo restante
  let gameLoopId; // ID bucle del juego
  let spawnIntervalId; // ID intervalo de generación de frutas
  let badFruitChance = 0.2; // Probabilidad inicial de fruta mala
  let gameEnded = false; // Estado de finalización del juego
  let missedFruits = 0; // Frutas perdidas

  // Configuración por dificultad
  function setDifficulty(level) {
    switch (level) {
      case "easy":
        gameConfig.fruitSpeed = 3;
        gameConfig.spawnRate = 1000;
        badFruitChance = 0.1;
        break;
      case "medium":
        gameConfig.fruitSpeed = 4;
        gameConfig.spawnRate = 700;
        badFruitChance = 0.2;
        break;
      case "hard":
        gameConfig.fruitSpeed = 5;
        gameConfig.spawnRate = 500;
        badFruitChance = 0.3;
        break;
      case "insane":
        gameConfig.fruitSpeed = 6;
        gameConfig.spawnRate = 400;
        badFruitChance = 0.4;
        break;
    }
  }

  // AVATAR CON API EXTERNA  !!!!
  function updateAvatar(seedDefault = "aventurero") {
    const style = avatarStyle.value;
    const seed = playerInput.value.trim() || seedDefault;
    avatarImg.src = `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
  }

  window.addEventListener("DOMContentLoaded", updateAvatar);
  avatarStyle.addEventListener("change", updateAvatar);
  playerInput.addEventListener("input", updateAvatar);

  // COMPROBAR QUE EL FORMULARIO ES CORRECTO Y EMPEZAR JUEGO
  form.addEventListener("submit", e => {
    e.preventDefault();

    const nameValue = playerInput.value.trim();
    const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,10}$/;
    const msg = document.getElementById("form-msg");

    // Si el nombre no cumple el patrón, mostrar mensaje personalizado
    if (!regex.test(nameValue)) {
      msg.textContent = "⚠️ Introduce un nombre válido (sólamente letras, mínimo 2 - máximo 10).";
      msg.style.color = "#ff4d6d";
      return;
    }

    // Si es válido → limpiar mensaje y continuar
    msg.textContent = "";
    playerName = nameValue;
    startGame();
  });


  // CLASE FRUTA - "FRUTAS" MALAS INCLUIDAS
  class Fruit {
    constructor(emoji, speed, isBad = false, penalty = 0, deadly = false) {
      this[FRUIT_SYMBOL] = true;
      this.emoji = emoji;
      this.speed = speed;
      this.isBad = isBad;
      this.penalty = penalty;
      this.deadly = deadly;
      this.x = Math.random() * (gameArea.offsetWidth - 30);
      this.y = 0;
      this.hit = false;

      this.element = document.createElement("div");
      this.element.classList.add("fruit");
      this.element.textContent = emoji;
      this.element.style.left = `${this.x}px`;
      gameArea.appendChild(this.element);
    }

    // Método para que la fruta caiga
    fall() {
      this.y += this.speed;
      this.element.style.top = `${this.y}px`;

      // Eliminar fruta si se sale
      if (this.y > gameArea.offsetHeight - 30) {
        this.remove();
        // SOLO contar como perdida si NO ha sido atrapada y NO es fruta mala
        if (!this.hit && !this.isBad) {
          missedFruits++;
          updateMissedDisplay();
          // Comprobar si se ha alcanzado el máximo de frutas perdidas
          if (missedFruits >= MAX_MISSED) {
            basket.style.background = "rgba(0,0,0,0.6)";
            setTimeout(() => endGame("death"), 400);
          }
        }
      }
    }
    // Método para eliminar la fruta
    remove() {
      if (this.element.parentElement) this.element.remove();
      fruits = fruits.filter(f => f !== this);
    }
  }

    // OBTENER EMOJIS DE FRUTAS 
    function getFruitEmojis() {
      return ["🍓", "🍉", "🍒", "🍍", "🍋", "🍑", "🥝", "🍏", "🍌", "🍇"];
    }


  // FRUTAS MALAS Y PENALIZACIONES
  const badEmojis = [
    { emoji: "☣️", penalty: 3 },
    { emoji: "☠️", deadly: true },
    { emoji: "💩", penalty: 2 },
    { emoji: "💣", penalty: 4 }
  ];

  // EMPEZAR JUEGO
  async function startGame() {
    fruits.forEach(f => f.remove());
    fruits = [];
    score = 0;
    missedFruits = 0;
    updateMissedDisplay();
    timeLeft = gameConfig.duration;
    scoreDisplay.textContent = "0";
    timeDisplay.textContent = timeLeft;

    // Ocultar formulario y enseñar el área de juego
    form.style.display = "none";
    rankingDiv.style.display = "none";
    infoBar.classList.add("visible");
    gameArea.style.display = "block";
    basket.style.display = "block";
    basket.style.background = "transparent";

    // Muestra la información en la derecha: penalizaciones
    if (penaltiesPanel) {
      penaltiesPanel.style.opacity = "1";
      penaltiesPanel.style.transition = "opacity 0.6s ease";
      penaltiesPanel.style.pointerEvents = "auto";
    }

    // Centramos la cesta al principio
    const rect = gameArea.getBoundingClientRect();
    basket.style.left = `${Math.round((rect.width - basket.offsetWidth) / 2)}px`;

    // Inicialización de variables
    gameRunning = true;
    playerDisplay.textContent = playerName;
    playerAvatarGame.src = avatarImg.src;

    // Cargar emojis de frutas y configurar dificultad
    const fruitEmojis = await getFruitEmojis();
    setDifficulty(difficultySelect.value);

     // DESESTRUCTURACIÓN DE CONFIGURACIÓN DEL JUEGO
    const { fruitSpeed, spawnRate, duration } = gameConfig; // Desestructuración de objeto
    console.log(`🎮 Config actual → Velocidad: ${fruitSpeed}, Frecuencia: ${spawnRate}, Duración: ${duration}`);
    // Combinamos frutas buenas y malas en un solo array (spread + map)
    const allFruits = [...fruitEmojis, ...badEmojis.map(b => b.emoji)];
    console.log("🍎 Todas las frutas posibles:", allFruits);

    // Inicia control de la cesta (jugador) y bucle del juego
    document.addEventListener("mousemove", moveBasket);
    spawnFruits(fruitEmojis);
    gameLoopId = requestAnimationFrame(gameLoop);
    countdown(fruitEmojis);
  }

  // GENERADOR DE FRUTAS
  function spawnFruits(fruitEmojis) {
    clearInterval(spawnIntervalId);
    spawnIntervalId = setInterval(() => {
      if (!gameRunning) return; 

      // Decidir si la fruta es mala o buena y actuar en consecuencia
      const isBad = Math.random() < badFruitChance;
      let emoji, penalty = 0, deadly = false;

      if (isBad) {
        const bad = badEmojis[Math.floor(Math.random() * badEmojis.length)];
        emoji = bad.emoji;
        penalty = bad.penalty || 0;
        deadly = bad.deadly || false;
      } else {
        emoji = fruitEmojis[Math.floor(Math.random() * fruitEmojis.length)];
      }

      // Crear la fruta y añadirla al array
      const fruit = new Fruit(emoji, gameConfig.fruitSpeed, isBad, penalty, deadly);
      fruits.push(fruit);
    }, gameConfig.spawnRate); // llamamos config para aparición de frutas
  }

  // MOVIMIENTO CESTA
  function moveBasket(e) {
    const rect = gameArea.getBoundingClientRect();
    const basketWidth = basket.offsetWidth;
    let posX = e.clientX - rect.left;
    const minX = 0;
    const maxX = Math.max(0, Math.round(rect.width - basketWidth));
    let left = Math.round(posX - basketWidth / 2);
    if (left < minX) left = minX;
    if (left > maxX) left = maxX;
    basket.style.left = `${left}px`;
  }

  // TEMPORIZADOR
  function countdown(fruitEmojis) {
    const interval = setInterval(() => {
      if (!gameRunning) {
        clearInterval(interval);
        return;
      }

      // Restar tiempo y actualizar contador en pantalla
      timeLeft--;
      timeDisplay.textContent = timeLeft;

      // Aumentar dificultad progresivamente
      if ((["medium", "hard", "insane"].includes(difficultySelect.value)) &&
          timeLeft % (difficultySelect.value === "insane" ? 5 : 10) === 0 &&
          timeLeft < gameConfig.duration) {
            // Aumentar velocidad de las frutas
        gameConfig.fruitSpeed += (difficultySelect.value === "insane" ? 1 : 0.5);
            // Disminuir tiempo de aparición de frutas (hasta un mínimo)
        if (gameConfig.spawnRate > 300)
          gameConfig.spawnRate -= (difficultySelect.value === "insane" ? 50 : 100);

        // Reiniciar generador de frutas con nueva configuración
        spawnFruits(fruitEmojis);
      }

      // Comprobar si se ha acabado el tiempo y terminar el juego si es así
      if (timeLeft <= 0) {
        clearInterval(interval);
        endGame("time");
      }
    }, 1000); // Actualización cada segundo
  }

  // BUCLE PRINCIPAL DEL JUEGO
  function gameLoop() {
    if (!gameRunning) return;
    fruits.forEach(fruit => fruit.fall());
    detectCollisions();
    gameLoopId = requestAnimationFrame(gameLoop);
  }

  /* DETECCIÓN DE COLISIONES:
  Choque de fruta con cesta: suma puntos si es buena, resta tiempo si es mala o termina el juego si es la calavera */
  function detectCollisions() {
    const basketRect = basket.getBoundingClientRect(); // Área de la cesta

    // Comprobar cada fruta
    fruits.forEach(fruit => {
      const fruitRect = fruit.element.getBoundingClientRect();
      const overlapX = fruitRect.right > basketRect.left && fruitRect.left < basketRect.right;
      const overlapY = fruitRect.bottom >= basketRect.top && fruitRect.bottom <= basketRect.bottom;

      if (overlapX && overlapY) { // Que no se cuente más de una vez la misma fruta
        if (fruit.hit) return;
        fruit.hit = true;

        // Animación de captura de fruta
        fruit.element.style.transition = "transform 0.2s ease, opacity 0.2s ease";
        fruit.element.style.transform = "scale(0)";
        fruit.element.style.opacity = "0";
        setTimeout(() => fruit.remove(), 180);

        // Si la fruta es mala, aplicar penalización
        if (fruit.isBad) {
          if (fruit.deadly) { // Si es la calavera, fin de juego inmediato y animación visual
            basket.style.background = "rgba(0,0,0,0.6)";
            setTimeout(() => endGame("death"), 400);
            return;
          } else { // Fruta pocha: resta de tiempo y animación visual 
            const secondsToRemove = fruit.penalty || 2;
            timeLeft = Math.max(0, timeLeft - secondsToRemove);
            timeDisplay.textContent = Math.max(0, timeLeft).toFixed(0);
            basket.style.transition = "background 0.2s";
            basket.style.background = "rgba(255, 0, 0, 0.4)";
            setTimeout(() => (basket.style.background = "transparent"), 200);
          }
        } else { // Fruta buena: sumar puntos
          score++;
          scoreDisplay.textContent = score;
        }
      }
    });
  }

  // MOSTRAR FRUTAS PERDIDAS EN PANTALLA 
  function updateMissedDisplay() {
    if (missedDisplay) missedDisplay.textContent = missedFruits;
  }

  // FINALIZAR JUEGO
  function endGame(reason = "time") {
    if (gameEnded) return; // Evitar que se llame varias veces
    gameEnded = true;

    // Detener el juego
    gameRunning = false;
    cancelAnimationFrame(gameLoopId);
    clearInterval(spawnIntervalId);
    document.removeEventListener("mousemove", moveBasket);

    // Eliminar todas las frutas que queden
    fruits.forEach(f => f.remove());
    fruits = [];

    // Ocultar información de la derecha
    const penaltiesPanel = document.getElementById("penalties");
    if (penaltiesPanel) penaltiesPanel.classList.add("hidden");

    // Mostrar el "GAME OVER" o puntuación final
    const deathOverlay = document.getElementById("death-overlay");
    if (reason === "death") {
      deathOverlay.textContent = `💀 GAME OVER 💀\n🍓 Puntuación: ${score}`;
    } else {
      deathOverlay.textContent = `🍓 Puntuación: ${score}`;
    }

    deathOverlay.classList.add("visible"); 

    // Después de un poco, se oculta el juego en sí y se muestra el ranking
    setTimeout(() => {
      deathOverlay.classList.remove("visible");
      infoBar.classList.remove("visible");
      gameArea.style.display = "none";
      basket.style.display = "none";
      rankingDiv.style.display = "block";

      // Guardar la puntuación y mostrarla
      saveScore(playerName, score);
      renderRanking();
    }, 1200); // Tiempo para que aparezca la info
  }

  // RANKING EN SESSION (guardar y mostrar puntuaciones DURANTE la SESIÓN - LOCAL sería permanente)
  // Guardar puntuación
  function saveScore(name, score) {
    // Obtener dificultad actual
    const difficulty = difficultySelect.value;

    // Obtener ranking general (o crear uno nuevo)
    const allRankings = JSON.parse(sessionStorage.getItem("treatzRanking") || "{}");

    // Crear array para esta dificultad si no existe
    if (!allRankings[difficulty]) allRankings[difficulty] = [];

    // Añadir puntuación y ordenar
    allRankings[difficulty].push({ name, score });
    allRankings[difficulty].sort((a, b) => b.score - a.score);

    // Guardar solo top 5 por dificultad
    allRankings[difficulty] = allRankings[difficulty].slice(0, 5);

    // Guardar todo en sessionStorage
    sessionStorage.setItem("treatzRanking", JSON.stringify(allRankings));
  }

  // Mostrar ranking (por dificultad)
  function renderRanking() {
    const allRankings = JSON.parse(sessionStorage.getItem("treatzRanking") || "{}");

    // Mapeo de dificultad a texto, emoji y color
    const difficultyLabels = {
      easy: { name: "🍏 Fácil", color: "#4caf50" },     // verde
      medium: { name: "🍊 Medio", color: "#ff9800" },   // naranja
      hard: { name: "🌶️ Difícil", color: "#e53935" },  // rojo
      insane: { name: "💀 Locura", color: "#9c27b0" }   // morado
    };

    let html = "";

    // Generar bloques para cada dificultad
    for (const key in difficultyLabels) {
      const { name, color } = difficultyLabels[key];
      const ranking = allRankings[key] || [];

      html += `<div class="difficulty-block" style="border-left: 6px solid ${color}; padding-left: 10px; margin-bottom: 15px;">`;
      html += `<h3 style="color:${color};">${name}</h3>`;

      if (ranking.length === 0) {
        html += "<p><em>Aún no hay puntuaciones 🍒</em></p>";
      } else {
        html += "<ol style='list-style:none; padding-left:0;'>";
        ranking.forEach((r, i) => {
          html += `<li style="margin:4px 0;">${i + 1}. <strong>${r.name}</strong> — 🍓 ${r.score}</li>`;
        });
        html += "</ol>";
      }

      html += "</div>";
    }

    rankingList.innerHTML = html;
  }


  // REINICIAR JUEGO
  // Ocultar ranking y volver al formulario
  restartBtn.addEventListener("click", () => {
    rankingDiv.style.display = "none";
    form.reset();
    form.style.display = "flex";
    formMsg.textContent = "";

    // Mostrar de nuevo el panel de penalizaciones
    const penaltiesPanel = document.getElementById("penalties");
    if (penaltiesPanel) penaltiesPanel.classList.remove("hidden");

    // Reinicio de variables
    gameEnded = false;
    score = 0;
    missedFruits = 0;
    updateMissedDisplay();
    timeLeft = gameConfig.duration;

    // Reinicio de displays
    scoreDisplay.textContent = "0";
    timeDisplay.textContent = timeLeft;

    // Reinicio visual de la cesta y del avatar
    basket.style.background = "transparent";
    updateAvatar();
  });
















