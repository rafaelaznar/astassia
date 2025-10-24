import { fetchRecipes, fetchByCategory, fetchCategories } from "./api.js";
import { renderRecipes, renderFavorites, renderContactForm } from "./ui.js";
import { setTheme, showLoader } from "./utils.js";
import { syncFavoriteButtons } from "./storage.js";

setTheme();

const PAGE_SIZE = 24;

async function loadHome() {
  const app = document.getElementById("app");
  if (!app) return;

  let recipesContainer = document.getElementById("recipes-container");
  if (!recipesContainer) {
    recipesContainer = document.createElement("div");
    recipesContainer.id = "recipes-container";
    recipesContainer.className = "recipes-grid";
    app.innerHTML = "";
    app.appendChild(recipesContainer);
  }

  let categorySelect = document.getElementById("category-select");
  if (!categorySelect) {
    categorySelect = document.createElement("select");
    categorySelect.id = "category-select";
    categorySelect.innerHTML = `<option value="">Todas las categorías</option>`;
    document.querySelector("nav")?.appendChild(categorySelect);
  }

  try {
    const cats = await fetchCategories();
    cats.forEach(cat => {
      if (![...categorySelect.options].some(o => o.value === cat)) {
        categorySelect.innerHTML += `<option value="${cat}">${cat}</option>`;
      }
    });
  } catch {
    const fallback = ["Beef","Chicken","Dessert","Lamb","Miscellaneous","Pasta","Pork","Seafood","Side","Starter","Vegan","Vegetarian","Breakfast","Goat"];
    fallback.forEach(cat => {
      if (![...categorySelect.options].some(o => o.value === cat)) {
        categorySelect.innerHTML += `<option value="${cat}">${cat}</option>`;
      }
    });
  }

  let currentLimit = PAGE_SIZE;
  let currentQuery = null;
  let currentCategory = null;

  const loadRecipes = async (query = null, category = null, limit = currentLimit) => {
    showLoader("recipes-container");
    try {
      const recipes = category 
        ? await fetchByCategory(category, limit)
        : await fetchRecipes(query, limit);

      renderRecipes(recipes, "recipes-container");
      syncFavoriteButtons(recipes);
    } catch (err) {
      recipesContainer.innerHTML = "<p>Error cargando recetas 😔</p>";
      console.error(err);
    }
  };

  categorySelect.addEventListener("change", e => {
    currentCategory = e.target.value || null;
    currentLimit = PAGE_SIZE;
    loadRecipes(currentQuery, currentCategory, currentLimit);
  });

  const searchBtn = document.getElementById("search-btn");
  const searchInput = document.getElementById("search-input");

  [searchInput, searchBtn, categorySelect].forEach(el => el && (el.style.display = "inline-block"));

  const handleSearch = () => {
    currentQuery = searchInput.value.trim() || null;
    currentCategory = categorySelect.value || null;
    currentLimit = PAGE_SIZE;
    loadRecipes(currentQuery, currentCategory, currentLimit);
  };

  searchBtn?.addEventListener("click", handleSearch);
  searchInput?.addEventListener("keydown", e => e.key === "Enter" && (e.preventDefault(), handleSearch()));

  let loadMoreWrapper = document.getElementById("load-more-wrapper");
  if (!loadMoreWrapper) {
    loadMoreWrapper = document.createElement("div");
    loadMoreWrapper.id = "load-more-wrapper";
    loadMoreWrapper.style.cssText = "text-align:center;margin:1.2em 0";
    const btn = document.createElement("button");
    btn.id = "load-more-btn";
    btn.textContent = "Cargar más recetas";
    loadMoreWrapper.appendChild(btn);
    app.appendChild(loadMoreWrapper);
  }

  document.getElementById("load-more-btn")?.addEventListener("click", () => {
    currentLimit += PAGE_SIZE;
    loadRecipes(currentQuery, currentCategory, currentLimit);
  });

  loadRecipes(null, null, currentLimit);
}

function router() {
  const page = location.hash.slice(1) || "home";
  const app = document.getElementById("app");
  const searchInput = document.getElementById("search-input");
  const searchBtn = document.getElementById("search-btn");
  const categorySelect = document.getElementById("category-select");

  [searchInput, searchBtn, categorySelect].forEach(el => el && (el.style.display = page === "home" ? "inline-block" : "none"));

  app.innerHTML = "";
  if (page === "home") {
    loadHome();
  } else if (page === "favorites") {
    const favContainer = document.createElement("div");
    favContainer.className = "recipes-grid";
    favContainer.id = "recipes-container";
    app.appendChild(favContainer);
    renderFavorites();
  } else if (page === "contact") {
    renderContactForm();
  }

  document.querySelectorAll(".nav-link").forEach(a => a.classList.remove("active"));
  document.querySelector(`[href="#${page}"]`)?.classList.add("active");
}

window.addEventListener("hashchange", router);
document.addEventListener("DOMContentLoaded", router);
