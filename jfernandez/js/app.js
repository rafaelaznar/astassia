// js/app.js
$(document).ready(function () {
    // API key: preferir `window.SR.config.apiKey` (no subir a git). Si no existe, usar el valor por defecto
    const apiKey = (window.SR && window.SR.config && window.SR.config.apiKey && window.SR.config.apiKey !== 'TU_API_KEY_AQUI')
        ? window.SR.config.apiKey
        : 'ec625885'; // valor por defecto para pruebas locales (reemplazar localmente)

    /************* User Module *************/
    const userModule = (() => {
        const $userForm = $('#user-form');
        const $username = $('#user-name');
        const $userGenre = $('#user-genre');
        const $userPlatform = $('#user-platform');
        const $userMsg = $('#user-msg');

        let userData = { name: '', genre: '', platform: '' };

        const loadUser = () => {
            try {
                const saved = JSON.parse(localStorage.getItem('sr_user_data') || 'null');
                if (saved) userData = saved;
            } catch (e) {}
        };

        const saveUser = () => {
            try { localStorage.setItem('sr_user_data', JSON.stringify(userData)); } catch (e) {}
        };

        const init = () => {
            loadUser();
            if (!$userForm.length) return;

            $username.val(userData.name);
            $userGenre.val(userData.genre);
            $userPlatform.val(userData.platform);

            $userForm.on('submit', e => {
                e.preventDefault();
                userData.name = $username.val().trim();
                userData.genre = $userGenre.val().trim();
                userData.platform = $userPlatform.val().trim();
                saveUser();
                $userMsg.text('Datos guardados. Tu experiencia será personalizada.');

                try {
                    if (userData.genre && movieModule.filterByGenre) {
                        movieModule.filterByGenre(userData.genre);
                    }
                } catch (e) {}
            });
        };

        return { init, getData: () => userData };
    })();

    /************* Movie Module *************/
    const movieModule = (() => {
        const $movieList = $('#movie-list');
        const $movieDetails = $('#movie-details');
        const $spinner = $('#spinner');
        const $errorMsg = $('#error-msg');
        const $noResults = $('#no-results');
        const $movieForm = $('#movie-form');
        const $movieInput = $('#movie-input');
        const $filterYear = $('#filter-year');

        let latestLoadedMovies = [];

        const setBusy = busy => {
            $movieList.attr('aria-busy', busy ? 'true' : 'false');
            $spinner.toggleClass('hidden', !busy).attr('aria-hidden', !busy);
        };

        const renderMovies = movies => {
            $movieList.empty();
            $movieDetails.empty();
            if (!movies || movies.length === 0) return $noResults.removeClass('hidden');

            $noResults.addClass('hidden');
            const preferredGenre = userModule.getData().genre?.toLowerCase();

            // Aplicar sorting seleccionado por el usuario
            movies = applySort(movies);

            // Mantener solo las películas cuyas imágenes carguen correctamente
            const loadedMovies = [];

            movies.forEach(movie => {
                if (!movie.Poster || movie.Poster === 'N/A') return; // no hay póster

                // Preload image and append only on successful load
                const img = new Image();
                img.onload = function() {
                    const highlight = preferredGenre && movie.Genre?.toLowerCase().includes(preferredGenre);
                    const $li = $('<li>').addClass('movie-item fade-in').attr({ tabindex: 0, role: 'listitem' }).data('imdb', movie.imdbID);
                    const $img = $('<img>').attr({ src: movie.Poster, alt: movie.Title, loading: 'lazy' });
                    // Show only image + title in the list for a clean catalog view
                    const $meta = $('<div>').addClass('movie-meta');
                    const $metaContent = $('<div>').addClass('meta-content simple-list');
                    const $titleDiv = $('<div>').addClass('movie-title').text(movie.Title || 'Sin título');
                    $metaContent.append($titleDiv);
                    $meta.append($metaContent);
                    if (highlight) $li.css('border', '2px solid var(--accent-2)');

                    // append and wire events: clicking list item opens details + game
                    $li.append($img, $meta);
                    $li.on('click keydown', e => {
                        if (e.type === 'click' || e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            showDetails(movie.imdbID);
                            gameModule.setMovieForGame(movie);
                        }
                    });
                    $movieList.append($li);
                    loadedMovies.push(movie);
                    // actualizar cache con las películas que realmente se muestran
                    latestLoadedMovies = loadedMovies.slice();
                };
                img.onerror = function() {
                    // imagen rota -> no mostrar la película (silencioso)
                };
                // iniciar carga
                img.src = movie.Poster;
            });

            // Si ninguna imagen se carga, mostrar mensaje
            // (esperamos brevemente a que carguen; si no hay posters válidos, no se añadirá ningún li)
            setTimeout(() => {
                if ($movieList.children().length === 0) {
                    $noResults.removeClass('hidden');
                    $errorMsg.text('No se encontraron resultados con pósters válidos.');
                }
            }, 400);

            const name = userModule.getData().name;
            if (name) $errorMsg.text(`Hola ${name}, aquí tienes tus resultados personalizados:`);
        };

        // applySort: reorder movies according to user's selection
        const applySort = (movies) => {
            if (!Array.isArray(movies)) return [];
            const mode = $('#sort-select').val() || 'relevance';
            const copy = movies.slice();
            switch (mode) {
                case 'title-asc':
                    return copy.sort((a,b) => (a.Title||'').localeCompare(b.Title||'', undefined, {sensitivity:'base'}));
                case 'title-desc':
                    return copy.sort((a,b) => (b.Title||'').localeCompare(a.Title||'', undefined, {sensitivity:'base'}));
                case 'year-asc':
                    return copy.sort((a,b) => (parseInt(a.Year,10)||0) - (parseInt(b.Year,10)||0));
                case 'year-desc':
                    return copy.sort((a,b) => (parseInt(b.Year,10)||0) - (parseInt(a.Year,10)||0));
                case 'rating-desc':
                    return copy.sort((a,b) => (parseFloat(b.imdbRating)||0) - (parseFloat(a.imdbRating)||0));
                case 'relevance':
                default:
                    return copy; // leave as returned by OMDb
            }
        };

        const filterByGenre = genre => {
            if (!genre) return;
            const g = genre.toLowerCase().trim();
            const filtered = latestLoadedMovies.filter(m => m.Genre?.toLowerCase().includes(g));
            if (filtered.length) renderMovies(filtered);
            else {
                $movieList.empty();
                $noResults.removeClass('hidden');
                $errorMsg.text(`No se encontraron películas locales para el género "${genre}".`);
            }
        };

        const showDetails = id => {
            setBusy(true);
            if (!apiKey) return $errorMsg.text('API key no configurada.');

            $.getJSON(`https://www.omdbapi.com/?apikey=${apiKey}&i=${id}&plot=full`)
                .done(data => {
                    setBusy(false);
                    if (data.Response === 'True') renderDetails(data);
                    else $errorMsg.text(data.Error || 'No se pudieron obtener detalles.');
                })
                .fail(() => { setBusy(false); $errorMsg.text('Error al obtener detalles.'); });
        };

        const renderDetails = m => {
            $movieDetails.empty();
            const poster = m.Poster && m.Poster !== 'N/A' ? m.Poster : '';
            const $card = $('<div>').addClass('card fade-in');
            const $title = $('<h2>').text(`${m.Title} `).append($('<small>').addClass('small').text(`(${m.Year})`));
            const $container = $('<div>').css({ display: 'flex', gap: '1rem', alignItems: 'flex-start' });
            const $img = poster ? $('<img>').attr({ src: poster, alt: m.Title, loading: 'lazy', style: 'width:150px;height:auto;border-radius:6px' }) : '';
            const $meta = $('<div>')
                .append($('<p>').html('<strong>Género:</strong> ' + (m.Genre || 'N/A')))
                .append($('<p>').html('<strong>Rating:</strong> ' + (m.imdbRating || 'N/A')))
                .append($('<p>').html('<strong>Duración:</strong> ' + (m.Runtime || 'N/A')))
                .append($('<p>').html('<strong>Sinopsis:</strong> ' + (m.Plot || 'N/A')));
            if ($img) $container.append($img);
            $container.append($meta);
            $card.append($title, $container);
            $movieDetails.append($card).attr('tabindex', -1).focus();
        };

        const searchMovies = (title, year, options = {}) => {
            const validar = window.SR?.helpers?.validarTitulo || (() => true);
            if (!validar(title)) return $errorMsg.text('Título inválido.');

            $errorMsg.text('');
            setBusy(true);
            $movieDetails.empty();
            $noResults.addClass('hidden');

            let url = `https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(title)}`;
            if (options.type) url += `&type=${encodeURIComponent(options.type)}`;
            if (year) url += `&y=${year}`;

            $.getJSON(url)
                .done(data => {
                    setBusy(false);
                    if (data.Response === "True") {
                        const promises = data.Search.map(m => $.getJSON(`https://www.omdbapi.com/?apikey=${apiKey}&i=${m.imdbID}`));
                        $.when(...promises).done(function (...results) {
                            let movies = results.map(r => r[0]).filter(m => m?.Response === 'True');

                            if (options.yearTo) {
                                const from = parseInt(year, 10) || 0;
                                const to = parseInt(options.yearTo, 10) || 9999;
                                movies = movies.filter(m => {
                                    const y = parseInt(m.Year?.slice(0, 4), 10) || 0;
                                    return y >= from && y <= to;
                                });
                            }
                            if (options.genre) {
                                const g = options.genre.toLowerCase().trim();
                                movies = movies.filter(m => m.Genre?.toLowerCase().includes(g));
                            }
                            latestLoadedMovies = movies.slice();
                            renderMovies(movies);
                        });
                    } else {
                        $movieList.empty(); $noResults.removeClass('hidden'); $errorMsg.text(data.Error || 'No se encontraron resultados.');
                    }
                })
                .fail(() => { setBusy(false); $errorMsg.text('Error en la conexión con la API.'); });
        };

        const init = () => {
            // carga inicial: intentar obtener ~20 películas reales con años correctos
            setBusy(true);
            if (!apiKey) { setBusy(false); $errorMsg.text('API key no configurada.'); return; }

            const desired = 20;
            const terms = ['the','love','man','woman','life','war','dark','day','night','new','last','lost','king','story'];
            const ids = new Set();

            // Fetch search results sequentially until we collect enough unique imdbIDs
            const fetchSearchTerm = (i) => {
                if (ids.size >= desired || i >= terms.length) {
                    const selected = Array.from(ids).slice(0, desired);
                    if (selected.length === 0) { setBusy(false); $errorMsg.text('No se encontraron películas iniciales.'); return; }
                    const detailPromises = selected.map(id => $.getJSON(`https://www.omdbapi.com/?apikey=${apiKey}&i=${id}&plot=short`));
                    $.when(...detailPromises).done(function (...results) {
                        let movies = results.map(r => r[0]).filter(m => m?.Response === 'True');
                        latestLoadedMovies = movies.slice();
                        setBusy(false);
                        renderMovies(movies);
                    }).fail(() => { setBusy(false); $errorMsg.text('No se pudieron cargar detalles de películas iniciales.'); });
                    return;
                }

                const term = terms[i];
                $.getJSON(`https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(term)}&type=movie&page=1`)
                    .done(data => {
                        if (data.Response === 'True' && Array.isArray(data.Search)) {
                            data.Search.forEach(s => ids.add(s.imdbID));
                        }
                        // Try a second page if available
                        if (data.totalResults && parseInt(data.totalResults, 10) > 10 && ids.size < desired) {
                            $.getJSON(`https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(term)}&type=movie&page=2`)
                                .done(data2 => { if (data2.Response === 'True' && Array.isArray(data2.Search)) data2.Search.forEach(s => ids.add(s.imdbID)); fetchSearchTerm(i+1); })
                                .fail(() => fetchSearchTerm(i+1));
                        } else {
                            fetchSearchTerm(i+1);
                        }
                    })
                    .fail(() => fetchSearchTerm(i+1));
            };

            fetchSearchTerm(0);

            // No ocultamos automáticamente el formulario al iniciar.
            // Añadimos un control visible para permitir mostrar/ocultar la búsqueda.
            $('#toggle-search').on('click', function(){
                const $form = $movieForm;
                const expanded = $(this).attr('aria-expanded') === 'true';
                if(expanded) {
                    $form.addClass('hidden');
                    $(this).text('Mostrar búsqueda').attr('aria-expanded','false');
                } else {
                    $form.removeClass('hidden');
                    $(this).text('Ocultar búsqueda').attr('aria-expanded','true');
                }
            });

            // búsqueda avanzada toggle
            $('#toggle-advanced').on('click', function () {
                const $adv = $('#advanced-form');
                const expanded = $(this).attr('aria-expanded') === 'true';
                $(this).attr('aria-expanded', expanded ? 'false' : 'true');
                $adv.toggleClass('hidden').attr('aria-hidden', expanded ? 'true' : 'false');
            });

            $movieForm.on('submit', e => {
                e.preventDefault();
                const title = $movieInput.val().trim();
                const year = $filterYear.val().trim();
                const yearTo = $('#filter-year-to').val()?.trim();
                const genre = $('#filter-genre').val()?.trim();
                const type = $('#filter-type').val();
                searchMovies(title, year, { yearTo, genre, type });
            });

            // Sorting: re-render current results when user changes the sort order
            $('#sort-select').on('change', function () {
                if (latestLoadedMovies && latestLoadedMovies.length) {
                    renderMovies(latestLoadedMovies.slice());
                }
            });

            // sorting UI removed - no reordering needed
        };

        return { init, searchMovies, showDetails, filterByGenre };
    })();

    /************* Game Module (avanzado) *************/
    const gameModule = (() => {
        const $gameCard = $('#game-card');
        const $gamePrompt = $('#game-prompt');
        const $gameGuess = $('#game-guess');
        const $gameSubmit = $('#game-submit');
        const $gameFeedback = $('#game-feedback');
        const $gameNext = $('#game-next');
        const $gameReset = $('#game-reset');
        const $gameScoreVal = $('#game-score-val');

        // Dynamic UI elements (will be created inside $gameCard)
        let $timerEl = null;
        let $difficultyEl = null;
        let $hintBtn = null;
        let $leaderboardEl = null;

        // game state
        let state = {
            movie: null,
            score: 0,
            attempts: [],
            streak: 0,
            round: 0,
            timeLeft: 0,
            timerId: null,
            hintsLeft: 0,
            difficulty: 'medium',
            mode: 'year' // 'year' | 'director' | 'area' | 'multiple'
        };

        const DIFFICULTY = {
            easy: { time: 45, hints: 3, name: 'Fácil' },
            medium: { time: 30, hints: 2, name: 'Normal' },
            hard: { time: 15, hints: 1, name: 'Difícil' }
        };

        const MODES = ['year', 'director', 'area', 'multiple'];

        // util: create UI controls inside game card
        const ensureUI = () => {
            if ($timerEl) return;
            const $controls = $('<div>').addClass('game-controls').css({ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '.5rem' });
            $timerEl = $('<span>').attr('id', 'game-timer').text('Tiempo: 0s').css({ 'font-weight': '600' });
            $difficultyEl = $('<select>').attr('id', 'game-difficulty').append('<option value="easy">Fácil</option><option value="medium" selected>Normal</option><option value="hard">Difícil</option>');
            const $modeSel = $('<select>').attr('id', 'game-mode');
            MODES.forEach(m => $modeSel.append(`<option value="${m}">${m}</option>`));
            $hintBtn = $('<button>').attr('id', 'game-hint').text('Pista ( - )').addClass('btn-link');
            $leaderboardEl = $('<div>').attr('id', 'game-leaderboard').css({ marginTop: '.5rem' });

            $controls.append($timerEl, $difficultyEl, $modeSel, $hintBtn);
            $gameCard.prepend($controls);
            $gameCard.append($leaderboardEl);

            // events
            $difficultyEl.on('change', e => { state.difficulty = e.target.value; });
            $modeSel.on('change', e => { state.mode = e.target.value; });
            $hintBtn.on('click', provideHint);
        };

        const formatTime = s => `${s}s`;

        // leaderboard in localStorage
        const loadLeaderboard = () => {
            try { return JSON.parse(localStorage.getItem('sr_game_leaderboard') || '[]'); } catch (e) { return []; }
        };
        const saveLeaderboard = (entry) => {
            const lb = loadLeaderboard();
            lb.push(entry);
            lb.sort((a,b) => b.score - a.score);
            const top = lb.slice(0, 10);
            try { localStorage.setItem('sr_game_leaderboard', JSON.stringify(top)); } catch (e) {}
            renderLeaderboard();
        };
        const renderLeaderboard = () => {
            if (!$leaderboardEl) return;
            const lb = loadLeaderboard();
            if (lb.length === 0) { $leaderboardEl.html('<p class="small">Sin puntuaciones aún.</p>'); return; }
            const html = ['<h4>Tabla de puntuaciones</h4>','<ol>'];
            lb.forEach(r => html.push(`<li>${r.name || 'Anon'} - ${r.score} pts (${r.date})</li>`));
            html.push('</ol>');
            $leaderboardEl.html(html.join(''));
        };

        const startTimer = () => {
            clearTimer();
            const cfg = DIFFICULTY[state.difficulty] || DIFFICULTY.medium;
            state.timeLeft = cfg.time;
            state.hintsLeft = cfg.hints;
            $timerEl.text('Tiempo: ' + formatTime(state.timeLeft));
            updateHintText();
            state.timerId = setInterval(() => {
                state.timeLeft -= 1;
                $timerEl.text('Tiempo: ' + formatTime(state.timeLeft));
                if (state.timeLeft <= 0) {
                    clearTimer();
                    onTimeUp();
                }
            }, 1000);
        };
        const clearTimer = () => { if (state.timerId) clearInterval(state.timerId); state.timerId = null; };

        const updateHintText = () => {
            if (!$hintBtn) return;
            $hintBtn.text(`Pista (${state.hintsLeft})`);
        };

        const onTimeUp = () => {
            $gameFeedback.text('Se acabó el tiempo. Puntos: 0.');
            state.streak = 0;
            state.attempts.push({ result: 'timeout', points: 0 });
            $gameScoreVal.text(state.score);
        };

        // Evaluate guess based on current mode
        const evaluate = (guess) => {
            if (!state.movie) return { ok: false, points: 0, msg: 'No hay película cargada' };
            const mode = state.mode;
            let points = 0; let ok = false; let msg = '';
            const baseTime = DIFFICULTY[state.difficulty].time;
            const timeBonus = Math.round((state.timeLeft / baseTime) * 5);
            const streakMult = 1 + Math.floor(state.streak / 3) * 0.1; // pequeño bonus por racha

            if (mode === 'year') {
                const actual = parseInt(state.movie.Year, 10) || 0;
                const g = parseInt(guess, 10) || 0;
                const diff = Math.abs(actual - g);
                if (diff === 0) { points = 20 + timeBonus; ok = true; msg = `Exacto! Año: ${actual}`; }
                else if (diff <= 2) { points = 10 + timeBonus; ok = true; msg = `Muy cerca. Año real: ${actual}`; }
                else if (diff <= 5) { points = 5 + Math.max(0, timeBonus-1); ok = true; msg = `Casi. Año real: ${actual}`; }
                else { points = 0; msg = `Incorrecto. Año real: ${actual}`; }
            } else if (mode === 'director') {
                const dir = (state.movie.Director || '').toLowerCase();
                if (!dir) { msg = 'No hay información del director.'; }
                else {
                    if ((dir).includes((guess||'').toLowerCase())) { points = 20 + timeBonus; ok = true; msg = `Correcto. Director: ${state.movie.Director}`; }
                    else { points = 0; msg = `Incorrecto. Director: ${state.movie.Director || 'N/D'}`; }
                }
            } else if (mode === 'area') {
                // Try common fields: Country, Language, Area (if present), or Genre as fallback
                const areaCandidates = [];
                if (state.movie.Country) areaCandidates.push(state.movie.Country);
                if (state.movie.Language) areaCandidates.push(state.movie.Language);
                if (state.movie.Area) areaCandidates.push(state.movie.Area);
                if (state.movie.Genre) areaCandidates.push(state.movie.Genre);
                // normalize
                const areaField = areaCandidates.length ? areaCandidates.join(' / ') : '';
                if (!areaField) { msg = 'No hay información de área disponible para esta película.'; }
                else {
                    if (areaField.toLowerCase().includes((guess||'').toLowerCase())) { points = 10 + timeBonus; ok = true; msg = `Correcto. Área/Info: ${areaField}`; }
                    else { points = 0; msg = `Incorrecto. Área: ${areaField}`; }
                }
            } else { // multiple choice mode
                // guess expected to be one of provided choices (exact string)
                const correct = state.movie.Title || state.movie.strMeal || state.movie.name || '';
                if (!correct) { msg = 'No hay título para comparar.'; }
                else {
                    if ((guess || '').toLowerCase() === correct.toLowerCase()) { points = 15 + timeBonus; ok = true; msg = `¡Correcto! ${correct}`; }
                    else { points = 0; msg = `Incorrecto. Era: ${correct}`; }
                }
            }

            points = Math.round(points * streakMult);
            return { ok, points, msg };
        };

        // provide hint (consume hintsLeft)
        const provideHint = () => {
            if (!state.movie) return $gameFeedback.text('Carga una película primero.');
            if (state.hintsLeft <= 0) return $gameFeedback.text('No tienes más pistas.');
            const h = state.hintsLeft;
            // choose hint type
            const opts = [];
            if (state.movie.Genre) opts.push({ t: 'Género', v: state.movie.Genre });
            if (state.movie.Runtime) opts.push({ t: 'Duración', v: state.movie.Runtime });
            if (state.movie.Actors) opts.push({ t: 'Reparto', v: state.movie.Actors.split(',')[0] });
            if (state.movie.imdbRating) opts.push({ t: 'IMDB rating', v: state.movie.imdbRating });
            if (opts.length === 0) return $gameFeedback.text('No hay pistas disponibles para esta película.');
            const pick = opts[Math.floor(Math.random() * opts.length)];
            state.hintsLeft -= 1;
            updateHintText();
            $gameFeedback.text(`Pista: ${pick.t} → ${pick.v}`);
        };

        // start a new round (use existing state.movie)
        const startRound = () => {
            if (!state.movie) return $gameFeedback.text('No hay película cargada para jugar.');
            state.round += 1;
            ensureUI();
            startTimer();
            // build prompt based on mode
            const mode = state.mode;
            if (mode === 'year') {
                $gamePrompt.text(`Ronda ${state.round}: Adivina el año de estreno de "${state.movie.Title}"`);
                $gameGuess.attr('type', 'number').val('').attr('placeholder', 'Año (ej: 1999)');
            } else if (mode === 'director') {
                $gamePrompt.text(`Ronda ${state.round}: ¿Quién dirigió "${state.movie.Title}"? (escribe el apellido o nombre)`);
                $gameGuess.attr('type', 'text').val('').attr('placeholder', 'Nombre del director');
            } else if (mode === 'area') {
                $gamePrompt.text(`Ronda ${state.round}: Adivina un dato relacionado (país/idioma) de: "${state.movie.Title}"`);
                $gameGuess.attr('type', 'text').val('').attr('placeholder', 'Ej: Spain, English');
            } else { // multiple
                // build multiple choice options
                const correct = state.movie.Title;
                const choices = [correct];
                // sample some other movies from the page by performing a small quick search using existing API
                // We'll attempt to fetch related movies by the same year to create distractors
                const year = (state.movie.Year || '').slice(0,4);
                // create async fetches (but continue synchronously - we will not block here); for simplicity create fake distractors
                for (let i=0;i<3;i++) choices.push(correct + ' ' + String.fromCharCode(65+i));
                // shuffle
                const shuffled = choices.sort(() => Math.random()-0.5);
                let html = `<p>Ronda ${state.round}: Elige el título correcto para la siguiente pista:</p>`;
                shuffled.forEach(c => html += `<button class="mc-choice btn-secondary" data-choice="${c}">${c}</button>`);
                $gamePrompt.html(html);
                $gameGuess.attr('type','text').val('').attr('placeholder','Haz click en la opción correcta');
                // attach handlers
                $gamePrompt.find('.mc-choice').on('click', function(){
                    const choice = $(this).data('choice');
                    const res = evaluate(choice);
                    onRoundEnd(res);
                });
                return; // mc mode handled
            }

            $gameFeedback.text('');
            $gameGuess.focus();
        };

        const onRoundEnd = (result) => {
            clearTimer();
            if (result.ok) {
                state.score += result.points;
                state.streak += 1;
            } else {
                state.streak = 0;
            }
            state.attempts.push({ result: result.msg, points: result.points });
            $gameScoreVal.text(state.score);
            $gameFeedback.text(result.msg + (result.points ? ` +${result.points} pts` : ''));
            // persist to leaderboard if >= threshold or on reset
            if (state.score > 0) {
                const name = userModule.getData().name || 'Anon';
                saveLeaderboard({ name, score: state.score, date: new Date().toLocaleString() });
            }
        };

        const submitGuess = () => {
            const val = $gameGuess.val().trim();
            if (!val) return $gameFeedback.text('Introduce una respuesta antes de enviar.');
            const res = evaluate(val);
            onRoundEnd(res);
        };

        const setMovieForGame = (movie) => {
            state.movie = movie;
            ensureUI();
            $gameCard.removeClass('hidden');
            // preload poster if exists
            const poster = movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : '';
            const infoHtml = `<p><strong>${movie.Title}</strong> (${movie.Year}) ${poster ? `<img src="${poster}" alt="${movie.Title}" style="width:100px;display:block;margin-top:.5rem;">` : ''}</p>`;
            $gamePrompt.html(infoHtml);
            renderLeaderboard();
            startRound();
        };

        // helper: fetch by title using existing apiKey (shared in app scope)
        const fetchMovieByTitle = (title) => {
            if (!title) return $.Deferred().reject('Título vacío');
            if (!apiKey) return $.Deferred().reject('API key no configurada');
            const d = $.Deferred();
            $.getJSON(`https://www.omdbapi.com/?apikey=${apiKey}&t=${encodeURIComponent(title)}`)
                .done(data => {
                    if (data && data.Response === 'True') d.resolve(data);
                    else d.reject(data && data.Error ? data.Error : 'No encontrado');
                })
                .fail(() => d.reject('Error conexión'));
            return d.promise();
        };

        const nextMovie = () => { state.movie = null; $gameCard.addClass('hidden'); $gameFeedback.text(''); $gameGuess.val(''); clearTimer(); };
        const resetGame = () => { state = { movie: null, score: 0, attempts: [], streak: 0, round: 0, timeLeft: 0, timerId: null, hintsLeft: 0, difficulty: state.difficulty, mode: state.mode }; $gameScoreVal.text('0'); $gameCard.addClass('hidden'); $gameFeedback.text('Juego reiniciado.'); renderLeaderboard(); };

        const init = () => {
            ensureUI();
            $gameSubmit.off('click').on('click', submitGuess);
            $gameNext.off('click').on('click', () => { nextMovie(); });
            $gameReset.off('click').on('click', resetGame);
            // cargar película por título desde el input del panel
            $('#game-load').off('click').on('click', function(){
                const title = $('#game-movie-input').val().trim();
                if (!title) { $gameFeedback.text('Introduce un título para cargar.'); return; }
                $gameFeedback.text('Cargando...');
                fetchMovieByTitle(title).then(m => {
                    setMovieForGame(m);
                    $gameFeedback.text('Película cargada. ¡Buena suerte!');
                }).catch(err => {
                    $gameFeedback.text('No se pudo cargar la película: ' + err);
                });
            });
            renderLeaderboard();
        };

        return { init, setMovieForGame };
    })();

    /************* Feedback Module *************/
    const feedbackModule = (() => {
        const $fbForm = $('#feedback-form');
        const $fbName = $('#fb-name');
        const $fbEmail = $('#fb-email');
        const $fbText = $('#fb-text');
        const $fbMsg = $('#fb-msg');
        const $fbClear = $('#fb-clear');

        try {
            const draft = JSON.parse(localStorage.getItem('sr_feedback_draft') || 'null');
            if (draft) {
                $fbName.val(draft.name || '');
                $fbEmail.val(draft.email || '');
                $fbText.val(draft.text || '');
            }
        } catch (e) {}

        const saveDraft = () => {
            const draft = {
                name: $fbName.val().trim(),
                email: $fbEmail.val().trim(),
                text: $fbText.val().trim()
            };
            try { localStorage.setItem('sr_feedback_draft', JSON.stringify(draft)); } catch (e) {}
        };

        const init = () => {
            if (!$fbForm.length) return;

            $fbForm.on('submit', e => {
                e.preventDefault();
                const name = $fbName.val().trim();
                const text = $fbText.val().trim();
                if (!name || !text) {
                    $fbMsg.text('Por favor, completa tu nombre y la sugerencia.');
                    return;
                }

                // Aquí podrías enviar a un backend real; por ahora solo simulamos
                $fbMsg.text('¡Gracias por tu sugerencia!').fadeIn().delay(2000).fadeOut();
                $fbForm[0].reset();
                localStorage.removeItem('sr_feedback_draft');
            });

            $fbClear.on('click', () => {
                $fbForm[0].reset();
                $fbMsg.text('');
                localStorage.removeItem('sr_feedback_draft');
            });

            // Guardar borrador automáticamente
            $fbForm.on('input', saveDraft);
        };

        return { init };
    })();

    /************* Tabs Module *************/
    const tabsModule = (() => {
        const $tabs = $('#tools-tabs button[role="tab"]');
        const $panels = $('[role="tabpanel"]');

        const init = () => {
            $tabs.on('click keydown', function (e) {
                if (e.type === 'click' || e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const $this = $(this);
                    const target = $this.attr('aria-controls');

                    $tabs.attr('aria-selected', 'false');
                    $panels.attr('hidden', true);

                    $this.attr('aria-selected', 'true');
                    $('#' + target).removeAttr('hidden').focus();
                }
            });
        };

        return { init };
    })();

    /************* Initialize All Modules *************/
    userModule.init();
    movieModule.init();
    gameModule.init();
    feedbackModule.init();
    tabsModule.init();
});
