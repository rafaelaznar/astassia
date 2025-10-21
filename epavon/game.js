const filas = 5;
const columnas = 5;
let tablero = Array.from({ length: filas }, () => Array(columnas).fill(0));
let puntos = 0;

const tableroDiv = document.getElementById("tablero");
const puntosSpan = document.getElementById("puntos");

// Crear celdas dinámicamente
function crearTablero() {
  tableroDiv.innerHTML = "";
  tablero.forEach((fila, i) => {
    fila.forEach((celda, j) => {
      const div = document.createElement("div");
      div.classList.add("celda");
      if (celda === 1) div.classList.add("activo");
      div.addEventListener("click", () => verificarClick(i, j));
      tableroDiv.appendChild(div);
    });
  });
}

// Activar una celda aleatoria
function activarAleatorio() {
  // Limpiar tablero
  tablero = tablero.map(fila => fila.map(() => 0));

  const filaRandom = Math.floor(Math.random() * filas);
  const colRandom = Math.floor(Math.random() * columnas);
  tablero[filaRandom][colRandom] = 1;

  crearTablero();
}

// Verificar si el jugador hizo clic en la celda activa
function verificarClick(i, j) {
  if (tablero[i][j] === 1) {
    puntos++;
    puntosSpan.textContent = puntos;
  } else {
    puntos = Math.max(0, puntos - 1);
    puntosSpan.textContent = puntos;
  }
  activarAleatorio();
}

// Iniciar juego
activarAleatorio();
setInterval(activarAleatorio, 2000); // cada 2s cambia la posición