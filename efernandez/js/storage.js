/**
 * storage.js - Manejo de favoritos en localStorage con sincronización de UI
 */

/**
 * Obtiene la lista de favoritos desde localStorage
 * @returns {Array} - array de recetas favoritas
 */
export function getFavorites() {
  try {
    const favs = JSON.parse(localStorage.getItem("favorites"));
    return Array.isArray(favs) ? favs : [];
  } catch (err) {
    console.warn("Error leyendo favoritos desde localStorage:", err);
    return [];
  }
}

/**
 * Guarda una receta en favoritos
 * @param {Object} recipe - objeto receta a guardar
 */
export function saveFavorite(recipe) {
  if (!recipe || !recipe.idMeal) return;
  const favs = getFavorites();
  if (!favs.some(f => f.idMeal === recipe.idMeal)) {
    favs.push(recipe);
    try {
      localStorage.setItem("favorites", JSON.stringify(favs));
      syncFavoriteButtons([recipe]);
    } catch (err) {
      console.error("Error guardando favorito en localStorage:", err);
    }
  }
}

/**
 * Elimina una receta de favoritos por su ID
 * @param {string} idMeal - ID de la receta a eliminar
 */
export function removeFavorite(idMeal) {
  if (!idMeal) return;
  const favs = getFavorites().filter(r => r.idMeal !== idMeal);
  try {
    localStorage.setItem("favorites", JSON.stringify(favs));
    syncFavoriteButtons([]);
  } catch (err) {
    console.error("Error eliminando favorito en localStorage:", err);
  }
}

/**
 * Comprueba si una receta ya está en favoritos
 * @param {string} idMeal
 * @returns {boolean}
 */
export function isFavorite(idMeal) {
  if (!idMeal) return false;
  return getFavorites().some(r => r.idMeal === idMeal);
}

/**
 * Sincroniza botones de favoritos en la UI
 * @param {Array} recipes - lista de recetas visibles
 */
export function syncFavoriteButtons(recipes = []) {
  const buttons = document.querySelectorAll(".fav-btn");
  // Actualiza estado visual (texto, disabled) de botones .fav-btn según localStorage
  buttons.forEach(btn => {
    const recipeId = btn.dataset.id;
    if (!recipeId) return;

    if (isFavorite(recipeId)) {
      btn.textContent = "\u2705 Favorito";
      btn.classList.add("disabled");
      btn.disabled = true;
      btn.setAttribute('aria-pressed', 'true');
    } else {
      btn.textContent = "\u2764\ufe0f Añadir a favoritos";
      btn.classList.remove("disabled");
      btn.disabled = false;
      btn.setAttribute('aria-pressed', 'false');
    }
  });
}

/**
 * Limpia todos los favoritos
 */
export function clearFavorites() {
  try {
    localStorage.removeItem("favorites");
    syncFavoriteButtons([]);
  } catch (err) {
    console.error("Error limpiando favoritos:", err);
  }
}
