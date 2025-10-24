// ui.js - Versión completa adaptada a la nueva rejilla y "leer más"

import { saveFavorite, getFavorites, removeFavorite, isFavorite, syncFavoriteButtons } from "./storage.js";
import { showToast } from "./utils.js";
import Recipe from "./recipe.js";

/**
 * Renderiza recetas en un contenedor específico
 * @param {Array} list - array de recetas
 * @param {string} containerId - id del contenedor donde renderizar
 */
export function renderRecipes(list, containerId = "app") {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!list || list.length === 0) {
    container.innerHTML = "<p>No se encontraron recetas 😔</p>";
    return;
  }

  // Construir HTML con lazy-loading y atributos accesibles
  const buildRecipeCard = (raw) => {
    const r = new Recipe(raw);
    // Obtener ingredientes y cantidades
    let ingredients = "";
    r.getIngredients().forEach(item => {
      ingredients += `<li>${item.ingredient} - ${item.measure}</li>`;
    });

    const favBadge = isFavorite(r.id) ? `<span class="fav-badge" aria-hidden="true">★</span>` : '';

    return `
    <div class="recipe">
      <img loading="lazy" src="${r.thumbnail}" alt="Imagen de ${r.name}" />
      <div class="content">
        <h3 class="movie-title">${r.name} ${favBadge}</h3>
        <div class="movie-sub">${r.category || "Desconocida"} • ${r.area || "Desconocida"}</div>
        <p class="instructions-preview">${r.getInstructionsPreview(120) || "No disponible"}</p>
        <ul class="ingredients-list" style="display:none" aria-hidden="true">${ingredients}</ul>
      </div>
      <div class="footer">
        <button class="read-more-btn" data-id="${r.id}" aria-expanded="false">Leer más</button>
        <button data-id="${r.id}" class="fav-btn" aria-pressed="false">❤️ Añadir</button>
      </div>
    </div>
    `;
  };

  container.innerHTML = list.map(buildRecipeCard).join("");

  // Favoritos: delegado por data-id y lista de recetas en closure
  container.querySelectorAll(".fav-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      const id = e.currentTarget.dataset.id;
      const recipeRaw = list.find(item => (new Recipe(item)).id === id);
      if (!recipeRaw) return;

      saveFavorite(recipeRaw);
      // update badges and buttons
      syncFavoriteButtons(list);
      showToast(`Receta "${(new Recipe(recipeRaw)).name}" añadida a favoritos ✅`);
    });
  });

  // Read more toggle: usar data-id para localizar receta
  container.querySelectorAll(".read-more-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      const id = e.currentTarget.dataset.id;
      const raw = list.find(item => (new Recipe(item)).id === id);
      if (!raw) return;
      const recipe = new Recipe(raw);

      const parent = e.currentTarget.closest(".recipe");
      if (!parent) return;

      const instructionsEl = parent.querySelector(".instructions-preview");
      let ingList = parent.querySelector(".ingredients-list");
      if (!ingList) {
        // create and append if missing
        ingList = document.createElement('ul');
        ingList.className = 'ingredients-list';
        ingList.style.display = 'none';
        ingList.setAttribute('aria-hidden', 'true');
        parent.querySelector('.content').appendChild(ingList);
      }

      const expanded = e.currentTarget.getAttribute('aria-expanded') === 'true';
      if (expanded) {
        // collapse
        if (instructionsEl) instructionsEl.textContent = recipe.getInstructionsPreview(120);
        e.currentTarget.textContent = "Leer más";
        e.currentTarget.setAttribute('aria-expanded', 'false');
        ingList.style.display = 'none';
        ingList.setAttribute('aria-hidden', 'true');
        parent.classList.remove('expanded');
      } else {
        // expand: fill full instructions and ingredients
        if (instructionsEl) instructionsEl.textContent = recipe.instructions || "No disponible";
        // populate ingredients list
        const ingrHtml = recipe.getIngredients().map(i => `<li>${i.ingredient} - ${i.measure}</li>`).join('');
        ingList.innerHTML = ingrHtml;
        e.currentTarget.textContent = "Leer menos";
        e.currentTarget.setAttribute('aria-expanded', 'true');
        ingList.style.display = 'block';
        ingList.setAttribute('aria-hidden', 'false');
        // mark card expanded so CSS can remove clamps and allow full content
        parent.classList.add('expanded');
      }
    });
  });
}

/**
 * Renderiza la lista de recetas favoritas
 */
export function renderFavorites() {
  const favs = getFavorites();
  const app = document.getElementById("app");
  if (favs.length === 0) {
    app.innerHTML = "<p>No tienes favoritos aún.</p>";
    return;
  }

  // Reuse the same card HTML for consistency; add a prominent remove button
  app.innerHTML = `<div class="recipes-grid">` + favs.map(f => {
    const r = new Recipe(f);
    const ingredients = r.getIngredients().map(i => `<li>${i.ingredient} - ${i.measure}</li>`).join('');
    return `
    <div class="recipe favorite">
      <img src="${r.thumbnail}" alt="${r.name}" />
      <div class="content">
        <h3 class="movie-title">${r.name} <span class="fav-badge">★</span></h3>
        <div class="movie-sub">${r.category || "Desconocida"} • ${r.area || "Desconocida"}</div>
        <ul class="ingredients-list">${ingredients}</ul>
      </div>
      <div class="footer">
        <button data-id="${r.id}" class="remove-btn btn-secondary">Eliminar</button>
      </div>
    </div>
    `;
  }).join("") + `</div>`;

  document.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      removeFavorite(e.target.dataset.id);
      // re-render both favorites and main list to sync badges
      renderFavorites();
      // if main list visible, sync buttons/badges
      try { syncFavoriteButtons(getFavorites()); } catch (err) {}
    });
  });
}

export function renderContactForm() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <h2>Contacto</h2>
    <form id="contact-form">
      <input type="text" id="name" placeholder="Nombre" required><br>
      <input type="email" id="email" placeholder="Email" required><br>

      <input type="tel" id="phone" placeholder="Número con prefijo, ej: +34 612345678" required><br>

      <textarea id="msg" placeholder="Mensaje"></textarea><br>
      <button>Enviar</button>
    </form>
    <div id="contact-feedback" style="margin-top:1em;"></div>
  `;

  const form = document.getElementById("contact-form");
  const feedback = document.getElementById("contact-feedback");
  const phoneInput = document.getElementById("phone");

  const cookingTips = [
    "Usa ingredientes frescos siempre que sea posible.",
    "Mide los ingredientes con precisión para mejores resultados.",
    "Sazona los alimentos gradualmente y prueba constantemente.",
    "Mantén limpias las superficies de trabajo y utensilios.",
    "Controla la temperatura al cocinar para evitar quemar alimentos.",
    "Prepara todos los ingredientes antes de empezar.",
    "Lee la receta completa antes de comenzar.",
    "No sobrecargues la sartén para cocinar de manera uniforme."
  ];

  form.addEventListener("submit", e => {
    e.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const phone = phoneInput.value.trim();
    const msg = form.msg.value.trim();

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Validar formato: +prefijo (1-3 dígitos) espacio número de 6-15 dígitos
    const phoneRe = /^\+([1-9]\d{0,2})\s\d{6,15}$/;

    if (!emailRe.test(email)) return showToast("Email no válido ❌");
    if (!phoneRe.test(phone)) return showToast("Número no válido ❌ (ej: +34 612345678)");

    const randomTip = cookingTips[Math.floor(Math.random() * cookingTips.length)];

    feedback.innerHTML = `
      <p>¡Gracias, <strong>${name}</strong>!</p>
      <p>Hemos recibido tu mensaje: "<em>${msg || "No escribiste nada 😅"}</em>"</p>
      <p>Te contactaremos en <strong>${email}</strong> o al número <strong>${phone}</strong>.</p>
      <p><strong>Consejo de cocina:</strong> ${randomTip}</p>
    `;

    showToast("Formulario enviado correctamente ✅");
    form.reset();
  });
}
