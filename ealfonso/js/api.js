const DEFAULT_ENDPOINT = 'https://api.spaceflightnewsapi.net/v4/articles';
const DEFAULT_LIMIT = 60;

/**
 * Cliente ligero para la Spaceflight News API v4.
 * Gestiona parámetros comunes y garantiza un payload consistente.
 */
export class NewsService {
    constructor(endpoint = DEFAULT_ENDPOINT) {
        this.endpoint = endpoint;
    }

    async getArticles({ limit = DEFAULT_LIMIT, offset = 0 } = {}) {
        const url = new URL(this.endpoint);
        url.searchParams.set('limit', String(limit));
        if (offset > 0) {
            url.searchParams.set('offset', String(offset));
        }

        const response = await fetch(url.toString(), {
            headers: {
                Accept: 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}`);
        }

        const payload = await response.json();
        if (!payload || !Array.isArray(payload.results)) {
            throw new Error('La API devolvió un formato inesperado.');
        }

        return {
            total: payload.count ?? payload.results.length,
            next: payload.next ?? null,
            previous: payload.previous ?? null,
            results: payload.results
        };
    }
}

export const newsService = new NewsService();
