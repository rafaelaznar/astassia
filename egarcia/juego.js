class JuegoAdivinaPersonaje {
  constructor() {
    this.personajes = [];
    this.personajeActual = null;
    this.opciones = [];
    this.intentoActual = 0;
    this.puntuacionTotal = 0;
    this.pistas = [];
    this.personajesJugados = [];
    this.puntuacionPorIntento = { 0: 50, 1: 25, 2: 10 };
    this.opcionesIncorrectas = [];
    this.opcionCorrecta = null;
  }

  async init() {
    try {
      console.log("Iniciando juego...");
      await this.cargarPersonajes();
      this.configurarEventos();
      this.iniciarRonda();
    } catch (error) {
      console.error("Error al inicializar:", error);
      this.mostrarError(
        "Error al cargar los personajes. Por favor, recarga la página."
      );
    }
  }

  async cargarPersonajes() {
    try {
      console.log("Cargando personajes...");
      const apiUrl =
        "https://www.demonslayer-api.com/api/v1/characters?limit=50";
      const proxyUrl = "https://corsproxy.io/?";
      const url = proxyUrl + encodeURIComponent(apiUrl);

      const response = await fetch(url);
      if (!response.ok) throw new Error("Error al cargar personajes");

      const data = await response.json();
      const todosLosPersonajes = data.content || [];

      const regexImagen = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i;
      const personajesFiltrados = todosLosPersonajes.filter(
        (p) =>
          p.img && regexImagen.test(p.img) && p.name && p.name.trim() !== ""
      );

      const personajesMezclados = personajesFiltrados.sort(
        () => Math.random() - 0.5
      );
      this.personajes = personajesMezclados.slice(0, 10);

      console.log("Personajes cargados: " + this.personajes.length);
    } catch (error) {
      console.error("Error al cargar personajes:", error);
      throw error;
    }
  }

  generarPistas(personaje) {
    const pistas = [];

    if (personaje.gender) {
      const genero =
        personaje.gender.toLowerCase() === "male" ? "masculino" : "femenino";
      pistas.push("Género: " + genero);
    }

    if (personaje.race) {
      pistas.push("Raza: " + personaje.race);
    }

    if (personaje.age) {
      pistas.push("Edad: " + personaje.age + " años");
    }

    return pistas;
  }

  seleccionarNombresAleatorios(correcto) {
    const personajesIncorrectos = this.personajes.filter(
      (p) => p.id !== correcto.id
    );
    const mezclados = personajesIncorrectos.sort(() => Math.random() - 0.5);
    const seleccionados = mezclados.slice(0, 3);
    const nombresIncorrectos = seleccionados.map((p) => p.name);
    return [correcto.name, ...nombresIncorrectos].sort(() => Math.random() - 0.5);
  }

  iniciarRonda() {
    const personajesDisponibles = this.personajes.filter(
      (p) => !this.personajesJugados.includes(p.id) && this.generarPistas(p).length >= 3
    );

    if (personajesDisponibles.length === 0) {
      this.finalizarJuego();
      return;
    }

    const indiceAleatorio = Math.floor(
      Math.random() * personajesDisponibles.length
    );
    this.personajeActual = personajesDisponibles[indiceAleatorio];
    this.personajesJugados.push(this.personajeActual.id);
    this.intentoActual = 0;
    this.pistas = this.generarPistas(this.personajeActual);
    this.opciones = this.seleccionarNombresAleatorios(this.personajeActual);

    this.opcionesIncorrectas = [];
    this.opcionCorrecta = this.personajeActual.name;

    console.log("Personaje actual:", this.personajeActual.name);

    this.actualizarContador();
    this.renderizarCarta();
    this.renderizarPista();
    this.renderizarOpciones();

    document.getElementById("resultadoCard").classList.add("d-none");
    document.getElementById("siguienteBtn").style.display = "none";

    document.querySelector("h1.text-center").style.display = "block";
    document.querySelector(".contador-personajes").style.display = "block";
    document.querySelector(".card.shadow.mb-4 > .card-body").style.display =
      "block";
  }

  actualizarContador() {
    const contadorTexto = document.getElementById("contadorTexto");
    if (contadorTexto) {
      contadorTexto.textContent = this.personajesJugados.length;
    }
  }

  renderizarCarta() {
    const carta = document.getElementById("cartaPersonaje");
    const imagen = document.getElementById("imagenPersonaje");
    imagen.src = this.personajeActual.img;
    imagen.alt = "Personaje misterioso";
    carta.classList.remove("revelada");
  }

  renderizarPista() {
    const pistaNumero = document.getElementById("pistaNumero");
    const pistaTexto = document.getElementById("pistaTexto");
    pistaNumero.textContent = this.intentoActual + 1;
    pistaTexto.innerHTML =
      '<i class="bi bi-info-circle-fill text-primary me-2"></i>' +
      this.pistas[this.intentoActual];
  }

  renderizarOpciones(mostrarCorrecta = false) {
    const container = document.getElementById("opcionesContainer");
    container.innerHTML = "";

    for (let i = 0; i < this.opciones.length; i++) {
      const nombre = this.opciones[i];
      const letra = String.fromCharCode(65 + i);
      let clase = "";
      if (this.opcionesIncorrectas.includes(nombre)) clase = "incorrecto";
      if (mostrarCorrecta && nombre === this.opcionCorrecta) clase = "correcto";

      const botonHTML = `
        <button class="btn-opcion ${clase}" data-nombre="${nombre}">
          <span class="opcion-letra">${letra}</span>
          <span class="opcion-nombre">${nombre}</span>
        </button>
      `;
      container.innerHTML += botonHTML;
    }
  }

  configurarEventos() {
    const self = this;

    document
      .getElementById("opcionesContainer")
      .addEventListener("click", function (e) {
        const boton = e.target.closest(".btn-opcion");
        if (boton) {
          const nombre = boton.getAttribute("data-nombre");
          self.verificarRespuesta(nombre);
        }
      });

    document
      .getElementById("siguienteBtn")
      .addEventListener("click", function () {
        self.iniciarRonda();
      });
  }

  verificarRespuesta(nombre) {
    const esCorrecto = nombre === this.personajeActual.name;

    if (esCorrecto) {
      const puntos = this.puntuacionPorIntento[this.intentoActual];
      this.puntuacionTotal += puntos;

      this.renderizarOpciones(true);
      this.revelarCarta();
      setTimeout(() => this.mostrarResultado(true, puntos), 800);
    } else {
      this.intentoActual++;
      this.opcionesIncorrectas.push(nombre);
      this.renderizarOpciones();

      if (this.intentoActual < 3) {
        this.renderizarPista();
        this.mostrarFeedback(false);
      } else {
        this.renderizarOpciones(true);
        this.revelarCarta();
        setTimeout(() => this.mostrarResultado(false, 0), 800);
      }
    }
  }

  revelarCarta() {
    const carta = document.getElementById("cartaPersonaje");
    carta.classList.add("revelada");
  }

  mostrarFeedback() {
    const container = document.getElementById("opcionesContainer");
    const feedback = document.createElement("div");
    feedback.className = "alert alert-warning mt-3";
    feedback.innerHTML =
      '<i class="bi bi-x-circle me-2"></i> Incorrecto, mira la siguiente pista';
    container.parentNode.insertBefore(feedback, container.nextSibling);
    setTimeout(() => feedback.remove(), 2000);
  }

  mostrarResultado(correcto, puntos) {
    const resultadoCard = document.getElementById("resultadoCard");
    const resultadoContenido = document.getElementById("resultadoContenido");

    let mensaje = "";
    if (puntos === 50) mensaje = "¡Increíble! Primer intento";
    else if (puntos === 25) mensaje = "¡Bien hecho! Segundo intento";
    else if (puntos === 10) mensaje = "¡Lo lograste! Tercer intento";
    else mensaje = "Era: " + this.personajeActual.name;

    let html = `<div class="mb-3">
                  ${correcto ? '<i class="bi bi-trophy-fill text-warning" style="font-size: 3rem;"></i>'
        : '<i class="bi bi-emoji-frown text-muted" style="font-size: 3rem;"></i>'}
                </div>
                <h4 class="mb-3">${mensaje}</h4>`;

    if (correcto)
      html += `<h5 class="text-success mb-3">+${puntos} puntos</h5>`;

    html += `<div class="puntuacion-final p-3">
               <h5 class="mb-2"><i class="bi bi-trophy"></i> Puntuación Total</h5>
               <span class="puntos-display-final">${this.puntuacionTotal}</span>
               <small class="d-block mt-2">puntos</small>
             </div>`;

    resultadoContenido.innerHTML = html;
    resultadoCard.classList.remove("d-none");
    document.getElementById("siguienteBtn").style.display = "block";
    document.querySelector("h1.text-center").style.display = "none";
    document.querySelector(".contador-personajes").style.display = "none";
    document.querySelector(".card.shadow.mb-4 > .card-body").style.display =
      "none";
  }

  finalizarJuego() {
    const resultadoCard = document.getElementById("resultadoCard");
    const resultadoContenido = document.getElementById("resultadoContenido");

    let html = '<div class="mb-4">';
    html += '<i class="bi bi-trophy-fill text-warning" style="font-size: 5rem;"></i>';
    html += '</div><h2 class="mb-3">¡Juego Completado!</h2>';
    html += '<h3 class="text-success mb-4">Puntuación Final: ' + this.puntuacionTotal + '</h3>';

    html += '<div class="d-flex justify-content-center gap-3">';
    html += '<button class="btn btn-success btn-lg" onclick="location.reload()">';
    html += '<i class="bi bi-arrow-clockwise me-2"></i> Jugar de Nuevo</button>';

    html += '<a href="formulario.html" class="btn btn-warning btn-lg">';
    html += '<i class="bi bi-star-fill me-2"></i> Valorar el Juego</a>';
    html += '</div>';

    resultadoContenido.innerHTML = html;
    resultadoCard.classList.remove("d-none");
    document.getElementById("siguienteBtn").style.display = "none";
  }

  mostrarError(mensaje) {
    const pistaTexto = document.getElementById("pistaTexto");
    if (pistaTexto) {
      pistaTexto.innerHTML = `<div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i> ${mensaje}
      </div>`;
    }
  }
}

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM listo, iniciando juego...");
  const juego = new JuegoAdivinaPersonaje();
  juego.init();
  window.juego = juego;
});