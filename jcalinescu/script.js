$(document).ready(function() {
  console.log("Moodify+ interactivo activo 🌿");

  // 🧹 LIMPIAR SESIÓN AL CARGAR LA PÁGINA
  // Eliminar cualquier sesión previa al recargar o entrar al programa
  localStorage.removeItem('moodify_user_session');

  // Variables globales para frases
  let frasesObtenidas = [];
  let indiceFraseActual = 0;
  let intervaloCicloFrases;
  let introduccionMostrada = false; // Controlar si ya se mostró la introducción
  let frasesCache = null; // Caché de frases para toda la sesión (evita múltiples peticiones API)

  // 🔐 GESTIÓN DE SESIÓN DE USUARIO CON LOCAL STORAGE
  const STORAGE_KEY = 'moodify_user_session';

  /**
   * Guarda la sesión del usuario en Local Storage
   * @param {string} nombre Nombre del usuario
   * @param {string} email Email del usuario
   */
  function guardarSesionUsuario(nombre, email) {
    const userData = {
      nombre: nombre,
      email: email
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
  }

  /**
   * Obtiene la sesión del usuario del Local Storage
   * @returns {Object|null} Datos del usuario o null si no hay sesión
   */
  function obtenerSesionUsuario() {
    try {
      const userData = localStorage.getItem(STORAGE_KEY);
      if (userData) {
        return JSON.parse(userData);
      }
    } catch (error) {
      console.error('Error al obtener sesión de usuario:', error);
    }
    return null;
  }

  /**
   * Elimina la sesión del usuario del Local Storage
   */
  function cerrarSesionUsuario() {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Muestra el botón de navegación con animación suave
   */
  function mostrarBotonNavegacion() {
      $(".header-navigation-fixed").fadeIn(500).addClass("visible");
  }

  /**
   * Oculta el botón de navegación durante la experiencia inmersiva
   */
  function ocultarBotonNavegacion() {
    $(".header-navigation-fixed").removeClass("visible");
  }

  /**
   * Verifica si hay una sesión activa y configura la interfaz
   */
  function verificarSesionActiva() {
    const userData = obtenerSesionUsuario();
    
    if (userData && userData.nombre && userData.email) {
      // Hay sesión activa, ocultar campos de nombre y email
      $("#nombre").closest('.form-section').hide();
      $("#email").closest('.form-section').hide();
      
      // Mostrar mensaje de bienvenida
      $("#labelEstadoAnimo").html(`¡Hola ${userData.nombre}! ¿Cómo te sientes hoy?`);
      
      // Añadir botón de cerrar sesión si no existe
      if (!$("#btnCerrarSesion").length) {
        const btnCerrarSesion = $(`
          <div class="form-section">
            <button type="button" id="btnCerrarSesion" class="btn-cerrar-sesion">
              🚪 Cerrar sesión
            </button>
          </div>
        `);
        $("#sectionEstadoAnimo").after(btnCerrarSesion);
      }
      
      return true;
    } else {
      // No hay sesión, mostrar formulario completo
      $("#nombre").closest('.form-section').show();
      $("#email").closest('.form-section').show();
      $("#labelEstadoAnimo").html("¿Cómo te sientes hoy?");
      $("#btnCerrarSesion").closest('.form-section').remove();
      
      return false;
    }
  }

  // Paleta simple de gradientes oscuros (base + gradiente) para buen contraste con texto blanco
  const BG_PRESETS = [
    { base: '#0b0f19', grad: 'linear-gradient(135deg, #0b0f19 0%, #16213e 100%)' },
    { base: '#111827', grad: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)' },
    { base: '#0f172a', grad: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' },
    { base: '#1f244a', grad: 'linear-gradient(135deg, #1f244a 0%, #3a2b65 100%)' },
    { base: '#03312e', grad: 'linear-gradient(135deg, #03312e 0%, #065f46 100%)' },
    { base: '#3a0a0a', grad: 'linear-gradient(135deg, #3a0a0a 0%, #5b1a1a 100%)' },
    { base: '#15202b', grad: 'linear-gradient(135deg, #15202b 0%, #22303c 100%)' },
    { base: '#002b36', grad: 'linear-gradient(135deg, #002b36 0%, #073642 100%)' }
  ];

  // 🌟 Secuencia de introducción emotiva
  /**
   * Inicia la secuencia de introducción mostrando líneas con animaciones.
   * Al finalizar, oculta la pantalla de introducción y muestra el contenedor
   * principal. Esta introducción sólo debería ejecutarse una vez por sesión.
   */
  function iniciarIntroduccion() {
    const mensajes = [
      "Hola, hermosa alma...",
      "Sabemos que a veces es difícil...",
      "Tus pensamientos no te definen...",
      "No estás solo en esto...",
      "Estamos aquí para acompañarte 💙"
    ];

    let indice = 0;

  /**
   * Muestra la siguiente línea de la introducción con animación.
   * Encadena timeouts para crear un flujo de presentación.
   */
  function mostrarSiguienteLinea() {
      if (indice < mensajes.length) {
        
        // Mostrar texto con animación
        $(`#linea${indice + 1}`)
          .text(mensajes[indice])
          .addClass("visible");

        indice++;
        
        // Siguiente línea después de 3 segundos
        setTimeout(mostrarSiguienteLinea, 3000);
      } else {
        // Terminar introducción después de 2 segundos más
        setTimeout(function() {
          $("#introduccion").fadeOut(2000, function() {
            $(this).remove();
            $("#contenedor").fadeIn(1000);
            introduccionMostrada = true; // Marcar que ya se mostró
            // Mostrar botón de navegación después de la introducción
            mostrarBotonNavegacion();
            // Verificar sesión activa solo después de mostrar el contenedor
            verificarSesionActiva();
          });
        }, 2000);
      }
    }

    // Comenzar la secuencia después de 1 segundo
    setTimeout(mostrarSiguienteLinea, 1000);
  }

  // Iniciar introducción solo la primera vez
  if (!introduccionMostrada && $("#introduccion").length > 0) {
    iniciarIntroduccion();
  } else {
    // Si ya se mostró o no existe el elemento, mostrar directamente el contenedor
    $("#contenedor").show();
    // Mostrar botón de navegación inmediatamente
    mostrarBotonNavegacion();
    // Verificar sesión activa solo cuando se muestra el contenedor
    verificarSesionActiva();
  }

  // 🎨 Validación de formulario mejorada
  /**
   * Manejador de envío del formulario principal.
   * - Previene envío por defecto
   * - Valida nombre, email (regex) y estado de ánimo
   * - Muestra mensajes de error/éxito y deriva a la experiencia inmersiva
   */
  $("#moodForm").submit(function(e) {
    e.preventDefault();
    
    const mood = $("#estadoAnimo").val();
    
    // Verificar si hay sesión activa
    const userData = obtenerSesionUsuario();
    let nombre, email;
    
    if (userData && userData.nombre && userData.email) {
      // Usuario con sesión activa
      nombre = userData.nombre;
      email = userData.email;
    } else {
      // Usuario nuevo, validar campos
      nombre = $("#nombre").val().trim();
      email = $("#email").val().trim();
      
      if (!nombre) {
        mostrarMensaje("Por favor, ingresa tu nombre", "error");
        return;
      }
      
      if (nombre.length < 2) {
        mostrarMensaje("Tu nombre debe tener al menos 2 caracteres", "error");
        return;
      }
      
      // Email requerido y válido
      if (!email) {
        mostrarMensaje("Por favor, ingresa tu correo electrónico", "error");
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        mostrarMensaje("Por favor, ingresa un correo válido", "error");
        return;
      }
      
      // Guardar nueva sesión
      guardarSesionUsuario(nombre, email);
    }
    
    if (!mood) {
      mostrarMensaje("Por favor, selecciona cómo te sientes", "error");
      return;
    }
    
    // Mostrar mensaje de éxito y procesar
    mostrarMensaje(`¡Perfecto! Preparando tu experiencia personalizada ${nombre}...`, "exito");
    
    setTimeout(() => {
      iniciarExperienciaInmersiva(mood, nombre);
    }, 2000);
  });

  // Función para mostrar mensajes
  function mostrarMensaje(texto, tipo) {
    $("#mensaje")
      .removeClass("error exito")
      .addClass(tipo)
      .text(texto)
      .slideDown(300);
    
    if (tipo === "error") {
      setTimeout(() => {
        $("#mensaje").slideUp(300);
      }, 4000);
    }
  }

  // 🌌 EXPERIENCIA INMERSIVA
  /**
   * Inicia la experiencia inmersiva:
   * - Oculta el formulario y muestra la pantalla a pantalla completa
   * - Presenta una pista de salida (ESC/Volver)
   * - Configura el contexto del estado de ánimo
   * - Arranca la obtención y el ciclo de frases (con overlay)
   * - Arranca la música (autoplay con fallback a interacción)
   * @param {string} mood Estado de ánimo seleccionado
   * @param {string} nombre Nombre del usuario para personalizar mensajes
   */
  function iniciarExperienciaInmersiva(mood, nombre) {
    // Ocultar botón de navegación durante la experiencia inmersiva
    ocultarBotonNavegacion();
    
    // Ocultar formulario
    $("#contenedor").fadeOut(1000, function() {
      
      // Mostrar pantalla de experiencia
      $("#pantallaExperiencia").fadeIn(2000, function() {
        // Mostrar pista de salida brevemente
        const $hint = $("#exitHint");
        $hint.stop(true, true).fadeIn(500);
        setTimeout(() => { $hint.fadeOut(800); }, 4000);
        
        // Configurar el mood
        $("#pantallaExperiencia").removeClass().addClass(`mood-${mood}`);
        
        
        
        // Iniciar frases automáticas con API
        setTimeout(() => {
          iniciarFrasesAutomaticas();
        }, 3000);
        
        // Iniciar música sincronizada con la primera frase
        setTimeout(() => {
          reproducirMusicaExperiencia(mood);
        }, 4100);
        
      });
    });
  }

  // 🔄 CICLO DE FRASES AUTOMÁTICAS
  /**
   * Arranca el flujo de frases intentando primero obtenerlas de la API.
   * Si ya hay frases en caché, las reutiliza para evitar peticiones repetidas.
   * Si todos los proxies fallan, utiliza un conjunto local de frases.
   */
  function iniciarFrasesAutomaticas() {
    // Si ya tenemos frases en caché, reutilizarlas (evita rate limiting)
    if (frasesCache && frasesCache.length > 0) {
      console.log("Reutilizando frases en caché - sin petición API");
      frasesObtenidas = frasesCache;
      iniciarCicloFrases();
      return;
    }

    // Solo hacer petición API si no hay caché
    console.log("Obteniendo frases de la API por primera vez");
    obtenerFrasesAPI().then(frases => {
      frasesCache = frases; // Guardar en caché para próximos cambios de sentimiento
      frasesObtenidas = frases;
      iniciarCicloFrases();
    }).catch(() => {
      // Si falla la API, usar frases locales y también guardarlas en caché
      console.log("API falló, usando frases locales");
      usarFrasesLocales();
    });
  }

  // 🎵 MÚSICA PARA EXPERIENCIA (autoplay, sin UI)
  let _audioElement = null;
  /**
   * Crea y reproduce la música de fondo según el estado de ánimo.
   * - No muestra controles visibles
   * - Intenta autoplay; si falla, reintenta al detectar una interacción
   * - Vincula el estado play/pause a la variable de control del intervalo
   * @param {string} mood Estado de ánimo para seleccionar la pista
   */
  function reproducirMusicaExperiencia(mood) {
    const musicFiles = {
      feliz: "music/Feliz.mp3",
      triste: "music/Triste.mp3", 
      estresado: "music/Estresado.mp3",
      motivado: "music/Motivado.mp3"
    };

    const audioFile = musicFiles[mood];
    if (!audioFile) return;

    // Detener y limpiar audio previo si existe
    if (_audioElement) {
      try { _audioElement.pause(); } catch {}
      _audioElement.src = '';
      _audioElement = null;
    }

    // Crear elemento audio en memoria (sin controles)
    const audioElement = document.createElement('audio');
    audioElement.src = audioFile;
    audioElement.loop = true;
    audioElement.volume = 0.6;

    // Enlazar play/pause para controlar frases
    $(audioElement).on('play', function() { intervaloActivo = true; });
    $(audioElement).on('pause', function() { intervaloActivo = false; });

    // Intentar reproducir automáticamente
    audioElement.play().then(() => {
      intervaloActivo = true;
    }).catch(err => {
      console.log('Autoplay bloqueado por el navegador. Se reintentará al interactuar.', err);
      // Si el autoplay falla, pausamos las frases hasta que haya interacción
      intervaloActivo = false;
      $(document).one('click keydown touchstart', () => {
        audioElement.play().then(() => { intervaloActivo = true; }).catch(()=>{});
      });
    });

    _audioElement = audioElement;
  }

  // 🔙 Botón volver
  /**
   * Manejador del botón Volver.
   * - Detiene música y ciclo de frases
   * - Limpia el formulario y regresa a la vista principal
   */
  $("#btnVolver").click(function() {
    // Detener música
    if (_audioElement) { try { _audioElement.pause(); } catch {} _audioElement = null; }
    
    // Detener ciclo de frases
    if (intervaloCicloFrases) {
      clearInterval(intervaloCicloFrases);
      intervaloCicloFrases = null;
    }
    
    // Volver al formulario
    $("#pantallaExperiencia").fadeOut(1000, function() {
      // Limpiar solo el campo de estado de ánimo (mantener sesión)
      $("#estadoAnimo").val("");
      $("#mensaje").hide();
      
      // Verificar sesión y configurar interfaz
      verificarSesionActiva();
      
      // Mostrar formulario
      $("#contenedor").fadeIn(1000);
      
      // Mostrar botón de navegación de nuevo
      mostrarBotonNavegacion();
    });
  });

  // 🚪 Manejador del botón cerrar sesión
  $(document).on('click', '#btnCerrarSesion', function() {
    cerrarSesionUsuario();
    
    // Limpiar formulario completamente
    $("#moodForm")[0].reset();
    $("#mensaje").hide();
    
    // Reconfigurar interfaz para mostrar formulario completo
    verificarSesionActiva();
    
    mostrarMensaje("Sesión cerrada correctamente. ¡Hasta pronto!", "exito");
    
    setTimeout(() => {
      $("#mensaje").slideUp(300);
    }, 3000);
  });

  // Tecla ESC para volver
  /**
   * Atajo de teclado ESC para volver desde la pantalla inmersiva.
   */
  $(document).on('keydown', function(e) {
    if (e.key === 'Escape' && $("#pantallaExperiencia").is(":visible")) {
      $("#btnVolver").trigger('click');
    }
  });

  // Funciones auxiliares para obtener frases de API
  /**
   * Obtiene frases de ZenQuotes usando distintos proxies CORS con prioridad y timeout.
   * - Usa async/await con AbortController para timeout por solicitud
   * - Parsea correctamente AllOrigins (response.contents) y otras respuestas JSON
   * - Filtra frases inválidas y devuelve un array de strings formateados
   * @returns {Promise<string[]>} Frases formateadas como "\"cita\" — autor"
   * @throws {Error} Si todos los proxies fallan o no hay datos válidos
   */
  async function obtenerFrasesAPI() {
    // Orden de preferencia de proxies (AllOrigins suele ser el más estable)
    const proxies = [
      {
        name: "allorigins",
        buildUrl: (target) => `https://api.allorigins.win/get?url=${encodeURIComponent(target)}`,
        parse: async (resp) => {
          const json = await resp.json();
          return JSON.parse(json.contents);
        }
      },
      {
        name: "corsproxy",
        buildUrl: (target) => `https://corsproxy.io/?url=${encodeURIComponent(target)}`,
        parse: async (resp) => resp.json()
      },
      {
        name: "corsanywhere",
        buildUrl: (target) => `https://cors-anywhere.herokuapp.com/${target}`,
        parse: async (resp) => resp.json()
      }
    ];

    const targetUrl = "https://zenquotes.io/api/quotes";
    const timeoutMs = 6000;
    let lastError = null;

    // Helper para timeout con AbortController
    async function fetchWithTimeout(url, options = {}, ms = 6000) {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort("timeout"), ms);
      try {
        const resp = await fetch(url, { ...options, signal: controller.signal });
        return resp;
      } finally {
        clearTimeout(id);
      }
    }

    for (const proxy of proxies) {
      try {
        const url = proxy.buildUrl(targetUrl);
        const resp = await fetchWithTimeout(url, {
          method: "GET",
          headers: { 'Accept': 'application/json' }
        }, timeoutMs);

        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`);
        }

        const raw = await proxy.parse(resp);
        // Esperamos un array de objetos { q: quote, a: author }
        const data = Array.isArray(raw) ? raw : raw?.data ?? raw;
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("Respuesta vacía o inválida");
        }

        const frasesFormateadas = data
          .filter((item) => item && typeof item.q === "string" && typeof item.a === "string" && item.q.trim())
          .map((item) => `"${item.q}" — ${item.a}`);

        if (frasesFormateadas.length === 0) {
          throw new Error("Sin frases válidas tras filtrar");
        }

        return frasesFormateadas;
      } catch (err) {
        lastError = err;
        console.warn(`Proxy ${proxy.name} falló:`, err?.message || err);
        // Pequeña espera antes de intentar el siguiente proxy
        await new Promise((res) => setTimeout(res, 700));
      }
    }

    throw new Error(`Todos los proxies fallaron${lastError ? ": " + (lastError.message || lastError) : ""}`);
  }

  /**
   * Carga un conjunto local de frases como fallback cuando falla la API,
   * las guarda en caché y arranca el ciclo de frases inmediatamente.
   */
  function usarFrasesLocales() {
    const frasesLocales = [
      '"El éxito es la suma de pequeños esfuerzos repetidos día tras día." — Robert Collier',
      '"La vida es lo que pasa mientras estás ocupado haciendo otros planes." — John Lennon',
      '"No cuentes los días, haz que los días cuenten." — Muhammad Ali',
      '"La única manera de hacer un gran trabajo es amar lo que haces." — Steve Jobs',
      '"El futuro pertenece a quienes creen en la belleza de sus sueños." — Eleanor Roosevelt',
      '"Todo lo que siempre has querido está al otro lado del miedo." — George Addair',
      '"La felicidad no es algo hecho. Viene de tus propias acciones." — Dalai Lama',
      '"Cree en ti mismo y todo será posible." — Anónimo'
    ];
    frasesCache = frasesLocales; // Guardar también las locales en caché
    frasesObtenidas = frasesLocales;
    iniciarCicloFrases();
  }

  /**
   * Inicia el ciclo de frases con transiciones suaves sincronizadas con overlay:
   * - Apaga la frase actual (fadeOut)
   * - Sube overlay, cambia fondo y texto
   * - Baja overlay y enciende la nueva frase (fadeIn)
   * El intervalo que avanza las frases respeta la variable global `intervaloActivo`.
   */
  function iniciarCicloFrases() {
    /**
     * Muestra la siguiente frase con transición de overlay + fade del texto
     * y rota el índice circularmente sobre el array de frases.
     */
    function mostrarSiguienteFrase() {
      const frase = frasesObtenidas[indiceFraseActual];
      const preset = BG_PRESETS[Math.floor(Math.random() * BG_PRESETS.length)];

      // Iniciar overlay y texto a la par
      const $overlay = $("#bgOverlay");
      const $frase = $("#fraseAutomatica");
      $frase.stop(true, true).fadeOut(500);
      $overlay.stop(true, true).fadeTo(450, 1, function() {
        // Cambiar fondo y texto mientras el overlay está alto
        $("#pantallaExperiencia").css({ background: preset.grad, 'background-color': preset.base });
        $frase.text(frase).css({ color: '#ffffff' }).fadeIn(500);
        // Bajar overlay y mostrar texto al mismo tiempo
        $overlay.fadeTo(500, 0);
      });
      
      indiceFraseActual = (indiceFraseActual + 1) % frasesObtenidas.length;
    }

    // Mostrar primera frase inmediatamente
    setTimeout(() => {
      mostrarSiguienteFrase();
      // Iniciar ciclo automático cada 6 segundos (controlado por audio)
      intervaloCicloFrases = setIntervalControlado(mostrarSiguienteFrase, 6000);
    }, 1000);
  }

  // Intervalo que respeta play/pause del audio
  let intervaloActivo = true;
  /**
   * setInterval controlado por la bandera `intervaloActivo`.
   * Solo ejecuta la función programada cuando `intervaloActivo` es true.
   * @param {Function} fn Función a ejecutar periódicamente
   * @param {number} ms Milisegundos del intervalo
   * @returns {number} ID del intervalo
   */
  function setIntervalControlado(fn, ms) {
    let id = setInterval(() => { if (intervaloActivo) fn(); }, ms);
    return id;
  }


  // 🚪 LIMPIAR SESIÓN AL SALIR DE LA PÁGINA
  // Eliminar sesión cuando el usuario navega fuera o cierra la pestaña
  $(window).on('beforeunload pagehide', function() {
    localStorage.removeItem('moodify_user_session');
  });

  // También limpiar sesión si el usuario hace clic en el botón de volver al índice
  $(document).on('click', '#btnVolverIndice', function() {
    localStorage.removeItem('moodify_user_session');
  });

  
});