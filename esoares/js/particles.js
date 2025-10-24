/**
 * particles.js
 *
 * Este archivo implementa una animación de partículas conectadas por líneas.
 * Cada partícula se mueve de forma aleatoria y rebota en los bordes.
 * Si dos partículas están cerca, se dibuja una línea entre ellas.
 *
 * Todo el código está encapsulado en una función anónima autoejecutable para evitar conflictos globales.
 *
 * Inspirado en ejemplos de CodePen, pero adaptado y documentado para este proyecto.
 */

(function() {
  // 1. Seleccionamos el contenedor donde irá la animación.
  const particlesContainer = document.getElementById('particles-animation');
  if (!particlesContainer) return; // Si no existe, salimos.

  // 2. Creamos un canvas y lo agregamos al contenedor.
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  particlesContainer.appendChild(canvas);

  // 3. Definimos el array de partículas y cuántas queremos mostrar.
  let particles = [];
  const particleCount = 100;

  // 4. Ajusta el tamaño del canvas a la ventana.
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // 5. Clase Particle: cada partícula tiene posición, velocidad, tamaño y opacidad aleatoria.
  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.5;
      this.radius = Math.random() * 2 + 1;
      this.opacity = Math.random() * 0.5 + 0.5;
    }
    // Actualiza la posición y rebota en los bordes.
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
      if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }
    // Dibuja la partícula como un círculo.
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(252, 61, 33, ${this.opacity})`;
      ctx.fill();
    }
  }

  // 6. Inicializa el array de partículas.
  function init() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }
  }

  // 7. Dibuja líneas entre partículas cercanas para crear el efecto de red.
  function connectParticles() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 120) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(252, 61, 33, ${0.2 * (1 - distance / 120)})`;
          ctx.lineWidth = 1;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  }

  // 8. Bucle principal de animación: limpia, actualiza, dibuja y conecta partículas.
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(particle => {
      particle.update();
      particle.draw();
    });
    connectParticles();
    requestAnimationFrame(animate);
  }

  // 9. Inicializa y lanza la animación.
  init();
  animate();

})();