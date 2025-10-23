'use strict';

$(function registerApp() {
    const API_URL = 'https://api.spaceflightnewsapi.net/v4/articles/?limit=60';
    const STORAGE_KEY = 'spaceNewsFavorites';

    const $articleList = $('#article-list');
    const $feedback = $('#feedback');
    const $matchCounter = $('#match-counter');
    const $searchInput = $('#search-input');
    const $sourceSelect = $('#source-select');
    const $ageRange = $('#age-range');
    const $ageValue = $('#age-value');
    const $featuredSelect = $('#featured-select');
    const $sortSelect = $('#sort-select');
    const $favoritesToggle = $('#favorites-toggle');
    const $favoritesCount = $('#favorites-count');
    const $detailPanel = $('#detail-panel');
    const $detailContent = $detailPanel.find('.detail-content');
    const $detailPlaceholder = $detailPanel.find('.detail-placeholder');
    const $detailImage = $('#detail-image');
    const $detailTitle = $('#detail-title');
    const $detailMeta = $('#detail-meta');
    const $detailSummary = $('#detail-summary');
    const $detailAuthors = $('#detail-authors');
    const $detailSource = $('#detail-source');
    const $detailDate = $('#detail-date');
    const $detailFeatured = $('#detail-featured');
    const $detailLink = $('#detail-link');
    const $detailFavBtn = $('#detail-fav-btn');
    const $reloadBtn = $('#reload-btn');
    const $filterForm = $('#filter-form');
    const $insightVisible = $('#insight-visible');
    const $insightFeatured = $('#insight-featured');
    const $insightSources = $('#insight-sources');
    const $insightFavorites = $('#insight-favorites');

    let articleCache = [];
    let favorites = loadFavorites();
    let showFavoritesOnly = false;
    let sortMode = 'recent';
    let currentSelectionId = null;

    function loadFavorites() {
        try {
            const stored = window.localStorage.getItem(STORAGE_KEY);
            if (!stored) {
                return new Set();
            }
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                return new Set(parsed);
            }
        } catch (error) {
            console.error('No se pudieron leer los favoritos almacenados', error);
        }
        return new Set();
    }

    function saveFavorites() {
        try {
            const serialized = JSON.stringify(Array.from(favorites));
            window.localStorage.setItem(STORAGE_KEY, serialized);
        } catch (error) {
            console.error('No se pudieron guardar los favoritos', error);
        }
    }

    function isFavorite(id) {
        return favorites.has(Number(id));
    }

    function setFeedback(message, type) {
        $feedback
            .removeClass('error success')
            .text(message || '');

        if (type === 'error') {
            $feedback.addClass('error');
        } else if (type === 'success') {
            $feedback.addClass('success');
        }
    }

    function renderSourceOptions(list) {
        const sources = Array.from(
            new Set(list.map((item) => item.news_site).filter(Boolean))
        ).sort((a, b) => a.localeCompare(b, 'es'));

        $sourceSelect.find('option:not([value="all"])').remove();
        sources.forEach((source) => {
            $('<option></option>')
                .val(source)
                .text(source)
                .appendTo($sourceSelect);
        });
    }

    function truncate(text, limit = 180) {
        if (!text) {
            return '';
        }
        return text.length > limit ? `${text.slice(0, limit - 1)}...` : text;
    }

    function relativeDays(isoDate) {
        const published = new Date(isoDate);
        const diffMs = Date.now() - published.getTime();
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (Number.isNaN(days) || days < 0) {
            return 'fecha desconocida';
        }
        if (days === 0) {
            return 'hoy';
        }
        if (days === 1) {
            return 'hace 1 dia';
        }
        return `hace ${days} dias`;
    }

    function formatDate(isoDate) {
        const value = new Date(isoDate);
        if (Number.isNaN(value.getTime())) {
            return 'desconocida';
        }
        return value.toLocaleString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function computeAgeDays(isoDate) {
        const published = new Date(isoDate);
        if (Number.isNaN(published.getTime())) {
            return Number.POSITIVE_INFINITY;
        }
        const diffMs = Date.now() - published.getTime();
        return diffMs / (1000 * 60 * 60 * 24);
    }

    function sortArticles(list) {
        const sorted = [...list];
        if (sortMode === 'recent') {
            sorted.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
        } else if (sortMode === 'oldest') {
            sorted.sort((a, b) => new Date(a.published_at) - new Date(b.published_at));
        } else if (sortMode === 'featured') {
            sorted.sort((a, b) => {
                if (a.featured === b.featured) {
                    return new Date(b.published_at) - new Date(a.published_at);
                }
                return a.featured ? -1 : 1;
            });
        }
        return sorted;
    }

    function updateInsights(list) {
        const visibleCount = list.length;
        const featuredCount = list.filter((article) => article.featured).length;
        const uniqueSources = new Set(list.map((article) => article.news_site).filter(Boolean));
        const visibleFavorites = list.filter((article) => isFavorite(article.id)).length;

        $insightVisible.text(String(visibleCount));
        $insightFeatured.text(String(featuredCount));
        $insightSources.text(String(uniqueSources.size));
        $insightFavorites.text(String(visibleFavorites));
        $favoritesCount.text(`Favoritos: ${favorites.size}`);
    }

    function renderArticles(list) {
        $articleList.empty();

        if (!list.length) {
            $articleList.append(
                $('<p></p>')
                    .addClass('empty-state')
                    .text('No hay noticias que coincidan con los filtros.')
            );
            $matchCounter.text('Noticias encontradas: 0');
            return;
        }

        const fragment = $(document.createDocumentFragment());

        list.forEach((article) => {
            const card = $('<article></article>')
                .addClass('article-card')
                .attr('role', 'listitem')
                .attr('tabindex', '0')
                .attr('data-id', article.id);

            if (isFavorite(article.id)) {
                card.addClass('is-favorite');
            }

            $('<div></div>')
                .addClass('article-card__thumb')
                .css('background-image', article.image_url ? `url(${article.image_url})` : 'none')
                .appendTo(card);

            const favoriteBadge = $('<div></div>')
                .addClass('article-card__favorite')
                .appendTo(card);

            $('<button></button>')
                .attr('type', 'button')
                .attr('aria-label', isFavorite(article.id) ? 'Quitar de favoritos' : 'Guardar en favoritos')
                .html(isFavorite(article.id) ? '&#9733;' : '&#9734;')
                .appendTo(favoriteBadge);

            $('<span></span>')
                .addClass('article-card__source')
                .text(article.news_site || 'Sin fuente')
                .appendTo(card);

            $('<h3></h3>')
                .text(article.title)
                .appendTo(card);

            $('<p></p>')
                .addClass('article-summary')
                .text(truncate(article.summary))
                .appendTo(card);

            $('<span></span>')
                .addClass('article-card__time')
                .text(relativeDays(article.published_at))
                .appendTo(card);

            if (article.featured) {
                $('<span></span>')
                    .addClass('article-badge')
                    .text('Destacada')
                    .appendTo(card);
            }

            fragment.append(card);
        });

        $articleList.append(fragment);
        $matchCounter.text(`Noticias encontradas: ${list.length}`);
    }

    function setActiveCard(id) {
        $articleList.find('.article-card').removeClass('active');
        if (!id) {
            return;
        }
        $articleList
            .find(`.article-card[data-id="${id}"]`)
            .addClass('active');
    }

    function renderDetail(article) {
        if (!article) {
            currentSelectionId = null;
            $detailContent.addClass('hidden');
            $detailPlaceholder.removeClass('hidden');
            $detailImage.css('background-image', 'none');
            $detailFavBtn.removeClass('is-active').text('Guardar en favoritos');
            setActiveCard(null);
            return;
        }

        currentSelectionId = article.id;

        $detailTitle.text(article.title);

        const published = formatDate(article.published_at);
        const updated = formatDate(article.updated_at);
        const metaParts = [
            article.news_site || 'Fuente desconocida',
            `Publicado: ${published}`
        ];
        if (article.updated_at && article.updated_at !== article.published_at) {
            metaParts.push(`Actualizado: ${updated}`);
        }

        $detailMeta.text(metaParts.join(' · '));
        $detailSummary.text(article.summary || 'Sin resumen disponible.');

        $detailAuthors.empty();
        const authors = Array.isArray(article.authors) ? article.authors : [];
        if (authors.length) {
            authors.forEach((author) => {
                $('<li></li>')
                    .text(author.name || 'Autor desconocido')
                    .appendTo($detailAuthors);
            });
        } else {
            $('<li></li>')
                .text('Autoria no especificada')
                .appendTo($detailAuthors);
        }

        if (article.image_url) {
            $detailImage
                .css('background-image', `url(${article.image_url})`)
                .show();
        } else {
            $detailImage
                .css('background-image', 'none')
                .hide();
        }

        $detailSource.text(article.news_site || 'Sin fuente');
        $detailDate.text(published);
        $detailFeatured.text(article.featured ? 'Si' : 'No');

        if (article.url) {
            $detailLink
                .attr('href', article.url)
                .removeClass('disabled')
                .text('Leer noticia completa');
        } else {
            $detailLink
                .attr('href', '#')
                .addClass('disabled')
                .text('Sin enlace disponible');
        }

        const favoriteActive = isFavorite(article.id);
        $detailFavBtn
            .toggleClass('is-active', favoriteActive)
            .text(favoriteActive ? 'Quitar de favoritos' : 'Guardar en favoritos');

        $detailPlaceholder.addClass('hidden');
        $detailContent.removeClass('hidden');
        setActiveCard(article.id);
    }

    function updateFavoritesToggle() {
        $favoritesToggle
            .toggleClass('is-active', showFavoritesOnly)
            .text(showFavoritesOnly ? 'Ver todas las noticias' : 'Mostrar solo favoritos');
        $favoritesCount.text(`Favoritos: ${favorites.size}`);
    }

    function getFilteredArticles() {
        const query = $searchInput.val().trim().toLowerCase();
        const selectedSource = $sourceSelect.val();
        const maxAgeDays = Number.parseInt($ageRange.val(), 10) || 30;
        const featuredFilter = $featuredSelect.val();

        let filtered = articleCache.filter((article) => {
            const matchesQuery =
                !query ||
                article.title.toLowerCase().includes(query) ||
                (article.summary && article.summary.toLowerCase().includes(query));

            const matchesSource =
                selectedSource === 'all' || article.news_site === selectedSource;

            const matchesAge = computeAgeDays(article.published_at) <= maxAgeDays;

            let matchesFeatured = true;
            if (featuredFilter === 'featured') {
                matchesFeatured = Boolean(article.featured);
            } else if (featuredFilter === 'regular') {
                matchesFeatured = !article.featured;
            }

            return matchesQuery && matchesSource && matchesAge && matchesFeatured;
        });

        if (showFavoritesOnly) {
            filtered = filtered.filter((article) => isFavorite(article.id));
        }

        return filtered;
    }

    function applyFilters(options = {}) {
        const { preserveSelection = true } = options;
        const filtered = getFilteredArticles();
        const sorted = sortArticles(filtered);

        renderArticles(sorted);
        updateInsights(sorted);

        if (!preserveSelection) {
            currentSelectionId = null;
        }

        if (!sorted.length) {
            renderDetail(null);
            return;
        }

        const existingSelection = currentSelectionId
            ? sorted.find((article) => article.id === currentSelectionId)
            : null;

        renderDetail(existingSelection || sorted[0]);
    }

    function toggleFavorite(id) {
        if (isFavorite(id)) {
            favorites.delete(Number(id));
        } else {
            favorites.add(Number(id));
        }
        saveFavorites();
        updateFavoritesToggle();
        applyFilters({ preserveSelection: true });
    }

    function loadArticles(showSuccess = true) {
        setFeedback('Cargando noticias desde la API...');
        $reloadBtn.prop('disabled', true);
        $articleList.addClass('loading');

        return $.getJSON(API_URL)
            .done((data) => {
                const results = data && Array.isArray(data.results) ? data.results : [];
                articleCache = results;

                if (!articleCache.length) {
                    setFeedback('La API no ha devuelto resultados.', 'error');
                    renderArticles([]);
                    renderDetail(null);
                    updateInsights([]);
                    return;
                }

                renderSourceOptions(articleCache);
                applyFilters({ preserveSelection: false });

                if (showSuccess) {
                    setFeedback('Noticias cargadas correctamente.', 'success');
                } else {
                    setFeedback('');
                }
            })
            .fail(() => {
                setFeedback('No se han podido cargar las noticias. Intentalo de nuevo.', 'error');
            })
            .always(() => {
                $reloadBtn.prop('disabled', false);
                $articleList.removeClass('loading');
            });
    }

    $articleList.on('click', '.article-card', function handleCardClick(event) {
        if ($(event.target).closest('.article-card__favorite').length) {
            return;
        }
        const id = Number($(this).data('id'));
        const article = articleCache.find((item) => item.id === id);
        renderDetail(article || null);
    });

    $articleList.on('keydown', '.article-card', function handleCardKeydown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            $(this).trigger('click');
        }
    });

    $articleList.on('click', '.article-card__favorite button', function handleFavoriteBadge(event) {
        event.stopPropagation();
        const id = Number($(this).closest('.article-card').data('id'));
        toggleFavorite(id);
    });

    $ageRange.on('input change', () => {
        $ageValue.text($ageRange.val());
        applyFilters();
    });

    $searchInput.on('input', applyFilters);
    $sourceSelect.on('change', applyFilters);
    $featuredSelect.on('change', applyFilters);
    $sortSelect.on('change', () => {
        sortMode = $sortSelect.val();
        applyFilters();
    });

    $favoritesToggle.on('click', () => {
        showFavoritesOnly = !showFavoritesOnly;
        updateFavoritesToggle();
        applyFilters({ preserveSelection: false });
    });

    $detailFavBtn.on('click', () => {
        if (!currentSelectionId) {
            return;
        }
        toggleFavorite(currentSelectionId);
    });

    $reloadBtn.on('click', () => {
        loadArticles(false);
    });

    $filterForm.on('reset', () => {
        window.setTimeout(() => {
            $searchInput.val('');
            $sourceSelect.val('all');
            $ageRange.val('30');
            $ageValue.text('30');
            $featuredSelect.val('all');
            $sortSelect.val('recent');
            sortMode = 'recent';
            showFavoritesOnly = false;
            updateFavoritesToggle();
            applyFilters({ preserveSelection: false });
        }, 0);
    });

    updateFavoritesToggle();
    loadArticles();
});
