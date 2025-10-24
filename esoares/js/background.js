/**
 * background.js
 *
 * Este archivo crea una animación de fondo estrellado usando canvas.
 * La mitad superior es negra y la inferior tiene un gradiente animado entre tonos rojos y azules.
 *
 * Se generan estrellas que parpadean y caen suavemente, reiniciándose al llegar al final.
 * Todo el código está documentado para que comprendas cómo funciona la animación y el manejo de canvas.
 */

// ========== 1. CONFIGURACIÓN INICIAL DEL CANVAS ==========
// Seleccionamos el canvas del DOM y obtenemos su contexto 2D para dibujar.
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');

// ========== 2. FUNCIÓN PARA AJUSTAR TAMAÑO DEL CANVAS ==========
// Esta función hace que el canvas siempre ocupe toda la pantalla.
function resizeCanvas(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ========== 3. CREACIÓN DE ESTRELLAS ==========
// Calculamos cuántas estrellas mostrar según el tamaño de pantalla.
// Creamos un array de estrellas, cada una con posición, tamaño, velocidad y parpadeo aleatorios.
const STAR_COUNT = Math.floor((window.innerWidth * window.innerHeight) / 20000);
const stars = [];
for(let i = 0; i < STAR_COUNT; i++){
  stars.push({
    x: Math.random() * canvas.width,    // Posición horizontal aleatoria
    y: Math.random() * canvas.height,   // Posición vertical aleatoria
    r: Math.random() * 1.3 + 0.2,      // Radio (tamaño) entre 0.2 y 1.5
    speed: Math.random() * 0.4 + 0.05, // Velocidad de caída
    twinkle: Math.random() * 0.05 + 0.02 // Velocidad de parpadeo
  });
}

// ========== 4. FUNCIONES PARA MANIPULAR COLORES ==========
// Utilidades para convertir colores entre formatos y mezclarlos.
// Permiten crear gradientes animados y efectos visuales suaves.
function hexToRgb(h){
  h = h.replace('#','');
  return [
    parseInt(h.slice(0,2),16),
    parseInt(h.slice(2,4),16),
    parseInt(h.slice(4,6),16)
  ];
}
function rgbToHex(rgb){
  return '#' + rgb.map(v => Math.round(v).toString(16).padStart(2,'0')).join('');
}
function mix(a, b, f){
  return [
    a[0] + (b[0] - a[0]) * f,
    a[1] + (b[1] - a[1]) * f,
    a[2] + (b[2] - a[2]) * f
  ];
}

// ========== 5. VARIABLE DE TIEMPO PARA ANIMACIONES ==========
// Variable de tiempo global para animar gradientes y estrellas.
let t = 0;

// ========== 6. FUNCIÓN PRINCIPAL DE DIBUJO ==========
// Esta función dibuja el fondo animado y las estrellas en cada frame.
// El gradiente inferior cambia suavemente de color y las estrellas parpadean y caen.
function draw(){
  t += 0.01;
  // Creamos un gradiente vertical: negro arriba, animado abajo.
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, '#000000');
  g.addColorStop(0.5, '#000000');
  // Colores animados para la parte inferior
  const redA = '#200404', redB = '#2d0a0a';
  const blueA = '#0B3D91', blueB = '#3B6BD9';
  const p = (Math.sin(t * 0.05) * 0.5) + 0.5;
  const c1 = rgbToHex(mix(hexToRgb(redA), hexToRgb(blueA), p));
  const c2 = rgbToHex(mix(hexToRgb(redB), hexToRgb(blueB), p));
  g.addColorStop(0.7, c1);
  g.addColorStop(1, c2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Dibujamos y animamos cada estrella
  stars.forEach(s => {
    // Parpadeo usando seno
    const flicker = 0.5 + Math.sin(t * (s.twinkle * 50) + s.x) * 0.5;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r * flicker, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255,' + (0.7 * flicker) + ')';
    ctx.fill();
    // Caída suave
    s.y += s.speed * (0.8 + Math.sin(t * 0.2) * 0.2);
    // Si sale por abajo, reaparece arriba
    if(s.y > canvas.height + 2) {
      s.y = -2;
      s.x = Math.random() * canvas.width;
    }
  });
  // Pedimos el siguiente frame para animar continuamente
  requestAnimationFrame(draw);
}
// ========== 7. INICIAR LA ANIMACIÓN ==========
// Iniciamos el bucle de animación al cargar el archivo.
requestAnimationFrame(draw);