const API_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJzdW5mZWF4QGdtYWlsLmNvbSIsImp0aSI6ImU4NmZiODBlLWMyNWQtNGU0Yi05NDhlLTE5ZjY1NzUwNjAxYiIsImlzcyI6IkFFTUVUIiwiaWF0IjoxNzM4NjA5NTEzLCJ1c2VySWQiOiJlODZmYjgwZS1jMjVkLTRlNGItOTQ4ZS0xOWY2NTc1MDYwMWIiLCJyb2xlIjoiIn0.RoGfm6pXP9lxNZ_8fxf9QoeBHwgdrdLIsxWasgZNpug"; 

// Двухступенчатый запрос AEMET: сначала {datos}, затем фактический URL в datos
async function fetchForecast(idMunicipio) {
  const url = `https://opendata.aemet.es/opendata/api/prediccion/especifica/municipio/diaria/${idMunicipio}?api_key=${API_KEY}`;
  const step1 = await fetch(url);
  const meta = await step1.json();
  const step2 = await fetch(meta.datos);
  const forecastData = await step2.json();
  return forecastData; // дальше разберёшь в нужный вид
}


// Загрузка и кэширование списка муниципалитетов
async function loadMunicipios() {
  const base = `https://opendata.aemet.es/opendata/api/maestro/municipios?api_key=${API_KEY}`;
  const step1 = await fetch(base);
  const meta = await step1.json();
  const step2 = await fetch(meta.datos);
  const listMunicipios = await step2.json();

  return listMunicipios;
}

const app = (async () => {        // ← добавили async
  const list = await loadMunicipios();   // ← const
  const madrid = list.find(m => m.nombre === "Madrid"); // тестово
  const forecast = await fetchForecast(madrid.id);

  console.log(list);
  console.log(forecast);
})(); // ← вызываем немедленно
