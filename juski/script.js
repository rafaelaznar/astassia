const API_KEY = "YOUR_OPENWEATHER_API_KEY";

const selectors = {
  form: "#weatherForm",
  city: "#city",
  days: "#days",
  results: "#results",
  alert: "#alert",
  loading: "#loading",
  clearBtn: "#clearBtn",
};

const $form = $(selectors.form);
const $city = $(selectors.city);
const $days = $(selectors.days);
const $results = $(selectors.results);
const $alert = $(selectors.alert);
const $loading = $(selectors.loading);
const $clearBtn = $(selectors.clearBtn);

function resetAlert() {
  $alert.addClass("d-none").removeClass("alert-warning alert-danger alert-info alert-success").text("");
}

function showAlert(message, type = "warning") {
  $alert
    .removeClass("d-none alert-warning alert-danger alert-info alert-success")
    .addClass(`alert-${type}`)
    .text(message);
}

function toggleLoading(show) {
  $loading.toggleClass("d-none", !show);
}

function clearResults() {
  $results.empty();
}

async function geocodeCity(cityName) {
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${API_KEY}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Ошибка геокодинга OpenWeather");
  }

  const data = await response.json();
  return data?.[0] ?? null;
}

async function fetchForecast(lat, lon) {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    units: "metric",
    lang: "ru",
    appid: API_KEY,
  });

  const url = `https://api.openweathermap.org/data/2.5/forecast?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Ошибка загрузки прогноза OpenWeather");
  }

  return response.json();
}

function buildDailyForecast(data, limitDays) {
  const timezoneOffset = data?.city?.timezone ?? 0;
  const grouped = new Map();

  data.list.forEach((entry) => {
    const localDate = new Date((entry.dt + timezoneOffset) * 1000);
    const key = localDate.toISOString().split("T")[0];
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(entry);
  });

  return Array.from(grouped.entries())
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .slice(0, limitDays)
    .map(([key, entries]) => {
      const middayEntry =
        entries.find((item) => item.dt_txt.includes("12:00:00")) ?? entries[0];

      const temps = entries.map((item) => item.main.temp);
      const minTemp = Math.min(...temps);
      const maxTemp = Math.max(...temps);

      const humidityAvg = Math.round(
        entries.reduce((sum, item) => sum + item.main.humidity, 0) / entries.length
      );

      const windAvg = (
        entries.reduce((sum, item) => sum + item.wind.speed, 0) / entries.length
      ).toFixed(1);

      const rainProbability = Math.round(
        Math.max(...entries.map((item) => item.pop ?? 0)) * 100
      );

      const date = new Date((middayEntry.dt + timezoneOffset) * 1000);
      const formattedDate = date.toLocaleDateString("ru-RU", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });

      const { icon, description } = middayEntry.weather[0];

      return {
        key,
        formattedDate,
        icon,
        description: description.charAt(0).toUpperCase() + description.slice(1),
        minTemp: Math.round(minTemp),
        maxTemp: Math.round(maxTemp),
        feelsLike: Math.round(middayEntry.main.feels_like),
        humidity: humidityAvg,
        wind: windAvg,
        rainProbability,
      };
    });
}

function renderForecastCards(cityLabel, days) {
  clearResults();

  const header = `
    <div class="col-12">
      <div class="forecast-header shadow-sm p-3 mb-3 rounded bg-light">
        <h2 class="h5 mb-1">${cityLabel}</h2>
        <p class="text-muted mb-0">Прогноз от OpenWeather на ближайшие дни</p>
      </div>
    </div>`;

  $results.append(header);

  days.forEach((day) => {
    const card = `
      <div class="col-12 col-md-6 col-lg-4">
        <article class="card forecast-card h-100 border-0 shadow-sm">
          <div class="card-body d-flex flex-column">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <p class="text-uppercase text-muted small mb-1">${day.formattedDate}</p>
                <h3 class="h4 mb-2">${day.maxTemp}° / ${day.minTemp}°C</h3>
                <p class="mb-0 fw-medium">${day.description}</p>
              </div>
              <img src="https://openweathermap.org/img/wn/${day.icon}@2x.png" alt="${day.description}" class="weather-icon" />
            </div>
            <dl class="row small mt-3 mb-0 g-2">
              <div class="col-6">
                <dt class="text-muted">Ощущается</dt>
                <dd class="mb-0">${day.feelsLike}°C</dd>
              </div>
              <div class="col-6">
                <dt class="text-muted">Влажность</dt>
                <dd class="mb-0">${day.humidity}%</dd>
              </div>
              <div class="col-6">
                <dt class="text-muted">Ветер</dt>
                <dd class="mb-0">${day.wind} м/с</dd>
              </div>
              <div class="col-6">
                <dt class="text-muted">Осадки</dt>
                <dd class="mb-0">${day.rainProbability}%</dd>
              </div>
            </dl>
          </div>
        </article>
      </div>`;

    $results.append(card);
  });
}

async function handleSubmit(event) {
  event.preventDefault();

  resetAlert();
  clearResults();

  const cityValue = $city.val().trim();
  const daysValue = Number($days.val());

  if (!API_KEY || API_KEY === "YOUR_OPENWEATHER_API_KEY") {
    showAlert("Пожалуйста, укажите ваш ключ OpenWeather в файле script.js", "info");
    return;
  }

  if (!cityValue) {
    showAlert("Введите название города", "warning");
    return;
  }

  toggleLoading(true);

  try {
    const geo = await geocodeCity(cityValue);

    if (!geo) {
      showAlert("Город не найден. Попробуйте уточнить запрос", "warning");
      return;
    }

    const forecast = await fetchForecast(geo.lat, geo.lon);

    if (!forecast?.list?.length) {
      showAlert("OpenWeather не вернул прогноз для указанного города", "warning");
      return;
    }

    const days = buildDailyForecast(forecast, daysValue);

    if (!days.length) {
      showAlert("Не удалось подготовить прогноз", "warning");
      return;
    }

    const cityLabel = `${forecast.city.name}, ${forecast.city.country}`;
    renderForecastCards(cityLabel, days);
  } catch (error) {
    console.error(error);
    showAlert("Произошла ошибка при загрузке данных", "danger");
  } finally {
    toggleLoading(false);
  }
}

function handleClear() {
  resetAlert();
  clearResults();
  $city.val("");
}

$form.on("submit", handleSubmit);
$clearBtn.on("click", handleClear);

