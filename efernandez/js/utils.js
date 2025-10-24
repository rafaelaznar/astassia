/**
 * utils.js - Funciones utilitarias para tema, carga, orden, filtrado y notificaciones
 */

/**
 * Gestiona el tema claro/oscuro y lo guarda en localStorage
 * Detecta automáticamente la preferencia del sistema
 */
export function setTheme() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;

  const body = document.body;
  const storedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  body.dataset.theme = storedTheme || (systemPrefersDark ? "dark" : "light");

  const updateButtonIcon = () => {
    btn.textContent = body.dataset.theme === "light" ? "🌙" : "☀️";
  };
  updateButtonIcon();

  btn.addEventListener("click", () => {
    body.dataset.theme = body.dataset.theme === "light" ? "dark" : "light";
    localStorage.setItem("theme", body.dataset.theme);
    updateButtonIcon();
  });
}

/**
 * Muestra un loader en un contenedor
 * @param {string} containerId
 */
export function showLoader(containerId = "app") {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `<div class="loader"></div>`;
}

/**
 * Ordena recetas alfabéticamente por nombre
 * @param {Array} recipes
 * @param {"asc"|"desc"} order
 * @returns {Array}
 */
export function sortRecipesByName(recipes, order = "asc") {
  return [...recipes].sort((a, b) => {
    const nameA = a.strMeal?.toLowerCase() || "";
    const nameB = b.strMeal?.toLowerCase() || "";
    return order === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
  });
}

/**
 * Filtra recetas por categoría o área
 * @param {Array} recipes
 * @param {Object} filters - { category: string|null, area: string|null }
 * @returns {Array}
 */
export function filterRecipes(recipes, filters = {}) {
  return recipes.filter(r => {
    const matchCategory = filters.category ? r.strCategory === filters.category : true;
    const matchArea = filters.area ? r.strArea === filters.area : true;
    return matchCategory && matchArea;
  });
}

/**
 * Muestra notificaciones tipo toast
 * @param {string} msg - mensaje a mostrar
 * @param {number} duration - duración en ms
 */
export function showToast(msg, duration = 2500) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    Object.assign(toast.style, {
      position: "fixed",
      top: "1rem",
      right: "1rem",
      background: "rgba(0,0,0,0.85)",
      color: "#fff",
      padding: "0.5rem 1rem",
      borderRadius: "5px",
      opacity: "0",
      transform: "translateY(-20px)",
      transition: "all 0.3s ease",
      zIndex: "9999",
    });
    document.body.appendChild(toast);
  }

  toast.textContent = msg;
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)";
  clearTimeout(toast._timeoutId);
  toast._timeoutId = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-20px)";
  }, duration);
}
