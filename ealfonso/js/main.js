import { newsService } from './api.js';
import { AppState } from './state.js';

const FAVORITES_KEY = 'spaceNewsFavorites';

const loadFavorites = () => {
    try {
        const raw = window.localStorage.getItem(FAVORITES_KEY);
        if (!raw) {
            return [];
        }
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('No se pudieron cargar los favoritos guardados', error);
        return [];
    }
};

const saveFavorites = (favorites) => {
    try {
        window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch (error) {
        console.error('No se pudieron guardar los favoritos', error);
    }
};

const state = new AppState(loadFavorites());

const dom = {
    filtersForm: document.querySelector('#filters'),
    searchInput: document.querySelector('#filter-search'),
    sourceSelect: document.querySelector('#filter-source'),
    ageRange: document.querySelector('#filter-age'),
    ageOutput: document.querySelector('#filter-age-output'),
    featuredSelect: document.querySelector('#filter-featured'),
    sortSelect: document.querySelector('#filter-sort'),
    favoritesToggle: document.querySelector('#filter-favorites'),
    favoritesCount: document.querySelector('#favorites-count'),
    refreshBtn: document.querySelector('#refresh-btn'),
    status: document.querySelector('#status'),
    listFeedback: document.querySelector('#list-feedback'),
    articleList: document.querySelector('#article-list'),
    articleTemplate: document.querySelector('#article-card-template'),
    statCount: document.querySelector('#stat-count'),
    statFeatured: document.querySelector('#stat-featured'),
    statSources: document.querySelector('#stat-sources'),
    statFavorites: document.querySelector('#stat-favorites'),
    statAvgAge: document.querySelector('#stat-avg-age'),
    detailPanel: document.querySelector('#detail'),
    detailCard: document.querySelector('.detail__card'),
    detailEmpty: document.querySelector('.detail__empty'),
    detailTitle: document.querySelector('#detail-title'),
    detailMeta: document.querySelector('#detail-meta'),
    detailImage: document.querySelector('#detail-image'),
    detailSummary: document.querySelector('#detail-summary'),
    detailAuthors: document.querySelector('#detail-authors'),
    detailSource: document.querySelector('#detail-source'),
    detailDate: document.querySelector('#detail-date'),
    detailFeatured: document.querySelector('#detail-featured'),
    detailLink: document.querySelector('#detail-link'),
    detailFavoriteBtn: document.querySelector('#detail-favorite')
};

const truncate = (text, limit = 160) => {
    if (!text) {
        return '';
    }
    return text.length > limit ? `${text.slice(0, limit - 1)}...` : text;
};

const relativeDays = (isoDate) => {
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
};

const formatDate = (isoDate) => {
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
};

const formatMeta = (article) => {
    const parts = [];
    parts.push(article.news_site || 'Fuente desconocida');
    if (article.published_at) {
        parts.push(`Publicado: ${formatDate(article.published_at)}`);
    }
    if (article.updated_at && article.updated_at !== article.published_at) {
        parts.push(`Actualizado: ${formatDate(article.updated_at)}`);
    }
    return parts.join(' | ');
};

const renderSources = (sources) => {
    const currentValue = dom.sourceSelect.value;
    dom.sourceSelect
        .querySelectorAll('option:not([value="all"])')
        .forEach((node) => node.remove());

    sources.forEach((source) => {
        const option = document.createElement('option');
        option.value = source;
        option.textContent = source;
        dom.sourceSelect.appendChild(option);
    });

    if (sources.includes(currentValue)) {
        dom.sourceSelect.value = currentValue;
    } else {
        dom.sourceSelect.value = 'all';
    }
};

const renderStats = () => {
    const summary = state.summary;
    dom.statCount.textContent = summary.total.toString();
    dom.statFeatured.textContent = summary.featured.toString();
    dom.statSources.textContent = summary.sources.toString();
    dom.statFavorites.textContent = summary.favorites.toString();
    dom.statAvgAge.textContent = summary.averageAge.toString();
    dom.favoritesCount.textContent = `Favoritos: ${state.favoritesCount}`;
};

const renderStatus = (message, variant) => {
    dom.status.textContent = message ?? '';
    dom.status.classList.toggle('status--error', variant === 'error');
};

const renderListFeedback = () => {
    const total = state.filteredArticles.length;
    const overall = state.articles.length;
    dom.listFeedback.textContent = `${total} de ${overall} noticias`;
};

const createArticleCard = (article) => {
    const fragment = dom.articleTemplate.content.cloneNode(true);
    const node = fragment.querySelector('.article-card');
    node.dataset.id = String(article.id);

    if (state.hasFavorite(article.id)) {
        node.classList.add('is-favorite');
    }

    const favoriteButton = node.querySelector('[data-favorite-btn]');
    favoriteButton.innerHTML = state.hasFavorite(article.id) ? '&#9733;' : '&#9734;';
    favoriteButton.setAttribute(
        'aria-label',
        state.hasFavorite(article.id) ? 'Quitar de favoritos' : 'Guardar en favoritos'
    );

    const thumb = node.querySelector('[data-thumb]');
    if (article.image_url) {
        thumb.style.backgroundImage = `url(${article.image_url})`;
    } else {
        thumb.style.backgroundImage = 'none';
    }

    node.querySelector('[data-source]').textContent = article.news_site || 'Sin fuente';
    node.querySelector('[data-title]').textContent = article.title;
    node.querySelector('[data-summary]').textContent = truncate(article.summary);
    node.querySelector('[data-time]').textContent = relativeDays(article.published_at);

    const flag = node.querySelector('[data-featured]');
    if (article.featured) {
        flag.textContent = 'Destacada';
    } else {
        flag.remove();
    }

    return node;
};

const renderArticleList = () => {
    const articles = state.filteredArticles;
    dom.articleList.replaceChildren(
        ...articles.map((article) => createArticleCard(article))
    );
    highlightSelection();

    if (!articles.length) {
        dom.articleList.textContent = 'No hay noticias que coincidan con los filtros.';
    }
};

const highlightSelection = () => {
    const selectedId = state.selectedArticle ? state.selectedArticle.id : null;
    dom.articleList
        .querySelectorAll('.article-card')
        .forEach((card) => {
            card.classList.toggle('is-active', card.dataset.id === String(selectedId));
        });
};

const renderDetail = (article) => {
    if (!article) {
        dom.detailCard.classList.add('hidden');
        dom.detailEmpty.classList.remove('hidden');
        dom.detailLink.setAttribute('aria-disabled', 'true');
        dom.detailLink.href = '#';
        dom.detailFavoriteBtn.classList.remove('is-active');
        dom.detailFavoriteBtn.textContent = 'Guardar en favoritos';
        return;
    }

    dom.detailCard.classList.remove('hidden');
    dom.detailEmpty.classList.add('hidden');

    dom.detailTitle.textContent = article.title;
    dom.detailMeta.textContent = formatMeta(article);
    dom.detailSummary.textContent = article.summary || 'Sin resumen disponible.';

    dom.detailAuthors.replaceChildren();
    const authors = Array.isArray(article.authors) ? article.authors : [];
    if (authors.length) {
        authors.forEach((author) => {
            const pill = document.createElement('li');
            pill.textContent = author.name || 'Autor desconocido';
            dom.detailAuthors.appendChild(pill);
        });
    } else {
        const pill = document.createElement('li');
        pill.textContent = 'Autoria no especificada';
        dom.detailAuthors.appendChild(pill);
    }

    if (article.image_url) {
        dom.detailImage.style.backgroundImage = `url(${article.image_url})`;
        dom.detailImage.classList.remove('hidden');
    } else {
        dom.detailImage.style.backgroundImage = 'none';
        dom.detailImage.classList.add('hidden');
    }

    dom.detailSource.textContent = article.news_site || 'Sin fuente';
    dom.detailDate.textContent = formatDate(article.published_at);
    dom.detailFeatured.textContent = article.featured ? 'Si' : 'No';

    if (article.url) {
        dom.detailLink.href = article.url;
        dom.detailLink.removeAttribute('aria-disabled');
    } else {
        dom.detailLink.href = '#';
        dom.detailLink.setAttribute('aria-disabled', 'true');
    }

    const favoriteActive = state.hasFavorite(article.id);
    dom.detailFavoriteBtn.classList.toggle('is-active', favoriteActive);
    dom.detailFavoriteBtn.textContent = favoriteActive ? 'Quitar de favoritos' : 'Guardar en favoritos';
};

const updateFavoritesUI = () => {
    const favoritesOnly = state.filters.favoritesOnly;
    dom.favoritesToggle.classList.toggle('is-active', favoritesOnly);
    dom.favoritesToggle.textContent = favoritesOnly ? 'Ver todas las noticias' : 'Mostrar solo favoritos';
    dom.favoritesCount.textContent = `Favoritos: ${state.favoritesCount}`;
};

const bindEvents = () => {
    dom.searchInput.addEventListener('input', (event) => {
        state.updateFilters({ search: event.target.value });
    });

    dom.sourceSelect.addEventListener('change', (event) => {
        state.updateFilters({ source: event.target.value });
    });

    dom.ageRange.addEventListener('input', (event) => {
        dom.ageOutput.textContent = event.target.value;
        state.updateFilters({ maxAge: Number.parseInt(event.target.value, 10) });
    });

    dom.featuredSelect.addEventListener('change', (event) => {
        state.updateFilters({ featured: event.target.value });
    });

    dom.sortSelect.addEventListener('change', (event) => {
        state.updateFilters({ sort: event.target.value });
    });

    dom.favoritesToggle.addEventListener('click', () => {
        state.updateFilters({ favoritesOnly: !state.filters.favoritesOnly });
        updateFavoritesUI();
    });

    dom.filtersForm.addEventListener('reset', (event) => {
        event.preventDefault();
        dom.searchInput.value = '';
        dom.sourceSelect.value = 'all';
        dom.ageRange.value = '30';
        dom.ageOutput.textContent = '30';
        dom.featuredSelect.value = 'all';
        dom.sortSelect.value = 'recent';
        state.resetFilters();
        updateFavoritesUI();
    });

    dom.refreshBtn.addEventListener('click', () => {
        hydrate(true);
    });

    dom.articleList.addEventListener('click', (event) => {
        const favoriteButton = event.target.closest('[data-favorite-btn]');
        if (favoriteButton) {
            event.stopPropagation();
            const card = favoriteButton.closest('.article-card');
            if (!card) {
                return;
            }
            state.toggleFavorite(Number.parseInt(card.dataset.id, 10));
            return;
        }

        const card = event.target.closest('.article-card');
        if (!card) {
            return;
        }
        state.selectArticle(Number.parseInt(card.dataset.id, 10));
    });

    dom.articleList.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
            return;
        }
        const card = event.target.closest('.article-card');
        if (!card) {
            return;
        }
        event.preventDefault();
        state.selectArticle(Number.parseInt(card.dataset.id, 10));
    });

    dom.detailFavoriteBtn.addEventListener('click', () => {
        const article = state.selectedArticle;
        if (!article) {
            return;
        }
        state.toggleFavorite(article.id);
    });
};

const hydrate = async (fromUser = false) => {
    renderStatus('Cargando noticias espaciales...');
    dom.refreshBtn.disabled = true;

    try {
        const { results } = await newsService.getArticles();
        state.setArticles(results);
        renderStatus(
            fromUser
                ? 'Listado actualizado correctamente.'
                : `Se han cargado ${results.length} noticias.`
        );
    } catch (error) {
        console.error(error);
        renderStatus('No se pudieron cargar los datos. Comprueba tu conexion.', 'error');
    } finally {
        dom.refreshBtn.disabled = false;
    }
};

state.addEventListener('articles:updated', () => {
    renderSources(state.sources);
    renderArticleList();
    renderStats();
    renderListFeedback();
    updateFavoritesUI();
    if (state.selectedArticle) {
        renderDetail(state.selectedArticle);
    } else {
        renderDetail(null);
    }
});

state.addEventListener('filters:updated', () => {
    renderArticleList();
    renderStats();
    renderListFeedback();
    updateFavoritesUI();
    renderDetail(state.selectedArticle);
});

state.addEventListener('filters:reset', () => {
    renderArticleList();
    renderStats();
    renderListFeedback();
    updateFavoritesUI();
    renderDetail(state.selectedArticle);
});

state.addEventListener('favorites:changed', (event) => {
    saveFavorites(event.detail.favorites);
    renderArticleList();
    renderStats();
    updateFavoritesUI();
    renderDetail(state.selectedArticle);
});

state.addEventListener('selection:changed', (event) => {
    renderDetail(event.detail.article);
    highlightSelection();
});

bindEvents();
updateFavoritesUI();
hydrate();
