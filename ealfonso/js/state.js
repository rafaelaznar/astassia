const DEFAULT_FILTERS = Object.freeze({
    search: '',
    source: 'all',
    maxAge: 30,
    featured: 'all',
    sort: 'recent',
    favoritesOnly: false
});

const ageInDays = (isoDate) => {
    const published = new Date(isoDate);
    if (Number.isNaN(published.getTime())) {
        return Number.POSITIVE_INFINITY;
    }
    const diffMs = Date.now() - published.getTime();
    return diffMs / (1000 * 60 * 60 * 24);
};

const sortCollection = (list, mode) => {
    const sorted = [...list];
    if (mode === 'recent') {
        sorted.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
    } else if (mode === 'oldest') {
        sorted.sort((a, b) => new Date(a.published_at) - new Date(b.published_at));
    } else if (mode === 'featured') {
        sorted.sort((a, b) => {
            if (a.featured === b.featured) {
                return new Date(b.published_at) - new Date(a.published_at);
            }
            return a.featured ? -1 : 1;
        });
    }
    return sorted;
};

export class AppState extends EventTarget {
    constructor(initialFavorites = []) {
        super();
        this.articles = [];
        this.filters = { ...DEFAULT_FILTERS };
        this.selectedArticleId = null;
        this.favorites = new Set(initialFavorites);
    }

    setArticles(articles) {
        this.articles = Array.isArray(articles) ? [...articles] : [];
        this.dispatchEvent(new CustomEvent('articles:updated', {
            detail: { articles: this.articles }
        }));
        this.ensureSelection();
    }

    updateFilters(partial) {
        this.filters = { ...this.filters, ...partial };
        this.dispatchEvent(new CustomEvent('filters:updated', {
            detail: { filters: { ...this.filters } }
        }));
        this.ensureSelection();
    }

    resetFilters() {
        this.filters = { ...DEFAULT_FILTERS };
        this.dispatchEvent(new CustomEvent('filters:reset', {
            detail: { filters: { ...this.filters } }
        }));
        this.ensureSelection();
    }

    refresh() {
        this.dispatchEvent(new CustomEvent('filters:updated', {
            detail: { filters: { ...this.filters } }
        }));
        this.ensureSelection();
    }

    selectArticle(id) {
        if (id === this.selectedArticleId) {
            return;
        }
        this.selectedArticleId = id ?? null;
        this.dispatchEvent(new CustomEvent('selection:changed', {
            detail: { article: this.selectedArticle }
        }));
    }

    toggleFavorite(id) {
        const numericId = Number(id);
        if (Number.isNaN(numericId)) {
            return;
        }

        if (this.favorites.has(numericId)) {
            this.favorites.delete(numericId);
        } else {
            this.favorites.add(numericId);
        }

        this.dispatchEvent(new CustomEvent('favorites:changed', {
            detail: { favorites: Array.from(this.favorites) }
        }));

        this.refresh();
    }

    hasFavorite(id) {
        return this.favorites.has(Number(id));
    }

    ensureSelection() {
        const current = this.filteredArticles;

        if (!current.length) {
            if (this.selectedArticleId !== null) {
                this.selectedArticleId = null;
                this.dispatchEvent(new CustomEvent('selection:changed', {
                    detail: { article: null }
                }));
            }
            return;
        }

        if (!this.selectedArticleId || !current.some((article) => article.id === this.selectedArticleId)) {
            this.selectedArticleId = current[0].id;
            this.dispatchEvent(new CustomEvent('selection:changed', {
                detail: { article: this.selectedArticle }
            }));
        } else {
            this.dispatchEvent(new CustomEvent('selection:changed', {
                detail: { article: this.selectedArticle }
            }));
        }
    }

    get sources() {
        return Array.from(
            new Set(this.articles.map((article) => article.news_site).filter(Boolean))
        ).sort((a, b) => a.localeCompare(b, 'es'));
    }

    get filteredArticles() {
        const { search, source, maxAge, featured, favoritesOnly, sort } = this.filters;
        const query = search.trim().toLowerCase();

        let collection = this.articles.filter((article) => {
            const matchesQuery =
                !query ||
                article.title.toLowerCase().includes(query) ||
                (article.summary && article.summary.toLowerCase().includes(query));
            const matchesSource = source === 'all' || article.news_site === source;
            const matchesAge = ageInDays(article.published_at) <= Number(maxAge);

            let matchesFeatured = true;
            if (featured === 'featured') {
                matchesFeatured = Boolean(article.featured);
            } else if (featured === 'regular') {
                matchesFeatured = !article.featured;
            }

            return matchesQuery && matchesSource && matchesAge && matchesFeatured;
        });

        if (favoritesOnly) {
            collection = collection.filter((article) => this.hasFavorite(article.id));
        }

        return sortCollection(collection, sort);
    }

    get summary() {
        const articles = this.filteredArticles;
        const total = articles.length;

        if (!total) {
            return {
                total: 0,
                featured: 0,
                sources: 0,
                favorites: 0,
                averageAge: 0
            };
        }

        const featured = articles.filter((article) => article.featured).length;
        const sources = new Set(articles.map((article) => article.news_site).filter(Boolean)).size;
        const favorites = articles.filter((article) => this.hasFavorite(article.id)).length;
        const ageSum = articles.reduce((acc, article) => acc + ageInDays(article.published_at), 0);

        return {
            total,
            featured,
            sources,
            favorites,
            averageAge: Math.round((ageSum / total) * 10) / 10
        };
    }

    get favoritesCount() {
        return this.favorites.size;
    }

    get selectedArticle() {
        return this.articles.find((article) => article.id === this.selectedArticleId) ?? null;
    }
}
