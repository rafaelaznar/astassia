$(function () {
  const API_KEY = "2e2b8c25ee5e15fcc1c88ca44137d17d";
  const GEO_BASE_URL = "https://api.openweathermap.org/geo/1.0/direct";
  const FORECAST_BASE_URL = "https://api.openweathermap.org/data/2.5/forecast";

  const $form = $("#weatherForm");
  const $city = $("#city");
  const $days = $("#days");
  const $alert = $("#alert");
  const $loading = $("#loading");
  const $results = $("#results");
  const $clear = $("#clearBtn");

  function toggleLoading(isLoading) {
    if ($loading.length) {
      $loading.toggleClass("d-none", !isLoading);
    }
    const $submit = $form.find("[type='submit']");
    if ($submit.length) {
      $submit.prop("disabled", isLoading);
    }
  }

  function showAlert(message) {
    if (!$alert.length) return;
    $alert.text(message).removeClass("d-none");
  }

  function hideAlert() {
    if (!$alert.length) return;
    $alert.addClass("d-none").text("");
  }

  function geocodeCity(city) {
    return $.ajax({
      url: GEO_BASE_URL,
      method: "GET",
      data: {
        q: city,
        limit: 1,
        appid: API_KEY,
      },
      dataType: "json",
    }).then(function (data) {
      if (!$.isArray(data) || data.length === 0) {
        return $.Deferred().reject({
          message: "Ciudad no encontrada. Verifique la ortografía e inténtelo de nuevo.",
        });
      }
      return data[0];
    }, function () {
      return $.Deferred().reject({
        message: "No se pudieron obtener las coordenadas de la ciudad",
      });
    });
  }

  function fetchForecast(lat, lon) {
    return $.ajax({
      url: FORECAST_BASE_URL,
      method: "GET",
      data: {
        lat: String(lat),
        lon: String(lon),
        appid: API_KEY,
        units: "metric",
        lang: "es",
      },
      dataType: "json",
    }).then(
      function (data) {
        return data;
      },
      function () {
        return $.Deferred().reject({
          message: "No se pudo obtener el pronóstico del tiempo",
        });
      }
    );
  }

  function extractDailyForecast(list, days) {
    if (!$.isArray(list) || list.length === 0) {
      return [];
    }

    const grouped = list.reduce(function (acc, item) {
      const date = item.dt_txt.split(" ")[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(item);
      return acc;
    }, {});

    return Object.keys(grouped)
      .sort()
      .slice(0, days)
      .map(function (date) {
        const entries = grouped[date];
        const pivot =
          entries.find(function (entry) {
            return entry.dt_txt.indexOf("12:00:00") !== -1;
          }) ||
          entries[Math.floor(entries.length / 2)] ||
          entries[0];

        const temps = entries.map(function (entry) {
          return entry.main.temp;
        });
        const min = Math.min.apply(null, temps);
        const max = Math.max.apply(null, temps);

        return {
          date: date,
          description:
            pivot.weather && pivot.weather[0] ? pivot.weather[0].description : "",
          icon: pivot.weather && pivot.weather[0] ? pivot.weather[0].icon : "",
          tempMin: min,
          tempMax: max,
          humidity: pivot.main ? pivot.main.humidity : null,
          windSpeed: pivot.wind ? pivot.wind.speed : null,
        };
      });
  }

  function formatDateLabel(dateString) {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }

  function renderForecast(location, daily) {
    if (!$results.length) return;

    $results.empty();

    if (!daily.length) {
      showAlert("No se pudo generar el pronóstico para la cantidad de días seleccionados.");
      return;
    }

    const headerHtml =
      '<div class="col-12">' +
      '<h2 class="h4">Pronóstico para ' +
      location.name +
      (location.state ? ", " + location.state : "") +
      ", " +
      location.country +
      "</h2></div>";
    $results.append(headerHtml);

    daily.forEach(function (day) {
      const iconHtml = day.icon
        ? '<img src="https://openweathermap.org/img/wn/' +
          day.icon +
          '@2x.png" alt="' +
          day.description +
          '" class="weather-icon position-absolute top-0 end-0 me-3 mt-3" width="64" height="64" />'
        : "";

      const cardHtml =
        '<div class="col-12 col-md-4">' +
        '<div class="card h-100 position-relative forecast-card" data-bs-toggle="modal" data-bs-target="#weatherModal" data-day=\'' + JSON.stringify(day) + '\'>' +
        iconHtml +
        '<div class="card-body">' +
        '<h3 class="h5 card-title text-capitalize">' +
        formatDateLabel(day.date) +
        "</h3>" +
        '<p class="card-text text-muted text-capitalize mb-3">' +
        day.description +
        "</p>" +
        '<p class="card-text fw-semibold mb-2">Temperatura: ' +
        Math.round(day.tempMin) +
        "°C … " +
        Math.round(day.tempMax) +
        "°C</p>" +
        '<p class="card-text mb-0">Humedad: ' +
        (day.humidity != null ? day.humidity : "—") +
        "%<br />Viento: " +
        (day.windSpeed != null ? Number(day.windSpeed).toFixed(1) : "—") +
        " m/s</p>" +
        "</div></div></div>";

      $results.append(cardHtml);
    });
    
    $(document).off('click', '.forecast-card').on('click', '.forecast-card', function() {
      const dayData = $(this).data('day');
      const modalContent = `
        <div class="d-flex flex-column align-items-center">
          <h4 class="text-center mb-4">${formatDateLabel(dayData.date)}</h4>
          <img src="https://openweathermap.org/img/wn/${dayData.icon}@2x.png" alt="${dayData.description}" class="mb-3" width="100" height="100" />
          <h5 class="text-capitalize text-center">${dayData.description}</h5>
          <div class="w-100 mt-4">
            <div class="row">
              <div class="col-6">
                <p class="mb-1"><strong>Temp. Máxima:</strong></p>
                <p class="fs-5 text-primary">${Math.round(dayData.tempMax)}°C</p>
              </div>
              <div class="col-6">
                <p class="mb-1"><strong>Temp. Mínima:</strong></p>
                <p class="fs-5 text-primary">${Math.round(dayData.tempMin)}°C</p>
              </div>
            </div>
            <div class="row mt-3">
              <div class="col-6">
                <p class="mb-1"><strong>Humedad:</strong></p>
                <p class="fs-6">${dayData.humidity != null ? dayData.humidity : "—"}%</p>
              </div>
              <div class="col-6">
                <p class="mb-1"><strong>Viento:</strong></p>
                <p class="fs-6">${dayData.windSpeed != null ? Number(day.windSpeed).toFixed(1) : "—"} m/s</p>
              </div>
            </div>
          </div>
        </div>
      `;
      $('#modalWeatherContent').html(modalContent);
    });
  }
  
  // Initialize modal event handlers after the DOM is fully loaded
  $(document).ready(function() {
    // Use event delegation to handle clicks on forecast cards that may be added later
    $(document).on('click', '.forecast-card', function() {
      const dayData = $(this).data('day');
      if(dayData) {
        const modalContent = `
          <div class="d-flex flex-column align-items-center">
            <h4 class="text-center mb-4">${formatDateLabel(dayData.date)}</h4>
            <img src="https://openweathermap.org/img/wn/${dayData.icon}@2x.png" alt="${dayData.description}" class="mb-3" width="10" height="100" />
            <h5 class="text-capitalize text-center">${dayData.description}</h5>
            <div class="w-100 mt-4">
              <div class="row">
                <div class="col-6">
                  <p class="mb-1"><strong>Temp. Máxima:</strong></p>
                  <p class="fs-5 text-primary">${Math.round(dayData.tempMax)}°C</p>
                </div>
                <div class="col-6">
                  <p class="mb-1"><strong>Temp. Mínima:</strong></p>
                  <p class="fs-5 text-primary">${Math.round(dayData.tempMin)}°C</p>
                </div>
              <div class="row mt-3">
                <div class="col-6">
                  <p class="mb-1"><strong>Humedad:</strong></p>
                  <p class="fs-6">${dayData.humidity != null ? dayData.humidity : "—"}%</p>
                </div>
                <div class="col-6">
                  <p class="mb-1"><strong>Viento:</strong></p>
                  <p class="fs-6">${dayData.windSpeed != null ? Number(day.windSpeed).toFixed(1) : "—"} m/s</p>
                </div>
              </div>
            </div>
          </div>
        `;
        $('#modalWeatherContent').html(modalContent);
      }
    });
  });

  if ($clear.length) {
    $clear.on("click", function () {
      if ($form.length && $form[0]) {
        $form[0].reset();
      }
      $results.empty();
      hideAlert();
    });
  }

  if ($form.length) {
    $form.on("submit", function (event) {
      event.preventDefault();
      hideAlert();

      $("#intro").addClass("d-none");

      const city = ($city.val() || "").trim();
      const daysValue = parseInt($days.val(), 10);
      const days = Number.isInteger(daysValue) && daysValue > 0 ? daysValue : 5;

      if (!city) {
        showAlert("Ingrese el nombre de la ciudad.");
        return;
      }

      toggleLoading(true);
      $results.empty();

      geocodeCity(city)
        .then(function (location) {
          return fetchForecast(location.lat, location.lon).then(function (forecast) {
            return { location: location, forecast: forecast };
          });
        })
        .then(function (payload) {
          const daily = extractDailyForecast(payload.forecast.list, days);
          renderForecast(payload.location, daily);
        })
        .fail(function (error) {
          console.error(error);
          showAlert(error && error.message ? error.message : "Ocurrió un error inesperado.");
        })
        .always(function () {
          toggleLoading(false);
        });
    });
  } else {
    console.error("Formulario de clima no encontrado.");
  }

  $("#useLocation").on("click", function () {
    if (!navigator.geolocation) {
      showAlert("La geolocalización no es compatible con su navegador.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      function (pos) {
        const { latitude, longitude } = pos.coords;
        toggleLoading(true);

        $.ajax({
          url: "https://api.openweathermap.org/geo/1.0/reverse",
          data: {
            lat: latitude,
            lon: longitude,
            limit: 1,
            appid: API_KEY,
          },
          dataType: "json",
        })
          .then(function (geoData) {
            const place =
              Array.isArray(geoData) && geoData.length > 0 ? geoData[0] : null;
            const location = {
              name: place?.name || "Ubicación desconocida",
              state: place?.state || "",
              country: place?.country || "",
            };

            return fetchForecast(latitude, longitude).then((forecast) => ({
              location,
              forecast,
            }));
          })
          .then(function ({ location, forecast }) {
            const daily = extractDailyForecast(forecast.list, 5);
            renderForecast(location, daily);
            $("#intro").addClass("d-none");
          })
          .fail(function (err) {
            console.error(err);
            showAlert(err.message || "Error al obtener el pronóstico o la ubicación.");
          })
          .always(function () {
            toggleLoading(false);
          });
      },
      function () {
        showAlert("No se pudo obtener su ubicación.");
      }
    );
  });
});
