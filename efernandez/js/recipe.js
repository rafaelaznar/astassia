// recipe.js - Clase ES6 para encapsular una receta y sus utilidades
export default class Recipe {
  constructor(data = {}) {
    this.data = data;
  }

  get id() {
    return this.data.idMeal || '';
  }

  get name() {
    return this.data.strMeal || '';
  }

  get thumbnail() {
    return this.data.strMealThumb || '';
  }

  get category() {
    return this.data.strCategory || '';
  }

  get area() {
    return this.data.strArea || '';
  }

  getInstructionsPreview(length = 100) {
    const txt = this.data.strInstructions || '';
    return txt.length > length ? txt.slice(0, length) + '...' : txt;
  }

  get instructions() {
    return this.data.strInstructions || '';
  }

  getIngredients() {
    const list = [];
    for (let i = 1; i <= 20; i++) {
      const ing = this.data[`strIngredient${i}`];
      const measure = this.data[`strMeasure${i}`];
      if (ing && ing.trim()) list.push({ ingredient: ing.trim(), measure: (measure || '').trim() });
    }
    return list;
  }

  toJSON() {
    return this.data;
  }
}
