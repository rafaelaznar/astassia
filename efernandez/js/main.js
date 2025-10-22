import { fetchRecipes, fetchByCategory, fetchCategories } from "./api.js";
import { renderRecipes, renderFavorites, renderContactForm } from "./ui.js";
import { setTheme, showLoader } from "./utils.js";
import { syncFavoriteButtons } from "./storage.js";

setTheme();

async function loadHome() {
  const app = document.getElementById("app");
  if (!app) return;

  // Crear contenedor de recetas si no existe
  let recipesContainer = document.getElementById("recipes-container");
  if (!recipesContainer) {
    recipesContainer = document.createElement("div");
    recipesContainer.id = "recipes-container";
    recipesContainer.className = "recipes-grid";
    app.innerHTML = "";
    app.appendChild(recipesContainer);
  }

  // Crear select de categorías si no existe
  let categorySelect = document.getElementById("category-select");
  if (!categorySelect) {
    categorySelect = document.createElement("select");
    categorySelect.id = "category-select";
    categorySelect.innerHTML = `<option value="">Todas las categorías</option>`;
    document.querySelector("nav").appendChild(categorySelect);
  }

  // Poblar select de categorías desde la API (mejor motor de búsqueda por categoría)
  try {
    const cats = await fetchCategories();
    cats.forEach(cat => {
      if (!Array.from(categorySelect.options).some(o => o.value === cat)) {
        categorySelect.innerHTML += `<option value="${cat}">${cat}</option>`;
      }
    });
  } catch (err) {
    // Fallback a lista local si la API falla
    const fallback = ["Beef", "Chicken", "Dessert", "Lamb", "Miscellaneous", "Pasta", "Pork", "Seafood", "Side", "Starter", "Vegan", "Vegetarian", "Breakfast", "Goat"];
    fallback.forEach(cat => {
      if (!Array.from(categorySelect.options).some(o => o.value === cat)) {
        categorySelect.innerHTML += `<option value="${cat}">${cat}</option>`;
      }
    });
  }

  // Paginación simple: tamaño de página y límite actual
  const PAGE_SIZE = 24;
  let currentLimit = PAGE_SIZE;
  let currentQuery = null;
  let currentCategory = null;

  async function loadRecipes(query = null, category = null, limit = currentLimit) {
    showLoader("recipes-container");
    try {
      let recipes = [];
      if (category) {
        // Usar endpoint específico por categoría (mejor y más rápido)
        recipes = await fetchByCategory(category, limit);
      } else {
        recipes = await fetchRecipes(query, limit);
      }

      // Keep the original order provided by the API for a consistent, predictable layout
      renderRecipes(recipes, "recipes-container");
      // Sincronizar estado de botones favoritos según localStorage
      syncFavoriteButtons(recipes);
    } catch (err) {
      recipesContainer.innerHTML = "<p>Error cargando recetas 😔</p>";
      console.error(err);
    }
  }

  // Mantener estado y reiniciar límite cuando el usuario cambia filtros
  categorySelect.addEventListener("change", e => {
    currentCategory = e.target.value || null;
    currentLimit = PAGE_SIZE;
    loadRecipes(currentQuery, currentCategory, currentLimit);
  });

  // Sorting control removed to keep layout stable and ordered

  const searchBtn = document.getElementById("search-btn");
  const searchInput = document.getElementById("search-input");

  // Mostrar barra de búsqueda y categorías
  searchInput.style.display = "inline-block";
  searchBtn.style.display = "inline-block";
  categorySelect.style.display = "inline-block";

  const handleSearch = () => {
    currentQuery = searchInput.value.trim() || null;
    currentCategory = categorySelect.value || null;
    currentLimit = PAGE_SIZE;
    loadRecipes(currentQuery, currentCategory, currentLimit);
  };

  searchBtn.addEventListener("click", handleSearch);
  searchInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  });

  // Cargar recetas aleatorias al inicio
  // Crear botón 'Cargar más' que incrementa el límite y vuelve a cargar
  let loadMoreWrapper = document.getElementById("load-more-wrapper");
  if (!loadMoreWrapper) {
    loadMoreWrapper = document.createElement("div");
    loadMoreWrapper.id = "load-more-wrapper";
    loadMoreWrapper.style.textAlign = "center";
    loadMoreWrapper.style.margin = "1.2em 0";
    const btn = document.createElement("button");
    btn.id = "load-more-btn";
    btn.textContent = "Cargar más recetas";
    loadMoreWrapper.appendChild(btn);
    app.appendChild(loadMoreWrapper);
  }

  document.getElementById("load-more-btn").addEventListener("click", () => {
    currentLimit += PAGE_SIZE;
    loadRecipes(currentQuery, currentCategory, currentLimit);
  });

  // Carga inicial con más resultados por defecto
  loadRecipes(null, null, currentLimit);
}

function router() {
  const page = location.hash.slice(1) || "home";
  const app = document.getElementById("app");
  const searchInput = document.getElementById("search-input");
  const searchBtn = document.getElementById("search-btn");
  const categorySelect = document.getElementById("category-select");

  if (page === "home") {
    if (searchInput) searchInput.style.display = "inline-block";
    if (searchBtn) searchBtn.style.display = "inline-block";
    if (categorySelect) categorySelect.style.display = "inline-block";

    // Asegurarse de que exista contenedor de recetas
    let recipesContainer = document.getElementById("recipes-container");
    if (!recipesContainer) {
      recipesContainer = document.createElement("div");
      recipesContainer.id = "recipes-container";
      recipesContainer.className = "recipes-grid";
      app.innerHTML = "";
      app.appendChild(recipesContainer);
    } else {
      recipesContainer.className = "recipes-grid";
    }

    loadHome();
  } else {
    if (searchInput) searchInput.style.display = "none";
    if (searchBtn) searchBtn.style.display = "none";
    if (categorySelect) categorySelect.style.display = "none";

    if (page === "favorites") {
      app.innerHTML = "";
      const favContainer = document.createElement("div");
      favContainer.className = "recipes-grid";
      favContainer.id = "recipes-container";
      app.appendChild(favContainer);
      renderFavorites();
    } else if (page === "contact") {
      app.innerHTML = "";
      renderContactForm();
    }
  }

  // Activar enlace de navegación
  document.querySelectorAll(".nav-link").forEach(a => a.classList.remove("active"));
  const link = document.querySelector(`[href="#${page}"]`);
  if (link) link.classList.add("active");
}

window.addEventListener("hashchange", router);
document.addEventListener("DOMContentLoaded", router);
