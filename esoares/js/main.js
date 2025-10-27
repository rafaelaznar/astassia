/**
 * main.js
 *
 * Este archivo implementa la lógica principal de la aplicación de exploración espacial.
 * Utiliza ES6+ (async/await, arrow functions, destructuring, template literals, métodos de array).
 *
 * Aquí gestionamos la navegación entre secciones, la autenticación, la galería de imágenes,
 * la integración con APIs de la NASA (APOD y EPIC), backups locales y animaciones.
 *
 * Cada bloque está documentado para que comprendas qué hace y cómo se conecta con el resto del sistema.
 */

// ========== 1. CONFIGURACIÓN Y CONSTANTES ==========
// Definimos las constantes globales de configuración, como las URLs de las APIs y la API Key de NASA.
// Esto permite centralizar los valores y modificarlos fácilmente si es necesario.
const CONFIG = {
  NASA_API_KEY: 'x7y7fDZraWoSIDUSZiy2khtqQQeMpgMLWiSrcPUo',
  APOD_URL: 'https://api.nasa.gov/planetary/apod',
  EPIC_URL: 'https://api.nasa.gov/EPIC/api/natural',
  EPIC_IMAGE_BASE: 'https://epic.gsfc.nasa.gov/archive/natural',
  API_TIMEOUT: 5000
};

// ========== 2. ARRAYS DE URLs BASE CON TEMPLATE LITERALS ==========
// Plantillas de URLs para construir rutas dinámicas a imágenes y endpoints de la NASA.
// Usamos funciones flecha y template literals para mayor flexibilidad.
const URL_TEMPLATES = {
  EPIC_IMAGES: (date, imageName) => [
    `https://epic.gsfc.nasa.gov/archive/natural/${date}/png/${imageName}.png`,
    `https://epic.gsfc.nasa.gov/archive/natural/${date}/jpg/${imageName}.jpg`,
    `https://api.nasa.gov/EPIC/archive/natural/${date}/png/${imageName}.png`
  ],
  
  BACKUP_IMAGES: (category, imageId) => [
    `https://images-assets.nasa.gov/image/${imageId}/${imageId}~large.jpg`,
    `https://images-assets.nasa.gov/image/${imageId}/${imageId}~medium.jpg`,
    `https://images-assets.nasa.gov/image/${imageId}/${imageId}~small.jpg`
  ],
  
  NASA_APIS: (endpoint, params = '') => [
    `https://api.nasa.gov/${endpoint}?api_key=${CONFIG.NASA_API_KEY}${params}`,
    `https://api.nasa.gov/${endpoint}?api_key=DEMO_KEY${params}`,
    `https://images-api.nasa.gov/${endpoint}${params}`
  ]
};

// ========== 3. FUNCIÓN UTILITARIA PARA FETCH CON TIMEOUT ==========
// Esta función realiza peticiones fetch con un límite de tiempo (timeout),
// para evitar que la app se quede esperando indefinidamente si la API no responde.
async function fetchWithTimeout(url, timeout = CONFIG.API_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// ========== 4. SISTEMA DE NAVEGACIÓN CON PROTECCIÓN POR LOGIN ==========
// Controla la navegación entre secciones. Algunas requieren que el usuario esté logueado.
// Si no hay sesión, muestra el modal de autenticación.
function showSection(name){
  const protectedSections = ['explorar','nasa-tools','galeria','innovacion'];
  const session = localStorage.getItem('esoares_session');
  const logged = !!session;

  if(protectedSections.includes(name) && !logged){
    alert('🔒 Debes iniciar sesión para acceder.'); 
    new bootstrap.Modal(document.getElementById('authModal')).show();
    return;
  }

  document.querySelectorAll('.section-content').forEach(s => {
    s.classList.remove('active');
    s.setAttribute('aria-hidden','true');
  });
  
  const el = document.getElementById('section-' + name);
  if(el){ 
    el.classList.add('active'); 
    el.removeAttribute('aria-hidden'); 
    window.scrollTo({top:0,behavior:'smooth'});
  }

  document.querySelectorAll('.nav-link').forEach(link=>{
    link.classList.toggle('active', link.dataset.section === name);
  });

  // Cargar contenido específico de cada sección
  if(name === 'galeria') {
    renderGallery();
  } else if(name === 'innovacion') {
    renderSolarSystem();
    loadInnovations();
  } else if(name === 'nasa-tools') {
    loadNASAEyesEarth(document.getElementById('nasaToolsContent'));
  }
}

// ========== 5. EVENT LISTENERS PARA NAVEGACIÓN ==========
// Asignamos eventos a los enlaces de navegación y botones para cambiar de sección de forma fluida.
document.querySelectorAll('.nav-link').forEach(link=>{
  link.addEventListener('click', (e)=>{
    e.preventDefault();
    const sec = link.dataset.section;
    if(sec) showSection(sec);
  });
});

document.getElementById('startExploreBtn').addEventListener('click', (e)=> {
  e.preventDefault();
  showSection('explorar');
});

// ========== 6. CARDS EXPANDIBLES EN SECCIÓN EXPLORAR ==========
// Permite expandir/cerrar tarjetas informativas en la sección de exploración con click o teclado.
document.querySelectorAll('.explore-card').forEach(card=>{
  card.addEventListener('click', ()=>{
    card.classList.toggle('expanded');
  });
  card.addEventListener('keypress', (e)=>{ if(e.key === 'Enter') card.click(); });
});

// ========== 7. DATOS DE LA GALERÍA - 50 IMÁGENES ESPACIALES COMPLETAS ==========
// Array con información de imágenes espaciales para la galería.
// Cada objeto tiene url, título, descripción, valoración y categoría.
const galleryImages = [
  {url: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=1200', title:'Nebulosa de Orión', description:'Una de las nebulosas más brillantes', rating: 4.8, category: 'nebula'},
  {url: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=1200', title:'Galaxia Espiral', description:'Estructura de una galaxia espiral', rating: 4.5, category: 'galaxy'},
  {url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200', title:'Cúmulo Estelar', description:'Miles de estrellas agrupadas', rating: 4.7, category: 'stars'},
  {url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1200', title:'Vía Láctea', description:'Nuestra galaxia vista desde la Tierra', rating: 4.9, category: 'galaxy'},
  {url: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?w=1200', title:'Aurora Boreal', description:'Espectáculo de luces en el cielo', rating: 4.6, category: 'earth'},
  {url: 'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=1200', title:'Superficie Lunar', description:'Cráteres y características de la Luna', rating: 4.4, category: 'moon'},
  {url: 'https://images.unsplash.com/photo-1614313913007-2b4ae8ce32d6?w=1200', title:'Nebulosa del Cangrejo', description:'Remanente de supernova', rating: 4.7, category: 'nebula'},
  {url: 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=1200', title:'Planeta Saturno', description:'El señor de los anillos', rating: 4.8, category: 'planet'},
  {url: 'https://images.unsplash.com/photo-1581822261290-991b38693d1b?w=1200', title:'Marte Rojo', description:'El planeta rojo en detalle', rating: 4.5, category: 'planet'},
  {url: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=1200', title:'Nebulosa Cabeza de Caballo', description:'Icónica nebulosa oscura', rating: 4.9, category: 'nebula'},
  {url: 'https://images.unsplash.com/photo-1608889335941-32ac5f2041b9?w=1200', title:'Júpiter Gigante', description:'El gigante gaseoso', rating: 4.6, category: 'planet'},
  {url: 'https://images.unsplash.com/photo-1610296669228-602fa827fc1f?w=1200', title:'Galaxia Andrómeda', description:'Nuestra vecina galáctica', rating: 4.8, category: 'galaxy'},
  {url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200', title:'Estación Espacial', description:'ISS orbitando la Tierra', rating: 4.4, category: 'spacecraft'},
  {url: 'https://images.unsplash.com/photo-1545156521-77bd85671d30?w=1200', title:'Tierra Azul', description:'Nuestro hogar desde el espacio', rating: 4.9, category: 'earth'},
  {url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200', title:'Vista Orbital', description:'Luces de ciudades nocturnas', rating: 4.5, category: 'earth'},
  {url: 'https://images.unsplash.com/photo-1573588028698-f4759befb09a?w=1200', title:'Eclipse Solar', description:'La Luna cubre el Sol', rating: 4.7, category: 'solar'},
  {url: 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?w=1200', title:'Cometa Brillante', description:'Viajero del sistema solar', rating: 4.3, category: 'comet'},
  {url: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=1200', title:'Atmósfera Terrestre', description:'Capas de la atmósfera', rating: 4.6, category: 'earth'},
  {url: 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=1200', title:'Explosión Estelar', description:'Supernova en expansión', rating: 4.8, category: 'stars'},
  {url: 'https://images.unsplash.com/photo-1465101162946-4377e57745c3?w=1200', title:'Campo Estelar Profundo', description:'Miles de galaxias distantes', rating: 4.7, category: 'deepspace'},
  
  // Imágenes 21-50
  {url: 'https://images.unsplash.com/photo-1528722828814-77b9b83aafb2?w=1200', title:'Cinturón de Orión', description:'Tres estrellas brillantes', rating: 4.5, category: 'stars'},
  {url: 'https://images.unsplash.com/photo-1520034475321-cbe63696469a?w=1200', title:'Nebulosa del Águila', description:'Pilares de la creación', rating: 4.9, category: 'nebula'},
  {url: 'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=1200', title:'Venus Brillante', description:'El lucero del alba', rating: 4.4, category: 'planet'},
  {url: 'https://images.unsplash.com/photo-1447433589675-4aaa569f3e05?w=1200', title:'Telescopio Espacial', description:'Observatorio orbital', rating: 4.6, category: 'spacecraft'},
  {url: 'https://images.unsplash.com/photo-1509773896068-7fd415d91e2e?w=1200', title:'Galaxia Espiral M51', description:'La galaxia del remolino', rating: 4.8, category: 'galaxy'},
  {url: 'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?w=1200', title:'Cúmulo Globular', description:'Esfera de estrellas antiguas', rating: 4.5, category: 'stars'},
  {url: 'https://images.unsplash.com/photo-1484589065579-248aad0d8b13?w=1200', title:'Lanzamiento Espacial', description:'Cohete despegando', rating: 4.7, category: 'spacecraft'},
  {url: 'https://images.unsplash.com/photo-1538370965046-79c0d6907d47?w=1200', title:'Observatorio Nocturno', description:'Cúpula bajo las estrellas', rating: 4.3, category: 'observatory'},
  {url: 'https://images.unsplash.com/photo-1506443432602-ac2fcd6f54e0?w=1200', title:'Vía Láctea Vertical', description:'Centro galáctico brillante', rating: 4.8, category: 'galaxy'},
  {url: 'https://images.unsplash.com/photo-1534670007418-fbb7f6cf32c3?w=1200', title:'Astronauta en EVA', description:'Caminata espacial', rating: 4.9, category: 'astronaut'},
  {url: 'https://images.unsplash.com/photo-1454789476662-53eb23ba5907?w=1200', title:'Nebulosa Roseta', description:'Hermosa nebulosa de emisión', rating: 4.6, category: 'nebula'},
  {url: 'https://images.unsplash.com/photo-1541873676-a18131494184?w=1200', title:'Constelación del Escorpión', description:'Estrellas formando patrones', rating: 4.4, category: 'stars'},
  {url: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=1200', title:'Cráter Lunar', description:'Superficie accidentada de la Luna', rating: 4.5, category: 'moon'},
  {url: 'https://images.unsplash.com/photo-1533216606100-d5c7528acdde?w=1200', title:'Galaxia Elíptica', description:'Forma ovalada brillante', rating: 4.7, category: 'galaxy'},
  {url: 'https://images.unsplash.com/photo-1419133203517-f3b3ce7e1e5a?w=1200', title:'Saturno con Lunas', description:'Sistema de satélites', rating: 4.8, category: 'planet'},
  {url: 'https://images.unsplash.com/photo-1504192010706-dd7f569ee2be?w=1200', title:'Nebulosa Laguna', description:'Guardería estelar activa', rating: 4.6, category: 'nebula'},
  {url: 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=1200', title:'Cúmulo de Galaxias', description:'Grupo masivo de galaxias', rating: 4.9, category: 'deepspace'},
  {url: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=1200', title:'Aurora desde ISS', description:'Vista orbital de auroras', rating: 4.5, category: 'earth'},
  {url: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=1200', title:'Amanecer Espacial', description:'Sol naciente desde órbita', rating: 4.7, category: 'solar'},
  {url: 'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?w=1200', title:'Luna Llena', description:'Fase lunar completa', rating: 4.4, category: 'moon'},
  {url: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=1200', title:'Nube Molecular', description:'Región de formación estelar', rating: 4.8, category: 'nebula'},
  {url: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=1200', title:'Horizonte Terrestre', description:'Curvatura del planeta', rating: 4.6, category: 'earth'},
  {url: 'https://images.unsplash.com/photo-1516849677043-ef67c9557e16?w=1200', title:'Nebulosa Planetaria', description:'Estrella moribunda hermosa', rating: 4.7, category: 'nebula'},
  {url: 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=1200', title:'Júpiter y la Gran Mancha', description:'Tormenta gigante', rating: 4.8, category: 'planet'},
  {url: 'https://images.unsplash.com/photo-1562279781-f96b2c6f4edb?w=1200', title:'Vía Láctea Panorámica', description:'Vista completa del arco', rating: 4.9, category: 'galaxy'},
  {url: 'https://images.unsplash.com/photo-1545156521-77bd85671d30?w=1200', title:'Tierra Nocturna', description:'Luces urbanas brillantes', rating: 4.5, category: 'earth'},
  {url: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?w=1200', title:'Módulo Lunar', description:'Nave en superficie lunar', rating: 4.6, category: 'spacecraft'},
  {url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200', title:'Binaria Estelar', description:'Dos estrellas orbitando', rating: 4.7, category: 'stars'},
  {url: 'https://images.unsplash.com/photo-1454789548928-9efd52dc4031?w=1200', title:'Campo Ultra Profundo', description:'Galaxias más distantes', rating: 4.9, category: 'deepspace'},
  {url: 'https://images.unsplash.com/photo-1446941611757-91d2c3bd3d45?w=1200', title:'Galaxia Irregular', description:'Forma caótica única', rating: 4.4, category: 'galaxy'}
];

// ========== 8. ESTADO Y FUNCIONES DE LA GALERÍA ==========
// Variables y funciones para gestionar el estado de la galería (mostrar todas o solo algunas imágenes),
// obtener imágenes destacadas, títulos y calcular la valoración promedio.
let showingAll = false;
const INITIAL_COUNT = 20;

const getHighRatedImages = () => galleryImages.filter(img => img.rating >= 4.5);
const getImageTitles = () => galleryImages.map(img => img.title);
const getAverageRating = () => {
  const total = galleryImages.reduce((sum, img) => sum + img.rating, 0);
  return (total / galleryImages.length).toFixed(2);
};

// ========== 9. RENDERIZADO DE LA GALERÍA CON EFECTOS HOVER ==========
// Renderiza la galería de imágenes en el DOM, con efectos visuales y botón para mostrar más/menos.
// Permite abrir un carrusel modal al hacer click en una imagen.
function renderGallery(){
  const container = document.getElementById('galleryContainer');
  const imagesToShow = showingAll ? galleryImages : galleryImages.slice(0, INITIAL_COUNT);
  
  container.innerHTML = imagesToShow.map((img, index) => `
    <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
      <div class="gallery-item-hover" tabindex="0" data-rating="${img.rating}" data-index="${index}">
        <img src="${img.url}" alt="${img.title}" class="gallery-img">
        <div class="gallery-overlay-info p-3">
          <h6 class="mb-1 fw-bold">${img.title}</h6>
          <p class="mb-1 small" style="opacity:.9">${img.description}</p>
          <div class="mt-2">
            <span class="badge bg-danger">${img.category}</span>
            <span class="ms-2">⭐ ${img.rating}/5.0</span>
          </div>
        </div>
      </div>
    </div>
  `).join('');
  
  const btnContainer = document.createElement('div');
  btnContainer.className = 'col-12 text-center mt-4';
  btnContainer.innerHTML = `
    <button class="btn btn-nasa btn-lg" id="toggleGalleryBtn">
      <i class="bi bi-${showingAll ? 'dash' : 'plus'}-circle"></i> 
      ${showingAll ? 'Mostrar menos imágenes' : 'Mostrar todas las imágenes (50)'}
    </button>
    <p class="text-muted mt-2">Mostrando ${imagesToShow.length} de ${galleryImages.length} imágenes</p>
  `;
  container.appendChild(btnContainer);
  
  document.getElementById('toggleGalleryBtn')?.addEventListener('click', () => {
    showingAll = !showingAll;
    renderGallery();
    window.scrollTo({top: document.getElementById('section-galeria').offsetTop - 100, behavior: 'smooth'});
  });
  
  container.querySelectorAll('.gallery-item-hover').forEach(item => {
    item.addEventListener('click', () => openCarousel(parseInt(item.dataset.index)));
    item.addEventListener('keypress', (e) => { 
      if(e.key === 'Enter') openCarousel(parseInt(item.dataset.index)); 
    });
  });
}

// ========== 10. CARRUSEL MODAL PARA IMÁGENES ==========
// Muestra las imágenes de la galería en un modal tipo carrusel, permitiendo navegar entre ellas.
function openCarousel(startIndex) {
  const imagesToShow = showingAll ? galleryImages : galleryImages.slice(0, INITIAL_COUNT);
  
  const modalHTML = `
    <div class="modal fade" id="galleryCarouselModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-xl modal-dialog-centered">
        <div class="modal-content" style="background: rgba(0,0,0,0.95); border: 2px solid var(--nasa-red);">
          <div class="modal-header border-0">
            <h5 class="modal-title text-white">Galería Espacial</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-0">
            <div id="galleryCarousel" class="carousel slide" data-bs-ride="false">
              <div class="carousel-indicators">
                ${imagesToShow.map((_, i) => `
                  <button type="button" data-bs-target="#galleryCarousel" data-bs-slide-to="${i}" 
                    ${i === startIndex ? 'class="active" aria-current="true"' : ''} 
                    aria-label="Slide ${i + 1}"></button>
                `).join('')}
              </div>
              <div class="carousel-inner">
                ${imagesToShow.map((img, i) => `
                  <div class="carousel-item ${i === startIndex ? 'active' : ''}">
                    <img src="${img.url}" class="d-block w-100" alt="${img.title}" 
                      style="max-height: 70vh; object-fit: contain;">
                    <div class="carousel-caption d-block" style="background: rgba(0,0,0,0.8); border-radius: 10px; padding: 15px;">
                      <h5>${img.title}</h5>
                      <p>${img.description}</p>
                      <p class="mb-0">
                        <span class="badge bg-danger">${img.category}</span>
                        <span class="ms-2">⭐ ${img.rating}/5.0</span>
                      </p>
                    </div>
                  </div>
                `).join('')}
              </div>
              <button class="carousel-control-prev" type="button" data-bs-target="#galleryCarousel" data-bs-slide="prev">
                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Anterior</span>
              </button>
              <button class="carousel-control-next" type="button" data-bs-target="#galleryCarousel" data-bs-slide="next">
                <span class="carousel-control-next-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Siguiente</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  const oldModal = document.getElementById('galleryCarouselModal');
  if (oldModal) oldModal.remove();
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  const modal = new bootstrap.Modal(document.getElementById('galleryCarouselModal'));
  modal.show();
  
  document.getElementById('galleryCarouselModal').addEventListener('hidden.bs.modal', function() {
    this.remove();
  });
}

// ========== 11. APOD ==========
// Lógica para cargar la imagen del día (APOD) desde la API de la NASA.
// Si la API falla, intenta cargar un respaldo de la NASA Images Library o un backup local.
async function loadAPOD(){
  const container = document.getElementById('apodContent');
  container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Cargando APOD...</p></div>';
  
  try {
    const apiUrls = URL_TEMPLATES.NASA_APIS('planetary/apod');
    const response = await fetchWithTimeout(apiUrls[0]);
    
    if (!response.ok) throw new Error('API no disponible');
    const data = await response.json();
    renderAPOD(data, false, 'api');
  } catch (error) {
    console.warn('APOD API falló, intentando respaldo de NASA Images:', error.message);
    await loadBackupAPODFromNASAImages(container);
  }
}

async function loadBackupAPODFromNASAImages(container){
  try {
    const visualBackup = {
      title: 'Nebulosa del Cangrejo (Imagen NASA)',
      date: new Date().toISOString().split('T')[0],
      explanation: 'Esta impresionante imagen muestra la Nebulosa del Cangrejo, los restos de una explosión de supernova observada por astrónomos chinos en 1054 d.C. La nebulosa se encuentra a unos 6,500 años luz de distancia en la constelación de Tauro. Esta imagen es cortesía de NASA Images Library.',
      url: URL_TEMPLATES.BACKUP_IMAGES('nebula', 'PIA23122')[0],
      media_type: 'image',
      copyright: 'NASA/ESA/Hubble'
    };
    
    renderAPOD(visualBackup, true, 'nasa-images');
  } catch (err) {
    console.warn('NASA Images no disponible, cargando backup JSON local');
    await loadBackupAPODFromJSON(container);
  }
}

async function loadBackupAPODFromJSON(container){
  try {
    const response = await fetch('data/backup.json');
    const backup = await response.json();
    if (backup?.apis) {
      const apodAPI = backup.apis.find(api => api.id === 'apod');
      if (apodAPI?.backup_data) {
        renderAPOD(apodAPI.backup_data, true, 'json');
        return;
      }
    }
    throw new Error('No backup data');
  } catch (err) {
    container.innerHTML = '<div class="alert alert-warning">No hay datos APOD disponibles.</div>';
  }
}

function renderAPOD(data, isBackup = false, source = 'api'){
  const container = document.getElementById('apodContent');
  
  let backupBadge = '';
  if (isBackup) {
    if (source === 'nasa-images') {
      backupBadge = '<span class="badge bg-info text-dark ms-2">NASA Images Library</span>';
    } else if (source === 'json') {
      backupBadge = '<span class="badge bg-warning text-dark ms-2">Datos de respaldo local</span>';
    }
  }
  
  const media = data.media_type === 'video' 
    ? `<div class="ratio ratio-16x9" style="border-radius:10px;overflow:hidden;">
         <iframe src="${data.url}" allowfullscreen></iframe>
       </div>
       <a href="${data.url}" target="_blank" class="btn btn-nasa btn-sm mt-2">
         <i class="bi bi-box-arrow-up-right"></i> Ver video completo
       </a>` 
    : `<img src="${data.url}" class="img-fluid rounded" style="width:100%;max-height:500px;object-fit:cover" alt="${data.title}" 
         onerror="this.src='${URL_TEMPLATES.BACKUP_IMAGES('nebula', 'PIA23122')[1]}'">`;
  
  container.innerHTML = `
    <div class="row g-4">
      <div class="col-lg-7">${media}</div>
      <div class="col-lg-5">
        <h4 style="color:var(--nasa-red)">${data.title} ${backupBadge}</h4>
        <p class="text-muted"><i class="bi bi-calendar-event"></i> ${data.date || ''} ${data.copyright ? '| © ' + data.copyright : ''}</p>
        <p style="line-height:1.6;text-align:justify">${data.explanation}</p>
        ${!isBackup ? '<a href="https://apod.nasa.gov/" target="_blank" class="btn btn-nasa btn-sm mt-2"><i class="bi bi-box-arrow-up-right"></i> Visitar APOD NASA</a>' : ''}
      </div>
    </div>`;
}

// ========== 12. EPIC ==========
// Lógica para mostrar imágenes de la Tierra desde el espacio usando la API EPIC de la NASA.
// Si la API falla, muestra una vista interactiva o un backup local.
let epicImages = [];
let currentEpicIndex = 0;

async function loadEPIC() {
  const container = document.getElementById('epicContent');
  container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Cargando vista de la Tierra...</p></div>';
  
  try {
    const apiUrls = URL_TEMPLATES.NASA_APIS('EPIC/api/natural');
    const response = await fetchWithTimeout(apiUrls[0]);
    
    if (!response.ok) throw new Error('API no disponible');
    
    const data = await response.json();
    console.log('✅ Datos EPIC obtenidos de la API:', data.length, 'imágenes');
    
    epicImages = data.slice(0, 5);
    currentEpicIndex = 0;
    renderEPIC(false, 'api');
    
  } catch (error) {
    console.warn('⚠️ EPIC API falló, cargando NASA Eyes on Earth:', error.message);
    loadNASAEyesEarth(container);
  }
}

function loadNASAEyesEarth(container) {
  if (!container) return;
  
  container.innerHTML = `
    <div class="text-center">
      <div class="ratio ratio-16x9 mb-3" style="border-radius:10px;overflow:hidden;max-height:500px;">
        <iframe src="https://eyes.nasa.gov/apps/solar-system/#/earth" 
          style="border:2px solid rgba(252,61,33,0.3);border-radius:10px" 
          allowfullscreen></iframe>
      </div>
      <div class="mt-3">
        <h5>🌍 Tierra en Tiempo Real - NASA Eyes <span class="badge bg-info text-dark">Vista Interactiva</span></h5>
        <p class="text-muted">Explora nuestro planeta desde el espacio con NASA Eyes on the Solar System</p>
        <div class="d-flex justify-content-center gap-2 mt-3">
          <a href="https://eyes.nasa.gov/apps/solar-system/#/earth" target="_blank" class="btn btn-nasa btn-sm">
            <i class="bi bi-box-arrow-up-right"></i> Abrir en pantalla completa
          </a>
          <button class="btn btn-outline-light btn-sm" onclick="loadBackupEPICFromJSON()">
            <i class="bi bi-images"></i> Ver imágenes EPIC alternativas
          </button>
        </div>
      </div>
    </div>`;
}

window.loadNASAEyesEarth = loadNASAEyesEarth;

async function loadBackupEPICFromJSON() {
  const container = document.getElementById('epicContent');
  container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Cargando imágenes de respaldo...</p></div>';
  
  try {
    const response = await fetch('data/epic_backup.json');
    const data = await response.json();
    
    if (data && data.length > 0) {
      console.log('✅ Respaldo EPIC cargado:', data.length, 'imágenes');
      epicImages = data;
      currentEpicIndex = 0;
      renderEPIC(true, 'json');
    } else {
      throw new Error('No backup data');
    }
  } catch (err) {
    console.error('❌ Error al cargar respaldo EPIC:', err);
    container.innerHTML = `
      <div class="alert alert-warning">
        <i class="bi bi-exclamation-triangle"></i> No hay imágenes EPIC disponibles.
        <button class="btn btn-sm btn-outline-warning ms-2" onclick="loadNASAEyesEarth(document.getElementById('epicContent'))">
          Volver a NASA Eyes
        </button>
      </div>`;
  }
}

window.loadBackupEPICFromJSON = loadBackupEPICFromJSON;

function renderEPIC(isBackup = false, source = 'api') {
  const container = document.getElementById('epicContent');
  
  if (!epicImages || epicImages.length === 0) {
    loadNASAEyesEarth(container);
    return;
  }
  
  const current = epicImages[currentEpicIndex];
  
  let backupBadge = '';
  if (isBackup && source === 'json') {
    backupBadge = '<span class="badge bg-warning text-dark ms-2">Datos de respaldo</span>';
  } else if (source === 'api') {
    backupBadge = '<span class="badge bg-success text-white ms-2">NASA EPIC API</span>';
  }
  
  let imageUrl;
  if (isBackup && source === 'json') {
    imageUrl = current.image_url;
  } else {
    const date = current.date.split(' ')[0].replace(/-/g, '/');
    const epicUrls = URL_TEMPLATES.EPIC_IMAGES(date, current.image);
    imageUrl = epicUrls[0];
  }
  
  container.innerHTML = `
    <div class="text-center">
      <img src="${imageUrl}" 
        class="img-fluid rounded" 
        style="max-width:100%;max-height:500px;object-fit:contain;border:2px solid rgba(252,61,33,0.2)" 
        alt="EPIC Earth ${currentEpicIndex + 1}"
        onerror="this.src='${URL_TEMPLATES.EPIC_IMAGES('2024/01/15', 'epic_1b_20240115000000')[0]}'">
      <div class="mt-3">
        <h5>${current.caption || 'Imagen de la Tierra desde el espacio'} ${backupBadge}</h5>
        <p class="text-muted"><i class="bi bi-calendar-event"></i> ${current.date}</p>
        <div class="d-flex justify-content-center gap-2 mt-3 flex-wrap">
          <button class="btn btn-nasa btn-sm" onclick="changeEPICImage(-1)">
            <i class="bi bi-chevron-left"></i> Anterior
          </button>
          <span class="align-self-center text-muted px-2">${currentEpicIndex + 1} / ${epicImages.length}</span>
          <button class="btn btn-nasa btn-sm" onclick="changeEPICImage(1)">
            Siguiente <i class="bi bi-chevron-right"></i>
          </button>
          <button class="btn btn-outline-light btn-sm" onclick="loadNASAEyesEarth(document.getElementById('epicContent'))">
            <i class="bi bi-globe"></i> Vista interactiva
          </button>
        </div>
      </div>
    </div>`;
}

function changeEPICImage(direction) {
  currentEpicIndex += direction;
  if (currentEpicIndex < 0) currentEpicIndex = epicImages.length - 1;
  if (currentEpicIndex >= epicImages.length) currentEpicIndex = 0;
  renderEPIC(epicImages[0].image_url ? true : false, epicImages[0].image_url ? 'json' : 'api');
}

// ========== 13. SISTEMA SOLAR ANIMADO ==========
// Renderiza una animación simple del sistema solar usando HTML y CSS.
function renderSolarSystem() {
  const container = document.getElementById('solarSystemAnimation');
  if (!container) return;
  
  container.innerHTML = `
    <div class="solar-system-container">
      <div class="sun"></div>
      
      <div class="orbit" style="width: 120px; height: 120px;">
        <div class="planet mercury"></div>
      </div>
      
      <div class="orbit" style="width: 180px; height: 180px;">
        <div class="planet venus"></div>
      </div>
      
      <div class="orbit" style="width: 240px; height: 240px;">
        <div class="planet earth"></div>
      </div>
      
      <div class="orbit" style="width: 300px; height: 300px;">
        <div class="planet mars"></div>
      </div>
    </div>
    
    <div class="text-center mt-4">
      <h4>Sistema Solar Interactivo</h4>
      <p class="text-muted">Observa los planetas orbitando alrededor del Sol en tiempo real</p>
    </div>
  `;
}

// ========== 14. ESTADÍSTICAS ==========
// Muestra estadísticas rápidas sobre la exploración espacial en tarjetas visuales.
function renderStats(){
  const row = document.getElementById('statsRow');
  const stats = [
    {icon:'bi-rocket-takeoff', number:'4', text:'Rovers en Marte'},
    {icon:'bi-camera-fill', number:'23', text:'Cámaras'},
    {icon:'bi-images', number:'500K+', text:'Imágenes'},
    {icon:'bi-star-fill', number:'365', text:'Días APOD'}
  ];
  
  row.innerHTML = stats.map(s => `
    <div class="col-md-3">
      <div class="card-nasa text-center p-3">
        <i class="bi ${s.icon}" style="font-size:2.2rem;color:var(--nasa-red)"></i>
        <div class="h3 mt-2">${s.number}</div>
        <div>${s.text}</div>
      </div>
    </div>
  `).join('');
}

// ========== 15. SISTEMA DE COMENTARIOS ==========
// Permite a los usuarios dejar comentarios y valoraciones, que se guardan en localStorage.
const commentsData = JSON.parse(localStorage.getItem('esoares_comments') || '[]');

function renderComments(){
  const container = document.getElementById('commentsContainer');
  if(!container) return;
  
  const sortedComments = [...commentsData].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  if(sortedComments.length === 0){
    container.innerHTML = '<p class="text-muted">No hay comentarios aún. ¡Sé el primero!</p>';
    return;
  }
  
  container.innerHTML = sortedComments.map(comment => `
    <div class="comment-item">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <strong>${comment.name}</strong>
          <div class="star-rating">${'⭐'.repeat(comment.rating)}</div>
        </div>
        <small class="text-muted">${new Date(comment.date).toLocaleDateString('es-ES')}</small>
      </div>
      <p class="mt-2 mb-0">${comment.text}</p>
    </div>
  `).join('');
  
  const avgRating = commentsData.reduce((sum, c) => sum + c.rating, 0) / commentsData.length;
  const avgContainer = document.getElementById('avgRating');
  if(avgContainer){
    avgContainer.textContent = `Valoración promedio: ${avgRating.toFixed(1)}/5 (${commentsData.length} valoraciones)`;
  }
}

function addComment(name, rating, text){
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  if(!nameRegex.test(name)){
    alert('El nombre solo puede contener letras y espacios');
    return false;
  }
  
  const comment = {
    id: Date.now(),
    name: name.trim(),
    rating: parseInt(rating),
    text: text.trim(),
    date: new Date().toISOString()
  };
  
  commentsData.push(comment);
  localStorage.setItem('esoares_comments', JSON.stringify(commentsData));
  renderComments();
  return true;
}

// ========== 16. INNOVACIÓN ==========
// Muestra avances recientes en tecnología espacial, filtrando por año.
async function loadInnovations(){
  const container = document.getElementById('advancesContainer');
  if(!container) return;
  
  const innovations = [
    {
      title: 'James Webb Space Telescope',
      description: 'El telescopio espacial más potente jamás construido, capaz de observar las primeras galaxias del universo.',
      icon: '🔭',
      year: 2021
    },
    {
      title: 'Perseverance Rover',
      description: 'Explorando Marte en busca de signos de vida antigua y recolectando muestras para futuras misiones.',
      icon: '🚗',
      year: 2021
    },
    {
      title: 'Artemis Program',
      description: 'Programa para llevar a la primera mujer y al próximo hombre a la Luna para 2025.',
      icon: '🌙',
      year: 2024
    }
  ];
  
  const recentInnovations = innovations.filter(i => i.year >= 2020);
  
  container.innerHTML = recentInnovations.map(item => `
    <div class="col-md-4 mb-4">
      <div class="card-nasa h-100 p-3">
        <div style="font-size:3rem" class="text-center">${item.icon}</div>
        <h4 class="mt-3" style="color:var(--nasa-blue)">${item.title}</h4>
        <p>${item.description}</p>
        <small class="text-muted">Año: ${item.year}</small>
      </div>
    </div>
  `).join('');
}

// ========== 17. INICIALIZACIÓN ==========
// Al cargar la página, inicializa el fondo estelar, galería, sistema solar, innovaciones,
// carga datos de APOD y EPIC, y configura el formulario de comentarios.
document.addEventListener('DOMContentLoaded', async () => {
  // Crear fondo estelar
  const spaceBackground = document.createElement('div');
  spaceBackground.className = 'space-background';
  spaceBackground.innerHTML = '<div class="stars"></div>';
  document.body.insertBefore(spaceBackground, document.body.firstChild);
  
  renderStats();
  renderGallery();
  renderSolarSystem();
  loadInnovations();
  
  await Promise.all([
    loadAPOD(),
    loadEPIC()
  ]);
  
  renderComments();
  
  const commentForm = document.getElementById('commentForm');
  if(commentForm){
    commentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('commentName').value;
      const rating = document.getElementById('commentRating').value;
      const text = document.getElementById('commentText').value;
      
      if(addComment(name, rating, text)){
        e.target.reset();
        alert('¡Comentario agregado exitosamente!');
      }
    });
  }
});