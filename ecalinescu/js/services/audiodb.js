class AudioDBService {
    static async getArtistInfo(name) {
        try {
            if (!name || name.trim().length < 2) throw new Error('Nombre de artista inválido');
            const key = `artist_${name.toLowerCase().trim()}`;
            const cached = this.getCachedArtistInfo(key); if (cached) return cached;
            const url = `${CONFIG.AUDIODB_API_URL}/search.php?s=${encodeURIComponent(name)}`;
            const res = await fetch(url); if(!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const a = (data.artists && data.artists[0]) || {};
            const info = {
                name: a.strArtist || name,
                image: a.strArtistThumb || a.strArtistFanart || a.strArtistFanart2 || null,
                thumb: a.strArtistThumb || null,
                banner: a.strArtistBanner || null,
                logo: a.strArtistLogo || null,
                biography: a.strBiographyEN || a.strBiographyES || null,
                genre: a.strGenre || null,
                website: a.strWebsite || null
            };
            this.cacheArtistInfo(key, info); return info;
        } catch (e) {
            console.warn('AudioDB:', e); return { name, image:null, thumb:null, banner:null, logo:null, biography:null, genre:null, website:null };
        }
    }
    static async exists(name){
        try{ if(!name||name.trim().length<2) return false; const url=`${CONFIG.AUDIODB_API_URL}/search.php?s=${encodeURIComponent(name)}`; const res=await fetch(url); if(!res.ok) throw new Error(`HTTP ${res.status}`); const data=await res.json(); return !!(data&&data.artists&&data.artists.length); }catch(e){ console.warn('AudioDB exists:',e); return false; }
    }
    static async searchSimilarArtists(name, limit=10){
        try { const main = await this.getArtistInfo(name); const r = []; if (main.image) r.push(main); if (r.length<limit) console.warn('AudioDB free: búsqueda por género no disponible'); return r.slice(0,limit);} catch(e){ console.error('Artist similar:', e); return []; }
    }
    static getCachedArtistInfo(key){
        try { const c = StorageManager.load(CONFIG.STORAGE_KEYS.ARTIST_IMAGES_CACHE, {}), e = c[key]; if (e && this.isCacheValid(e.timestamp)) return e.data; return null; }
        catch (e) { console.warn('Cache artistas:', e); return null; }
    }
    static cacheArtistInfo(key, info){
        try { const c=StorageManager.load(CONFIG.STORAGE_KEYS.ARTIST_IMAGES_CACHE,{}); c[key]={data:info,timestamp:Date.now()}; const entries=Object.entries(c); if(entries.length>100){ const nc=Object.fromEntries(entries.sort((a,b)=>b[1].timestamp-a[1].timestamp).slice(0,100)); StorageManager.save(CONFIG.STORAGE_KEYS.ARTIST_IMAGES_CACHE,nc);} else { StorageManager.save(CONFIG.STORAGE_KEYS.ARTIST_IMAGES_CACHE,c);} }
        catch(e){ console.warn('Guardar cache artistas:', e); }
    }
    static isCacheValid(ts){ return Date.now()-ts < 24*60*60*1000; }
    static clearCache(){ StorageManager.remove(CONFIG.STORAGE_KEYS.ARTIST_IMAGES_CACHE); console.log('Artist images cache cleared'); }
}
window.AudioDBService = AudioDBService;