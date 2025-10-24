class APIService {
    static async search(query, entity='musicTrack', limit=20, country='US') {
        try {
            if (!query || query.trim().length < CONFIG.VALIDATION.MIN_SEARCH_LENGTH) throw new Error('La búsqueda debe tener al menos 2 caracteres');
            const cacheKey = `${query.toLowerCase().trim()}_${entity}_${limit}_${country}`;
            const cached = this.getCachedResult(cacheKey); if (cached) return cached;
            const params = new URLSearchParams({term:query.trim(), entity, limit:Math.min(limit,200), country, media:'music', explicit:'No'});
            const url = `${CONFIG.ITUNES_API_URL}?${params}`;
            let res; try { res = await fetch(url); } catch (e) { console.warn('CORS proxy fallback', e); res = await fetch(`${CONFIG.CORS_PROXY}${encodeURIComponent(url)}`); }
            if (!res.ok) throw new Error(`Error HTTP: ${res.status} - ${res.statusText}`);
            const data = await res.json();
            if (!Array.isArray(data.results)) throw new Error('Formato de respuesta inesperado');
            const result = { results: data.results.map(t=>new Song(t)), resultCount: data.resultCount || data.results.length, searchTerm: query };
            this.saveToCache(cacheKey, result); return result;
        } catch (e) { console.error('APIService.search:', e); throw new Error(`Error de búsqueda: ${e.message}`); }
    }
    static getCachedResult(key){
        const c=StorageManager.load(CONFIG.STORAGE_KEYS.SEARCH_CACHE,{}), e=c[key];
        if(!e) return null; if(Date.now()-e.timestamp>CONFIG.CACHE.EXPIRY_TIME){ delete c[key]; StorageManager.save(CONFIG.STORAGE_KEYS.SEARCH_CACHE,c); return null; }
        return e.data;
    }
    static saveToCache(key,data){
        const c=StorageManager.load(CONFIG.STORAGE_KEYS.SEARCH_CACHE,{}); c[key]={data,timestamp:Date.now()}; StorageManager.save(CONFIG.STORAGE_KEYS.SEARCH_CACHE,c);
    }
    static async validatePreviewUrl(url){ try{const r=await fetch(url,{method:'HEAD'}); return r.ok;}catch{return false;} }
}
window.APIService = APIService;