const IMAGES = [
  'assets/Mario.png',
  'assets/Luigi.png',
  'assets/Wario.png',
  'assets/Yoshi.png',
];

const filas = 10;
const columnas = 10;
const TOTAL_CELDAS = filas * columnas;

let puntos = 0;
let currentTarget = null;

const tableroDiv = document.getElementById("tablero");
const puntosSpan = document.getElementById("puntos");
const targetImgEl = document.getElementById("targetImg");
const targetNameEl = document.getElementById("targetName");

tableroDiv.style.gridTemplateColumns = `repeat(${columnas}, 60px)`;
tableroDiv.style.gridAutoRows = `60px`;

function basename(path) {
  return path.split('/').pop();
}

function pickRandomImage(exclude = null) {
  const pool = IMAGES.filter(i => i !== exclude);
  if (pool.length === 0) return exclude; // fallback
  return pool[Math.floor(Math.random() * pool.length)];
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateGrid() {
  // Rellenar celdas con imágenes aleatorias, asegurando que la imagen objetivo
  // aparezca exactamente una vez.
  const cells = [];
  const pool = IMAGES.filter(p => p !== currentTarget);

  if (pool.length === 0) {
    // Si no hay otras imágenes (caso extremo), rellenar todo con la objetivo
    for (let i = 0; i < TOTAL_CELDAS; i++) {
      cells.push(currentTarget);
    }
  } else {
    // Rellenar TOTAL_CELDAS - 1 con imágenes que NO sean la objetivo
    for (let i = 0; i < TOTAL_CELDAS - 1; i++) {
      cells.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    // Insertar la imagen objetivo en una posición aleatoria
    const pos = Math.floor(Math.random() * TOTAL_CELDAS);
    cells.splice(pos, 0, currentTarget);
    // ahora cells.length === TOTAL_CELDAS
  }

  // Mezclar visualmente (la objetivo seguirá apareciendo una sola vez)
  shuffleArray(cells);

  tableroDiv.innerHTML = '';
  cells.forEach((imgPath, index) => {
    const div = document.createElement('div');
    div.className = 'celda';
    const img = document.createElement('img');
    img.src = imgPath;
    img.alt = basename(imgPath);
    div.appendChild(img);

    if (imgPath === currentTarget) div.classList.add('activo');

    div.addEventListener('click', () => onCellClick(imgPath, div));
    tableroDiv.appendChild(div);
  });
}

function onCellClick(imagePath, cellEl) {
  if (imagePath === currentTarget) {
    puntos++;
    puntosSpan.textContent = puntos;
    // Elegir nueva imagen objetivo (diferente)
    const nueva = pickRandomImage(currentTarget);
    currentTarget = nueva;
    updateTargetDisplay();
    generateGrid();
  } else {
    puntos = Math.max(0, puntos - 1);
    puntosSpan.textContent = puntos;
    cellEl.classList.add('wrong');
    setTimeout(() => cellEl.classList.remove('wrong'), 350);
  }
}

function updateTargetDisplay() {
  if (!currentTarget) return;
  targetImgEl.src = currentTarget;
  targetImgEl.alt = basename(currentTarget);
  targetNameEl.textContent = basename(currentTarget);
}

function startGame() {
  // Elegir imagen objetivo inicial
  currentTarget = pickRandomImage();
  updateTargetDisplay();
  generateGrid();
  // Cada 4s se reorganizan las imágenes (la imagen objetivo permanece hasta ser atrapada)
  setInterval(generateGrid, 4000);
}

document.addEventListener('DOMContentLoaded', startGame);

// --- Añadido: reproducción de fondo desde YouTube ---
const YT_VIDEO_ID = 'GFKuQJTMNX8';
// src con mute=1 para intentar autoplay (los navegadores permiten autoplay silenciado)
function ytSrc(muted = true) {
  const base = `https://www.youtube.com/embed/${YT_VIDEO_ID}`;
  const params = new URLSearchParams({
    autoplay: '1',
    loop: '1',
    playlist: YT_VIDEO_ID,
    controls: '0',
    rel: '0',
    modestbranding: '1',
  });
  if (muted) params.set('mute', '1');
  return `${base}?${params.toString()}`;
}

let audioUnmuted = false;
const soundToggleBtn = document.getElementById('soundToggle');
const ytPlayer = document.getElementById('ytPlayer');

// Inicializar iframe silenciado para permitir autoplay en background
if (ytPlayer) {
  ytPlayer.src = ytSrc(true);
}

function setAudioUnmuted(unmuted) {
  audioUnmuted = !!unmuted;
  if (!ytPlayer) return;
  // Recargar iframe con o sin mute; la recarga se realiza en el contexto del click (user gesture)
  ytPlayer.src = ytSrc(!audioUnmuted);
  soundToggleBtn.textContent = audioUnmuted ? 'Silenciar' : 'Activar sonido';
}

if (soundToggleBtn) {
  soundToggleBtn.addEventListener('click', () => {
    // En un click de usuario recargamos el iframe sin 'mute' para intentar reproducir con sonido
    setAudioUnmuted(!audioUnmuted);
    // Hacer visible el iframe opcionalmente (se mantiene oculto por defecto)
    // ytPlayer.classList.add('visible'); // descomentar si quieres ver el video
  });
}
