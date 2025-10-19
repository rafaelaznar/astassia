const API_KEY = "WMMd8qJZpFJv7Z2HngwU2aOi8RN7RGRC4SgHukgXxpKT88rHgIhJcPG5";

// Módulo con cierre para helpers y estado
const app = (() => {
  const byId = (id) => document.getElementById(id);
  const dom = {
    typeSelect: byId("type"),
    queryInput: byId("query"),
    photoOrientation: byId("photoOrientation"),
    photoMinWidth: byId("photoMinWidth"),
    photoMinHeight: byId("photoMinHeight"),
    photoColor: byId("photoColor"),
    videoOrientation: byId("videoOrientation"),
    videoMinDuration: byId("videoMinDuration"),
    videoMaxDuration: byId("videoMaxDuration"),
    videoQuality: byId("videoQuality"),
    resultsContainer: byId("results"),
    statusContainer: byId("status"),
    searchButton: byId("searchBtn"),
    prevPageButton: byId("prevPage"),
    nextPageButton: byId("nextPage"),
    pageIndicator: byId("pageIndicator"),
    paginationBar: byId("paginationBar"),
    previewModalEl: byId("previewModal"),
    modalContent: byId("modalContent"),
    openBtn: byId("openBtn"),
    downloadBtn: byId("downloadBtn"),
  };

  let currentPage = 1;
  const PER_PAGE = 20;

  const escapeHtml = (s) =>
    String(s || "").replace(/[&<>"']/g, (m) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]
    ));

  const setStatus = (text, kind = "secondary") => {
    dom.statusContainer.innerHTML = `<div class="alert alert-${kind} py-2 mb-0">${escapeHtml(text)}</div>`;
  };

  const toggleSections = () => {
    const type = dom.typeSelect.value;
    document.querySelectorAll('[data-section="photo"]').forEach((el) => {
      el.classList.toggle("d-none", type !== "photo");
    });
    document.querySelectorAll('[data-section="video"]').forEach((el) => {
      el.classList.toggle("d-none", type !== "video");
    });
  };

  const toSearchUrl = () => {
    const type = dom.typeSelect.value;
    const base = type === "video"
      ? "https://api.pexels.com/videos/search"
      : "https://api.pexels.com/v1/search";

    const params = new URLSearchParams();
    const query = (dom.queryInput.value || "").trim();
    params.set("query", query);
    params.set("per_page", String(PER_PAGE));
    params.set("page", String(currentPage));

    if (type === "photo") {
      if (dom.photoOrientation.value) params.set("orientation", dom.photoOrientation.value);
      if (dom.photoColor.value) params.set("color", dom.photoColor.value.trim());
      const minW = Number(dom.photoMinWidth.value || 0);
      const minH = Number(dom.photoMinHeight.value || 0);
      if (minW > 0) params.set("min_width", String(minW));
      if (minH > 0) params.set("min_height", String(minH));
    } else {
      if (dom.videoOrientation.value) params.set("orientation", dom.videoOrientation.value);
      const minD = Number(dom.videoMinDuration.value || 0);
      const maxD = Number(dom.videoMaxDuration.value || 0);
      if (minD > 0) params.set("min_duration", String(minD));
      if (maxD > 0) params.set("max_duration", String(maxD));
      const quality = dom.videoQuality.value;
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

    return `${base}?${params.toString()}`;
  };

  const fetchJson = async (url) => {
    const res = await fetch(url, { headers: { Authorization: API_KEY } });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Error ${res.status} ${res.statusText}. ${txt}`);
    }
    return res.json();
  };

  const addPhotoCard = (photo) => {
    const src = photo?.src?.large || photo?.src?.medium || photo?.src?.original || "";
    const pageUrl = photo?.url || "#";
    const author = photo?.photographer || "Autor desconocido";
    const el = document.createElement("article");
    el.className = "pin";
    el.dataset.type = "photo";
    el.dataset.src = photo?.src?.original || src;
    el.dataset.pageUrl = pageUrl;
    el.dataset.author = author;
    el.innerHTML = `
      <img loading="lazy" src="${src}" alt="${escapeHtml(author)}"/>
      <div class="pin-body d-flex justify-content-between align-items-center">
        <a class="pin-link" href="${pageUrl}" target="_blank" rel="noopener">${escapeHtml(author)}</a>
      </div>`;
    dom.resultsContainer.appendChild(el);
  };

  const pickBestVideoFile = (files = []) => files.slice().sort((a, b) => (b.width || 0) - (a.width || 0))[0];

  const addVideoCard = (video) => {
    const best = pickBestVideoFile(video?.video_files || []);
    const poster = video?.image || video?.video_pictures?.[0]?.picture || "";
    const url = best?.link || "";
    const width = best?.width || 0;
    const height = best?.height || 0;
    const el = document.createElement("article");
    el.className = "pin";
    el.dataset.type = "video";
    el.dataset.src = url;
    el.dataset.poster = poster || "";
    el.dataset.pageUrl = video?.url || "#";
    el.innerHTML = `
      <video controls preload="metadata" ${poster ? `poster="${poster}"` : ""}>
        <source src="${url}" type="video/mp4" />
      </video>
      <div class="pin-body d-flex justify-content-between align-items-center">
        <span class="pin-meta">${width}×${height}</span>
        <a class="pin-link" href="${video?.url || '#'}" target="_blank" rel="noopener">Abrir en Pexels</a>
      </div>`;
    dom.resultsContainer.appendChild(el);
  };

  const updatePaginationControls = ({ page, perPage, totalResults, returned }) => {
    dom.pageIndicator.textContent = `Página ${page}`;
    const prevItem = dom.prevPageButton.closest('.page-item');
    const nextItem = dom.nextPageButton.closest('.page-item');
    if (prevItem) prevItem.classList.toggle('disabled', page <= 1);
    let hasNext = true;
    if (typeof totalResults === 'number' && totalResults >= 0) {
      const totalPages = Math.max(1, Math.ceil(totalResults / perPage));
      hasNext = page < totalPages;
    } else if (typeof returned === 'number') {
      hasNext = returned === perPage; // heurística
    }
    if (nextItem) nextItem.classList.toggle('disabled', !hasNext);
  };

  const performSearch = async () => {
    const query = (dom.queryInput.value || "").trim();
    const type = dom.typeSelect.value;
    if (!query) return setStatus("Introduce una consulta de búsqueda.", "danger");

    dom.resultsContainer.innerHTML = "";
    setStatus(`Buscando «${query}»…`);
    dom.searchButton.disabled = true;
    // show pagination bar when searching
    dom.paginationBar.classList.remove('d-none');
    try {
      const url = toSearchUrl();
      const data = await fetchJson(url);
      const items = type === "video" ? (data.videos || []) : (data.photos || []);
      const renderItem = type === "video" ? addVideoCard : addPhotoCard;
      items.forEach(renderItem);
      updatePaginationControls({ page: currentPage, perPage: PER_PAGE, totalResults: data.total_results, returned: items.length });
      setStatus(`Página ${currentPage}. Resultados: ${items.length}.`, "secondary");
    } catch (err) {
      setStatus(err.message || "Error al cargar.", "danger");
    } finally {
      dom.searchButton.disabled = false;
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    currentPage = 1;
    await performSearch();
  };

  const onChangePage = async (direction) => {
    const query = (dom.queryInput.value || "").trim();
    if (!query) return;
    currentPage = Math.max(1, currentPage + direction);
    await performSearch();
  };

  // Preview modal logic
  let currentPreview = null;
  const openPreview = ({ type, src, poster, pageUrl }) => {
    currentPreview = { type, src, poster, pageUrl };
    if (type === 'photo') {
      dom.modalContent.innerHTML = `<img src="${src}" class="img-fluid w-100" alt="preview"/>`;
    } else {
      dom.modalContent.innerHTML = `<video controls class="w-100" ${poster ? `poster="${poster}"` : ''}><source src="${src}" type="video/mp4"></video>`;
    }
    const ModalCtor = window.bootstrap && window.bootstrap.Modal ? window.bootstrap.Modal : null;
    if (ModalCtor) {
      const instance = ModalCtor.getOrCreateInstance(dom.previewModalEl);
      instance.show();
    } else {
      dom.previewModalEl.style.display = 'block';
      dom.previewModalEl.classList.add('show');
    }
  };

  const downloadUrl = async (url, filename) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network error');
      const blob = await res.blob();
      const a = document.createElement('a');
      const objUrl = URL.createObjectURL(blob);
      a.href = objUrl; a.download = filename || 'download';
      document.body.appendChild(a); a.click();
      URL.revokeObjectURL(objUrl); a.remove();
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  const init = () => {
    const searchForm = document.getElementById("searchForm");
    if (searchForm) searchForm.addEventListener("submit", onSubmit);
    dom.typeSelect.addEventListener("change", toggleSections);
    dom.prevPageButton.addEventListener("click", () => onChangePage(-1));
    dom.nextPageButton.addEventListener("click", () => onChangePage(1));
    // Open preview when clicking on a pin
    dom.resultsContainer.addEventListener('click', (ev) => {
      const pin = ev.target.closest('.pin');
      if (!pin) return;
      const type = pin.dataset.type;
      const src = pin.dataset.src;
      const poster = pin.dataset.poster || '';
      const pageUrl = pin.dataset.pageUrl || '#';
      openPreview({ type, src, poster, pageUrl });
    });
    dom.openBtn.addEventListener('click', () => {
      if (!currentPreview) return;
      window.open(currentPreview.pageUrl || currentPreview.src, '_blank');
    });
    dom.downloadBtn.addEventListener('click', () => {
      if (!currentPreview) return;
      const fn = currentPreview.type === 'photo' ? 'imagen.jpg' : 'video.mp4';
      downloadUrl(currentPreview.src, fn);
    });

    // initial state
    toggleSections();
    // keep pagination hidden until first search
    if (dom.paginationBar) dom.paginationBar.classList.add('d-none');
  };

  return { init };
})();

// Como el script se carga con defer, el DOM ya está listo
app.init();