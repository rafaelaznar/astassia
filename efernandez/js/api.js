/**
 * api.js - Módulo para interactuar con la API TheMealDB
 * Contiene funciones para obtener recetas, categorías y detalles por ID.
 */

const BASE_URL = "https://www.themealdb.com/api/json/v1/1";

/**
 * Hace fetch a la API y devuelve JSON, lanzando error si falla
 * @param {string} endpoint
 * @returns {Promise<any>}
 */
async function apiFetch(endpoint) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`);
    if (!res.ok) throw new Error(`Error en fetch: ${res.status} ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.error(`apiFetch error en endpoint ${endpoint}:`, err);
    throw err;
  }
}

/**
 * Obtiene los detalles completos de una receta por ID
 * @param {string|number} idMeal
 * @returns {Promise<Object|null>}
 */
export async function fetchRecipeById(idMeal) {
  if (!idMeal) return null;
  try {
    const data = await apiFetch(`/lookup.php?i=${encodeURIComponent(idMeal)}`);
    return data.meals?.[0] || null;
  } catch (err) {
    console.error(`fetchRecipeById error (${idMeal}):`, err);
    return null;
  }
}

/**
 * Obtiene recetas desde la API
 * @param {string|null} query - nombre de la receta para buscar
 * @param {number} limit - máximo número de recetas a devolver
 * @returns {Promise<Array>} - array de recetas
 */
export async function fetchRecipes(query = null, limit = 20) {
  let recipes = [];

  if (query) {
    try {
      const data = await apiFetch(`/search.php?s=${encodeURIComponent(query)}`);
      recipes = data.meals || [];
    } catch (err) {
      console.error("fetchRecipes query error:", err);
    }
  } else {
    try {
      const categoriesData = await apiFetch("/list.php?c=list");
      const categories = Array.isArray(categoriesData.meals)
        ? categoriesData.meals.map(c => c.strCategory).filter(Boolean)
        : [];

      const seenIds = new Set();
      const batchSize = 6; // número de requests en paralelo para detalles

      for (const category of categories) {
        if (recipes.length >= limit) break;

        try {
          const catData = await apiFetch(`/filter.php?c=${encodeURIComponent(category)}`);
          if (!Array.isArray(catData.meals)) continue;

          // Filtrar y limitar ids únicos
          const ids = catData.meals
            .map(m => m.idMeal)
            .filter(id => !seenIds.has(id))
            .slice(0, Math.max(0, limit - recipes.length));

          ids.forEach(id => seenIds.add(id));

          // Procesar en lotes con concurrency limitada
          for (let i = 0; i < ids.length; i += batchSize) {
            const chunk = ids.slice(i, i + batchSize);
            const promises = chunk.map(id => fetchRecipeById(id).catch(err => null));
            const results = await Promise.all(promises);
            for (const fullMeal of results) {
              if (fullMeal) {
                recipes.push(fullMeal);
                if (recipes.length >= limit) break;
              }
            }
            if (recipes.length >= limit) break;
          }
        } catch (err) {
          console.warn(`Error cargando categor\u00eda ${category}:`, err);
        }
      }
    } catch (err) {
      console.error("fetchRecipes all categories error:", err);
    }
  }

  return recipes.slice(0, limit);
}

/**
 * Obtiene recetas por categoría
 * @param {string} category
 * @param {number} limit - máximo número de recetas a devolver
 * @returns {Promise<Array>} - array de recetas
 */
export async function fetchByCategory(category, limit = 20) {
  if (!category) return [];
  try {
    const data = await apiFetch(`/filter.php?c=${encodeURIComponent(category)}`);
    if (!Array.isArray(data.meals)) return [];
    const results = [];
    for (const meal of data.meals) {
      if (results.length >= limit) break;
      const fullMeal = await fetchRecipeById(meal.idMeal);
      if (fullMeal) results.push(fullMeal);
    }
    return results;
  } catch (err) {
    console.error(`fetchByCategory error (${category}):`, err);
    return [];
  }
}

/**
 * Obtiene lista de categorías
 * @returns {Promise<Array>} - array de strings
 */
export async function fetchCategories() {
  try {
    const data = await apiFetch("/list.php?c=list");
    return Array.isArray(data.meals)
      ? data.meals.map(c => c.strCategory).filter(Boolean)
      : [];
  } catch (err) {
    console.error("fetchCategories error:", err);
    return [];
  }
}
