const API_KEY = "WMMd8qJZpFJv7Z2HngwU2aOi8RN7RGRC4SgHukgXxpKT88rHgIhJcPG5";

// módulo con cierre que encapsula helpers y estado de la vista
const app = (() => {
  const getElementById = (elementId) => document.getElementById(elementId);
  const uiElements = {
    typeSelect: getElementById("type"),
    queryInput: getElementById("query"),
    photoOrientationSelect: getElementById("photoOrientation"),
    photoMinWidthInput: getElementById("photoMinWidth"),
    photoMinHeightInput: getElementById("photoMinHeight"),
    photoColorInput: getElementById("photoColor"),
    videoOrientationSelect: getElementById("videoOrientation"),
    videoMinDurationInput: getElementById("videoMinDuration"),
    videoMaxDurationInput: getElementById("videoMaxDuration"),
    videoQualitySelect: getElementById("videoQuality"),
    resultsContainer: getElementById("results"),
    statusContainer: getElementById("status"),
    searchButton: getElementById("searchBtn"),
    filtersSearchButton: getElementById("filtersSearchBtn"),
    prevPageButton: getElementById("prevPage"),
    nextPageButton: getElementById("nextPage"),
    pageIndicator: getElementById("pageIndicator"),
    paginationBar: getElementById("paginationBar"),
    previewModalElement: getElementById("previewModal"),
    modalContent: getElementById("modalContent"),
    openButton: getElementById("openBtn"),
    downloadButton: getElementById("downloadBtn"),
    welcomeTopicLabel: getElementById("welcomeTopic"),
  };

  let currentPage = 1;
  const RESULTS_PER_PAGE = 20;
  // lista de temas para precargar contenido visual aleatorio al iniciar
  const RANDOM_TOPICS = [
    "horse",
    "cats",
    "dogs",
    "mountains",
    "cars",
    "beach",
    "forest",
    "architecture",
    "travel",
    "city",
    "sunrise",
    "concert",
    "coffee",
    "flowers",
  ];

  // normalizar y estandarizar nombres de colores
  const normalizeColorFilter = (rawValue = "") => {
    const trimmed = rawValue.trim();
    if (!trimmed) return "";
    const lowerCased = trimmed.toLowerCase();
    const normalized = typeof lowerCased.normalize === "function"
      ? lowerCased.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      : lowerCased;
    const colorMap = {
      rojo: "red",
      naranja: "orange",
      amarillo: "yellow",
      verde: "green",
      azul: "blue",
      turquesa: "turquoise",
      morado: "purple",
      violeta: "purple",
      rosa: "pink",
      marron: "brown",
      negro: "black",
      gris: "gray",
      blanco: "white",
      dorado: "gold",
    };
    if (colorMap[normalized]) return colorMap[normalized];
    const hexMatch = normalized.match(/^#?([0-9a-f]{6})$/i);
    if (hexMatch) return hexMatch[1].toLowerCase();
    return normalized;
  };

  const sanitizeHtml = (text = "") =>
    String(text).replace(/[&<>"']/g, (match) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[match]
  ));

  // muestra mensajes de feedback en la barra de estado
  const setStatus = (text, kind = "secondary") => {
    uiElements.statusContainer.innerHTML = `<div class="alert alert-${kind} py-2 mb-0">${sanitizeHtml(text)}</div>`;
  };

  // alterna los filtros según si se buscan fotos o videos
  const toggleSections = () => {
    const type = uiElements.typeSelect.value;
    document.querySelectorAll('[data-section="photo"]').forEach((element) => {
      element.classList.toggle("d-none", type !== "photo");
    });
    document.querySelectorAll('[data-section="video"]').forEach((element) => {
      element.classList.toggle("d-none", type !== "video");
    });
  };

  // construye la URL de la petición hacia la API de Pexels con todos los parámetros activos
  const buildSearchUrl = () => {
    const type = uiElements.typeSelect.value;
    const baseUrl = type === "video"
      ? "https://api.pexels.com/videos/search"
      : "https://api.pexels.com/v1/search";

    const params = new URLSearchParams();
    const query = (uiElements.queryInput.value || "").trim();
    params.set("query", query);
    params.set("per_page", String(RESULTS_PER_PAGE));
    params.set("page", String(currentPage));

    if (type === "photo") {
      if (uiElements.photoOrientationSelect.value) params.set("orientation", uiElements.photoOrientationSelect.value);
      const normalizedColor = normalizeColorFilter(uiElements.photoColorInput.value || "");
      if (normalizedColor) params.set("color", normalizedColor);
      const minWidth = Number(uiElements.photoMinWidthInput.value || 0);
      const minHeight = Number(uiElements.photoMinHeightInput.value || 0);
      if (minWidth > 0) params.set("min_width", String(minWidth));
      if (minHeight > 0) params.set("min_height", String(minHeight));
    } else if (type === "video") {
      if (uiElements.videoOrientationSelect.value) params.set("orientation", uiElements.videoOrientationSelect.value);
      const minDuration = Number(uiElements.videoMinDurationInput.value || 0);
      const maxDuration = Number(uiElements.videoMaxDurationInput.value || 0);
      if (minDuration > 0) params.set("min_duration", String(minDuration));
      if (maxDuration > 0) params.set("max_duration", String(maxDuration));
      const quality = uiElements.videoQualitySelect.value;
      if (quality === "1080") {
        params.set("min_height", "1080");
      } else if (quality === "4k") {
        params.set("min_width", "3840");
        params.set("min_height", "2160");
      } else if (quality === "8k") {
        params.set("min_width", "7680");
        params.set("min_height", "4320");
      }
    }

    return `${baseUrl}?${params.toString()}`;
  };

  // realiza el request HTTP y devuelve el JSON controlando errores de red
  const fetchJsonFromApi = async (url) => {
    const response = await fetch(url, { headers: { Authorization: API_KEY } });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`Error ${response.status} ${response.statusText}. ${errorText}`);
    }
    return response.json();
  };

  // renderiza una tarjeta para cada fotografía de la lista
  const renderPhotoCard = (photo) => {
    const imageSource = photo?.src?.large || photo?.src?.medium || photo?.src?.original || "";
    const detailPageUrl = photo?.url || "#";
    const photographerName = photo?.photographer || "Autor desconocido";
    const cardElement = document.createElement("article");
    cardElement.className = "pin";
    cardElement.dataset.type = "photo";
    cardElement.dataset.src = photo?.src?.original || imageSource;
    cardElement.dataset.pageUrl = detailPageUrl;
    cardElement.dataset.author = photographerName;
    cardElement.innerHTML = `
      <img loading="lazy" src="${imageSource}" alt="${sanitizeHtml(photographerName)}"/>
      <div class="pin-body d-flex justify-content-between align-items-center">
        <a class="pin-link" href="${detailPageUrl}" target="_blank" rel="noopener">${sanitizeHtml(photographerName)}</a>
      </div>`;
    uiElements.resultsContainer.appendChild(cardElement);
  };

  const selectLargestVideoFile = (files = []) => files.slice().sort((a, b) => (b.width || 0) - (a.width || 0))[0];

  // renderiza una tarjeta para cada video mostrando poster y resolución
  const renderVideoCard = (video) => {
    const selectedVideoFile = selectLargestVideoFile(video?.video_files || []);
    const posterImage = video?.image || video?.video_pictures?.[0]?.picture || "";
    const sourceUrl = selectedVideoFile?.link || "";
    const videoWidth = selectedVideoFile?.width || 0;
    const videoHeight = selectedVideoFile?.height || 0;
    const cardElement = document.createElement("article");
    cardElement.className = "pin";
    cardElement.dataset.type = "video";
    cardElement.dataset.src = sourceUrl;
    cardElement.dataset.poster = posterImage || "";
    cardElement.dataset.pageUrl = video?.url || "#";
    cardElement.innerHTML = `
      <video controls preload="metadata" ${posterImage ? `poster="${posterImage}"` : ""}>
        <source src="${sourceUrl}" type="video/mp4" />
      </video>
      <div class="pin-body d-flex justify-content-between align-items-center">
        <span class="pin-meta">${videoWidth}×${videoHeight}</span>
        <a class="pin-link" href="${video?.url || '#'}" target="_blank" rel="noopener">Abrir en Pexels</a>
      </div>`;
    uiElements.resultsContainer.appendChild(cardElement);
  };

  // activa o desactiva los controles de paginación tras cada búsqueda
  const updatePaginationControls = ({ page, perPage, totalResults, returned }) => {
    uiElements.pageIndicator.textContent = `Página ${page}`;
    const previousItem = uiElements.prevPageButton.closest('.page-item');
    const nextItem = uiElements.nextPageButton.closest('.page-item');
    if (previousItem) previousItem.classList.toggle('disabled', page <= 1);
    let hasNext = true;
    if (typeof totalResults === 'number' && totalResults >= 0) {
      const totalPages = Math.max(1, Math.ceil(totalResults / perPage));
      hasNext = page < totalPages;
    } else if (typeof returned === 'number') {
      hasNext = returned === perPage; // heurística cuando no se conoce el total
    }
    if (nextItem) nextItem.classList.toggle('disabled', !hasNext);
  };

  // ejecuta la búsqueda contra la API, admite overrides para precargas y pinta la cuadrícula resultante
  const performSearch = async (options = {}) => {
    const { queryOverride, skipPaginationBar = false, ignoreEmpty = false } = options;
    const rawQuery = queryOverride ?? uiElements.queryInput.value ?? "";
    const query = rawQuery.trim();
    if (queryOverride !== undefined) {
      uiElements.queryInput.value = queryOverride;
    }
    const type = uiElements.typeSelect.value;
    if (!query) {
      if (ignoreEmpty) return;
      return setStatus("Introduce una consulta de búsqueda.", "danger");
    }

    uiElements.resultsContainer.innerHTML = "";
    setStatus(`Buscando «${query}»…`);
    uiElements.searchButton.disabled = true;
    if (uiElements.filtersSearchButton) uiElements.filtersSearchButton.disabled = true;
    if (uiElements.paginationBar) {
      if (skipPaginationBar) {
        uiElements.paginationBar.classList.add('d-none');
      } else {
        uiElements.paginationBar.classList.remove('d-none');
      }
    }
    try {
      const requestUrl = buildSearchUrl();
      const apiResponse = await fetchJsonFromApi(requestUrl);
      const items = type === "video" ? (apiResponse.videos || []) : (apiResponse.photos || []);
      const renderItem = type === "video" ? renderVideoCard : renderPhotoCard;
      items.forEach(renderItem);
      updatePaginationControls({
        page: currentPage,
        perPage: RESULTS_PER_PAGE,
        totalResults: apiResponse.total_results,
        returned: items.length,
      });
      setStatus(`Página ${currentPage}. Resultados: ${items.length}.`, "secondary");
    } catch (error) {
      setStatus(error.message || "Error al cargar.", "danger");
    } finally {
      uiElements.searchButton.disabled = false;
      if (uiElements.filtersSearchButton) uiElements.filtersSearchButton.disabled = false;
    }
  };

  const runSearchFromQuery = async () => {
    currentPage = 1;
    const query = (uiElements.queryInput.value || "").trim();
    if (query && uiElements.welcomeTopicLabel) {
      uiElements.welcomeTopicLabel.textContent = query;
    }
    await performSearch();
  };

  const handleSearchSubmit = async (event) => {
    if (event) event.preventDefault();
    await runSearchFromQuery();
  };

  const handlePageChange = async (direction) => {
    const query = (uiElements.queryInput.value || "").trim();
    if (!query) return;
    currentPage = Math.max(1, currentPage + direction);
    await performSearch();
  };

  let currentPreviewData = null;

  // abre el modal de vista previa con la información de la tarjeta seleccionada
  const openPreviewModal = ({ type, src, poster, pageUrl }) => {
    currentPreviewData = { type, src, poster, pageUrl };
    if (type === 'photo') {
      uiElements.modalContent.innerHTML = `<img src="${src}" class="preview-media" alt="Vista previa"/>`;
    } else {
      uiElements.modalContent.innerHTML = `<video controls class="preview-media" ${poster ? `poster="${poster}"` : ''}><source src="${src}" type="video/mp4"></video>`;
    }
    const ModalConstructor = window.bootstrap && window.bootstrap.Modal ? window.bootstrap.Modal : null;
    if (ModalConstructor) {
      const instance = ModalConstructor.getOrCreateInstance(uiElements.previewModalElement);
      instance.show();
    } else {
      uiElements.previewModalElement.style.display = 'block';
      uiElements.previewModalElement.classList.add('show');
    }
  };

  // descarga archivos desde la URL original o, si falla, abre en nueva pestaña
  const downloadMediaFromUrl = async (url, filename) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network error');
      const blob = await response.blob();
      const anchorElement = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      anchorElement.href = objectUrl;
      anchorElement.download = filename || 'download';
      document.body.appendChild(anchorElement);
      anchorElement.click();
      URL.revokeObjectURL(objectUrl);
      anchorElement.remove();
    } catch (error) {
      window.open(url, '_blank');
    }
  };

  // conecta los manejadores de eventos y deja la interfaz lista para usar
  const initializeApp = () => {
    const searchFormElement = document.getElementById("searchForm");
    if (searchFormElement) searchFormElement.addEventListener("submit", handleSearchSubmit);
    if (uiElements.filtersSearchButton) {
      uiElements.filtersSearchButton.addEventListener("click", () => {
        void runSearchFromQuery();
      });
    }
    uiElements.typeSelect.addEventListener("change", toggleSections);
    uiElements.prevPageButton.addEventListener("click", () => handlePageChange(-1));
    uiElements.nextPageButton.addEventListener("click", () => handlePageChange(1));
    uiElements.resultsContainer.addEventListener('click', (event) => {
      const cardElement = event.target.closest('.pin');
      if (!cardElement) return;
      const type = cardElement.dataset.type;
      const src = cardElement.dataset.src;
      const poster = cardElement.dataset.poster || '';
      const pageUrl = cardElement.dataset.pageUrl || '#';
      openPreviewModal({ type, src, poster, pageUrl });
    });
    uiElements.openButton.addEventListener('click', () => {
      if (!currentPreviewData) return;
      window.open(currentPreviewData.pageUrl || currentPreviewData.src, '_blank');
    });
    uiElements.downloadButton.addEventListener('click', () => {
      if (!currentPreviewData) return;
      const fileName = currentPreviewData.type === 'photo' ? 'imagen.jpg' : 'video.mp4';
      downloadMediaFromUrl(currentPreviewData.src, fileName);
    });

    toggleSections();
    if (uiElements.paginationBar) uiElements.paginationBar.classList.add('d-none');

    // precargar consulta aleatoria
    const prefillWithRandomTopic = async () => {
      const randomTopic = RANDOM_TOPICS[Math.floor(Math.random() * RANDOM_TOPICS.length)];
      if (!randomTopic) return;
      currentPage = 1;
      uiElements.typeSelect.value = "photo";
      toggleSections();
      if (uiElements.welcomeTopicLabel) uiElements.welcomeTopicLabel.textContent = randomTopic;
      await performSearch({
        queryOverride: randomTopic,
        skipPaginationBar: true,
        ignoreEmpty: true,
      });
    };

    void prefillWithRandomTopic().catch(() => {
      setStatus("No se pudo cargar la imagen inicial.", "warning");
    });
  };

  return { init: initializeApp };
})();

app.init();
