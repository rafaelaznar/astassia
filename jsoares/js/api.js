// api.js - jQuery implementation for Asteroid Monitor
$(document).ready(function(){
  
  // Usar CONFIG desde config.js
  const CONFIG = window.APP_CONFIG || {
    NASA_API_KEY: 'x7y7fDZraWoSIDUSZiy2khtqQQeMpgMLWiSrcPUo',
    NASA_NEOWS_URL: 'https://api.nasa.gov/neo/rest/v1/feed',
    NASA_EPIC_URL: 'https://api.nasa.gov/EPIC/api/natural',
    EPIC_IMAGE_BASE: 'https://epic.gsfc.nasa.gov/archive/natural',
    DANGER_THRESHOLD: 5000000,
    MOON_DISTANCE: 384400
  };

  // URLs de imágenes locales/alternativas
  const LOCAL_IMAGES = {
    asteroid_bg: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=1920&h=1080&fit=crop',
    dangerous_asteroid: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?w=1920&h=1080&fit=crop',
    earth_from_space: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1920&h=1080&fit=crop',
    earth_epic: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop',
    galaxy: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&h=600&fit=crop'
  };

  // Variables globales
  let allAsteroids = [];
  let currentFilter = 'all';
  let currentUser = null;
  let epicImages = [];
  let currentEpicIndex = 0;

  // Inicialización
  function init() {
    console.log('🚀 Monitor de Asteroides - jQuery iniciado');
    
    initEarthSystem();
    setupNavigation();
    setupAuth();
    loadAsteroids();
    
    currentUser = loadSession();
    updateAuthUI();
    
    renderComments();
    renderCommentForm();
    
    // Actualizar imágenes del carousel con URLs locales
    updateCarouselImages();
  }

  // ========== ACTUALIZAR IMÁGENES DEL CAROUSEL ==========
  function updateCarouselImages() {
    // Actualizar imágenes de fondo del carousel
    $('.carousel-item:nth-child(1) .carousel-bg').css('background-image', `url('${LOCAL_IMAGES.asteroid_bg}')`);
    $('.carousel-item:nth-child(2) .carousel-bg').css('background-image', `url('${LOCAL_IMAGES.dangerous_asteroid}')`);
    $('.carousel-item:nth-child(3) .carousel-bg').css('background-image', `url('${LOCAL_IMAGES.earth_from_space}')`);
  }

  // ========== ANIMACIÓN TIERRA-CÉNTRICA ==========
  function initEarthSystem() {
    // Generar estrellas aleatorias
    const $container = $('#earth-system-container');
    for (let i = 0; i < 250; i++) {
      const size = Math.random() * 2.5 + 0.5;
      $('<div>')
        .addClass('star')
        .css({
          width: size + 'px',
          height: size + 'px',
          left: Math.random() * 100 + '%',
          top: Math.random() * 100 + '%',
          animationDelay: Math.random() * 3 + 's'
        })
        .appendTo($container);
    }

    let animationSpeed = 1;
    let isPaused = false;
    let angles = {
      sun: 0,
      moon: 0,
      satellites: [0, 120, 240],
      asteroids: [0, 60, 120, 180, 240, 300]
    };

    function animate() {
      if (!isPaused) {
        // Animar Sol
        angles.sun += 0.3 * animationSpeed;
        const sunRadius = 200;
        const sunX = Math.cos(angles.sun * Math.PI / 180) * sunRadius;
        const sunY = Math.sin(angles.sun * Math.PI / 180) * sunRadius;
        $('#sun').css({
          left: '50%',
          top: '50%',
          marginLeft: sunX + 'px',
          marginTop: sunY + 'px',
          transform: 'translate(-50%, -50%)'
        });

        // Animar Luna
        angles.moon += 1.2 * animationSpeed;
        const moonRadius = 90;
        const moonX = Math.cos(angles.moon * Math.PI / 180) * moonRadius;
        const moonY = Math.sin(angles.moon * Math.PI / 180) * moonRadius;
        $('#moon').css({
          left: '50%',
          top: '50%',
          marginLeft: moonX + 'px',
          marginTop: moonY + 'px',
          transform: 'translate(-50%, -50%)'
        });

        // Animar Satélites
        angles.satellites = angles.satellites.map((angle, index) => {
          const newAngle = angle + 0.8 * animationSpeed;
          const satRadius = 120;
          const satX = Math.cos(newAngle * Math.PI / 180) * satRadius;
          const satY = Math.sin(newAngle * Math.PI / 180) * satRadius;
          $(`#satellite${index + 1}`).css({
            left: '50%',
            top: '50%',
            marginLeft: satX + 'px',
            marginTop: satY + 'px',
            transform: 'translate(-50%, -50%) rotate(' + newAngle + 'deg)'
          });
          return newAngle;
        });

        // Animar Asteroides
        angles.asteroids = angles.asteroids.map((angle, index) => {
          const newAngle = angle + 0.5 * animationSpeed;
          const astRadius = 160;
          const astX = Math.cos(newAngle * Math.PI / 180) * astRadius;
          const astY = Math.sin(newAngle * Math.PI / 180) * astRadius;
          $(`#asteroid${index + 1}`).css({
            left: '50%',
            top: '50%',
            marginLeft: astX + 'px',
            marginTop: astY + 'px',
            transform: 'translate(-50%, -50%)'
          });
          return newAngle;
        });
      }
      requestAnimationFrame(animate);
    }

    animate();
  }

  // ========== NAVEGACIÓN ==========
  function setupNavigation() {
    $('.nav-link[data-section]').on('click', function(e) {
      e.preventDefault();
      const section = $(this).data('section');
      navigateToSection(section);
      
      if ($('#navbarNav').hasClass('show')) {
        $('.navbar-toggler').click();
      }
    });

    $('.btn-danger-neon[data-section]').on('click', function(e) {
      e.preventDefault();
      const section = $(this).data('section');
      const filter = $(this).data('filter');
      
      navigateToSection(section);
      
      if (filter) {
        setTimeout(() => {
          currentFilter = filter;
          $('.filter-btn').removeClass('active');
          $(`.filter-btn[data-filter="${filter}"]`).addClass('active');
          renderAsteroids();
        }, 500);
      }
    });

    $(document).on('click', '.filter-btn', function() {
      $('.filter-btn').removeClass('active');
      $(this).addClass('active');
      currentFilter = $(this).data('filter');
      renderAsteroids();
    });
  }

  function navigateToSection(sectionId) {
    $('.section-content').removeClass('active');
    $(`#${sectionId}`).addClass('active');
    
    $('.nav-link').removeClass('active');
    $(`.nav-link[data-section="${sectionId}"]`).addClass('active');
    
    $('html, body').animate({
      scrollTop: $(`#${sectionId}`).offset().top - 80
    }, 500);

    if (sectionId === 'tierra' && epicImages.length === 0) {
      loadEarth();
    }
  }

  // ========== ASTEROIDES ==========
  function loadAsteroids() {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const startDate = weekAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];
    
    const url = `${CONFIG.NASA_NEOWS_URL}?start_date=${startDate}&end_date=${endDate}&api_key=${CONFIG.NASA_API_KEY}`;

    $.ajax({
      url: url,
      method: 'GET',
      dataType: 'json',
      timeout: 15000,
      success: function(data) {
        console.log('✅ NASA NeoWs API exitosa');
        processAsteroids(data);
      },
      error: function(xhr, status, error) {
        console.error('❌ Error NASA API:', error);
        loadBackupAsteroids();
      }
    });
  }

  function processAsteroids(data) {
    allAsteroids = [];
    const neoData = data.near_earth_objects;

    $.each(neoData, function(date, asteroids) {
      $.each(asteroids, function(index, ast) {
        const approach = ast.close_approach_data[0];
        
        allAsteroids.push({
          name: ast.name,
          diameter: ast.estimated_diameter.meters.estimated_diameter_max,
          distance: parseFloat(approach.miss_distance.kilometers),
          velocity: parseFloat(approach.relative_velocity.kilometers_per_hour),
          dangerous: ast.is_potentially_hazardous_asteroid,
          date: approach.close_approach_date
        });
      });
    });

    allAsteroids.sort((a, b) => a.distance - b.distance);
    updateStats();
    renderAsteroids();
  }

  function updateStats() {
    const dangerous = allAsteroids.filter(a => a.dangerous);
    const maxVel = allAsteroids.reduce((max, a) => Math.max(max, a.velocity), 0);
    const closest = allAsteroids.length > 0 ? allAsteroids[0] : null;
    const closestMoons = closest ? (closest.distance / CONFIG.MOON_DISTANCE).toFixed(2) : '∞';

    $('#totalAsteroids').text(allAsteroids.length);
    $('#dangerousCount').text(dangerous.length);
    $('#maxSpeed').text(formatNumber(maxVel));
    $('#closestMoons').text(closestMoons);

    $('#countAll').text(allAsteroids.length);
    $('#countDangerous').text(dangerous.length);
    $('#countSafe').text(allAsteroids.length - dangerous.length);
  }

  function renderAsteroids() {
    let filtered = allAsteroids;

    if (currentFilter === 'dangerous') {
      filtered = filtered.filter(a => a.dangerous);
    } else if (currentFilter === 'safe') {
      filtered = filtered.filter(a => !a.dangerous);
    }

    let html = '';
    const display = filtered.slice(0, 30);

    $.each(display, function(index, ast) {
      const dangerClass = getDangerClass(ast);
      const badge = ast.dangerous ? 
        '<span class="badge bg-danger">PELIGROSO</span>' :
        '<span class="badge bg-success">SEGURO</span>';

      const moons = (ast.distance / CONFIG.MOON_DISTANCE).toFixed(2);

      html += `<div class="asteroid-item ${dangerClass}">
        <div class="d-flex justify-content-between">
          <div>
            <h6 class="mb-1">${ast.name} ${badge}</h6>
            <small>
              <i class="bi bi-calendar"></i> ${ast.date} | 
              <i class="bi bi-rulers"></i> ${formatNumber(ast.distance)} km (${moons} lunas) | 
              <i class="bi bi-speedometer2"></i> ${formatNumber(ast.velocity)} km/h
            </small>
          </div>
        </div>
      </div>`;
    });

    $('#asteroidsList').html(html).show();
    $('#asteroidsLoading').hide();
  }

  function getDangerClass(ast) {
    if (ast.dangerous && ast.distance < CONFIG.DANGER_THRESHOLD) return 'danger-high';
    if (ast.dangerous) return 'danger-medium';
    return 'danger-low';
  }

  function formatNumber(num) {
    return Math.round(num).toLocaleString('es-ES');
  }

  function loadBackupAsteroids() {
    // Primero intentar cargar desde backup.json
    $.getJSON('data/backup.json')
      .done(function(backup) {
        const neoAPI = backup.apis.find(api => api.id === 'neows');
        if (neoAPI && neoAPI.backup_data) {
          // Usar datos del backup
          allAsteroids = [
            {
              name: '(2024 XY1) Backup',
              diameter: 250,
              distance: 2500000,
              velocity: 45000,
              dangerous: true,
              date: '2025-10-22'
            },
            {
              name: '(2024 AB2) Backup',
              diameter: 150,
              distance: 5500000,
              velocity: 32000,
              dangerous: false,
              date: '2025-10-23'
            }
          ];
          
          updateStats();
          renderAsteroids();
          $('#asteroidsList').prepend('<div class="alert alert-warning mb-3">Datos de respaldo cargados</div>');
        } else {
          throw new Error('No backup data');
        }
      })
      .fail(function() {
        // Datos de respaldo estáticos como última opción
        allAsteroids = [
          {
            name: '(2024 XY1) Backup',
            diameter: 250,
            distance: 2500000,
            velocity: 45000,
            dangerous: true,
            date: '2025-10-22'
          },
          {
            name: '(2024 AB2) Backup',
            diameter: 150,
            distance: 5500000,
            velocity: 32000,
            dangerous: false,
            date: '2025-10-23'
          }
        ];

        updateStats();
        renderAsteroids();
      });
  }

  // ========== TIERRA DESDE EL ESPACIO ==========
  function loadEarth() {
    const url = `${CONFIG.NASA_EPIC_URL}?api_key=${CONFIG.NASA_API_KEY}`;

    $.ajax({
      url: url,
      method: 'GET',
      dataType: 'json',
      timeout: 10000,
      success: function(data) {
        console.log('✅ NASA EPIC API exitosa');
        epicImages = data;
        currentEpicIndex = 0;
        displayEarth();
      },
      error: function() {
        console.error('❌ Error EPIC API');
        loadEarthBackup();
      }
    });
  }

  function displayEarth() {
    if (epicImages.length === 0) {
      $('#earthContent').html('<div class="alert alert-warning">No hay imágenes disponibles</div>').show();
      $('#earthLoading').hide();
      return;
    }

    const image = epicImages[currentEpicIndex];
    const date = new Date(image.date);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    const imageUrl = `${CONFIG.EPIC_IMAGE_BASE}/${year}/${month}/${day}/png/${image.image}.png`;

    const html = `<div class="text-center">
      <h4 style="color: var(--nasa-red);">${image.caption || 'Tierra desde el Espacio'}</h4>
      <p class="text-muted mb-3">${new Date(image.date).toLocaleString()}</p>
      <img src="${imageUrl}" class="img-fluid rounded shadow" style="max-height: 500px;" alt="${image.caption || 'Tierra EPIC'}" onerror="this.src='${LOCAL_IMAGES.earth_epic}'">
      <div class="mt-3">
        <button class="btn btn-danger-neon me-2" id="prevEarth">Anterior</button>
        <button class="btn btn-danger-neon" id="nextEarth">Siguiente</button>
      </div>
    </div>`;

    $('#earthContent').html(html).show();
    $('#earthLoading').hide();

    $('#prevEarth').on('click', function() {
      currentEpicIndex = (currentEpicIndex - 1 + epicImages.length) % epicImages.length;
      displayEarth();
    });

    $('#nextEarth').on('click', function() {
      currentEpicIndex = (currentEpicIndex + 1) % epicImages.length;
      displayEarth();
    });
  }

  function loadEarthBackup() {
    $.getJSON('data/backup.json')
      .done(function(backup) {
        const epicAPI = backup.apis.find(api => api.id === 'epic');
        if (epicAPI && epicAPI.backup_data) {
          const fallback = epicAPI.backup_data;
          const html = `
            <div class="text-center">
              <h4 style="color: var(--nasa-red);">${fallback.title}</h4>
              <p>${fallback.description}</p>
              <img src="${fallback.image_url}" 
                   class="img-fluid rounded shadow" 
                   style="max-height: 500px;"
                   alt="Tierra desde el Espacio (respaldo)">
              <div class="alert alert-warning mt-3">Imagen de respaldo</div>
            </div>
          `;
          $('#earthContent').html(html);
        } else {
          throw new Error('No backup data');
        }
      })
      .fail(function() {
        // Usar imagen local como último recurso
        const html = `
          <div class="text-center">
            <h4 style="color: var(--nasa-red);">La Tierra desde el Espacio</h4>
            <p>Vista espectacular de nuestro planeta azul</p>
            <img src="${LOCAL_IMAGES.earth_epic}" 
                 class="img-fluid rounded shadow" 
                 style="max-height: 500px;"
                 alt="Tierra desde el Espacio">
            <div class="alert alert-warning mt-3">Imagen local cargada</div>
          </div>
        `;
        $('#earthContent').html(html);
      })
      .always(function() {
        $('#earthLoading').hide();
        $('#earthContent').show();
      });
  }

  // ========== AUTENTICACIÓN ==========
  function setupAuth() {
    $('#authLink').on('click', function(e) {
      e.preventDefault();
      if (currentUser) {
        if (confirm('¿Cerrar sesión?')) {
          logout();
        }
      } else {
        new bootstrap.Modal($('#authModal')).show();
      }
    });

    $('#showRegister').on('click', function(e) {
      e.preventDefault();
      $('#loginForm').addClass('d-none');
      $('#registerForm').removeClass('d-none');
      $('#authModalTitle').text('Registrarse');
    });

    $('#showLogin').on('click', function(e) {
      e.preventDefault();
      $('#registerForm').addClass('d-none');
      $('#loginForm').removeClass('d-none');
      $('#authModalTitle').text('Iniciar Sesión');
    });

    $('#loginForm').on('submit', function(e) {
      e.preventDefault();
      if (!this.checkValidity()) {
        e.stopPropagation();
        $(this).addClass('was-validated');
        return;
      }
      login();
    });

    $('#registerForm').on('submit', function(e) {
      e.preventDefault();
      if (!this.checkValidity()) {
        e.stopPropagation();
        $(this).addClass('was-validated');
        return;
      }
      
      const password = $('#registerPassword').val();
      const confirm = $('#registerPasswordConfirm').val();
      
      if (password !== confirm) {
        alert('Las contraseñas no coinciden');
        return;
      }
      
      register();
    });
  }

  function login() {
    const email = $('#loginEmail').val();
    const password = $('#loginPassword').val();

    const users = JSON.parse(localStorage.getItem('nasa_users_jquery') || '[]');
    const user = users.find(u => u.email === email && u.password === btoa(password));

    if (user) {
      currentUser = { name: user.name, email: user.email };
      localStorage.setItem('nasa_session_jquery', JSON.stringify(currentUser));
      updateAuthUI();
      bootstrap.Modal.getInstance($('#authModal')[0]).hide();
      alert('¡Bienvenido!');
      
      renderCommentForm();
    } else {
      alert('Credenciales incorrectas');
    }
  }

  function register() {
    const name = $('#registerName').val();
    const email = $('#registerEmail').val();
    const password = $('#registerPassword').val();

    const users = JSON.parse(localStorage.getItem('nasa_users_jquery') || '[]');
    
    if (users.some(u => u.email === email)) {
      alert('El email ya está registrado');
      return;
    }

    users.push({
      id: Date.now(),
      name: name,
      email: email,
      password: btoa(password)
    });

    localStorage.setItem('nasa_users_jquery', JSON.stringify(users));
    
    currentUser = { name: name, email: email };
    localStorage.setItem('nasa_session_jquery', JSON.stringify(currentUser));
    updateAuthUI();
    bootstrap.Modal.getInstance($('#authModal')[0]).hide();
    alert('¡Registro exitoso!');
    
    renderCommentForm();
  }

  function logout() {
    currentUser = null;
    localStorage.removeItem('nasa_session_jquery');
    updateAuthUI();
    renderCommentForm();
  }

  function loadSession() {
    const session = localStorage.getItem('nasa_session_jquery');
    return session ? JSON.parse(session) : null;
  }

  function updateAuthUI() {
    if (currentUser) {
      $('#authLink').html(`<i class="bi bi-person-check-fill"></i> ${currentUser.name}`);
    } else {
      $('#authLink').html('<i class="bi bi-person-circle"></i> Login');
    }
  }

  // ========== COMENTARIOS ==========
  function renderComments() {
    const comments = JSON.parse(localStorage.getItem('jsoares_eyes_comments') || '[]');
    let html = '';
    
    if (comments.length === 0) {
      html = '<p class="text-muted">No hay comentarios aún.</p>';
    } else {
      comments.forEach(c => {
        html += `<div class="comment-item">
          <strong style="color:var(--nasa-red);">${c.user}</strong> 
          <span class="star-rating">${'★'.repeat(c.rating)}${'☆'.repeat(5 - c.rating)}</span>
          <p style="margin:0.5rem 0;">${c.text}</p>
          <small class="text-secondary">${c.date}</small>
        </div>`;
      });
    }
    $('#commentsSection').html(html);
  }

  function renderCommentForm() {
    if (!currentUser) {
      $('#commentFormContainer').html('<div class="alert alert-warning mt-3">Debes iniciar sesión para comentar.</div>');
      return;
    }
    
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
      starsHtml += `<i class="bi bi-star${i === 1 ? '' : '-fill'}" data-value="${i}" style="cursor:pointer;font-size:1.3rem;color:gold;"></i>`;
    }
    
    const formHtml = `<form id="commentForm" class="mt-3">
      <div class="mb-2"><label class="form-label">Tu comentario</label>
      <textarea class="form-control" id="commentText" rows="2" maxlength="300" required></textarea></div>
      <div class="mb-2"><label class="form-label">Valoración:</label> <span id="ratingStars">${starsHtml}</span>
      <input type="hidden" id="commentRating" value="5"></div>
      <button type="submit" class="btn btn-danger-neon">Enviar</button>
    </form>`;
    
    $('#commentFormContainer').html(formHtml);

    $('#ratingStars i').on('click', function() {
      const val = $(this).data('value');
      $('#commentRating').val(val);
      $('#ratingStars i').each(function(idx) {
        $(this).attr('class', `bi ${idx < val ? 'bi-star-fill' : 'bi-star'}`);
      });
    });

    $('#commentForm').on('submit', function(e) {
      e.preventDefault();
      const text = $('#commentText').val().trim();
      const rating = parseInt($('#commentRating').val());
      
      if (!text) return;
      
      const comments = JSON.parse(localStorage.getItem('jsoares_eyes_comments') || '[]');
      comments.unshift({
        user: currentUser.name,
        text: text,
        rating: rating,
        date: new Date().toLocaleString()
      });
      
      localStorage.setItem('jsoares_eyes_comments', JSON.stringify(comments));
      renderComments();
      this.reset();
      $('#commentRating').val(5);
      $('#ratingStars i').attr('class', 'bi bi-star');
      $('#ratingStars i:first').attr('class', 'bi bi-star-fill');
    });
  }

  // Inicializar la aplicación
  init();
});