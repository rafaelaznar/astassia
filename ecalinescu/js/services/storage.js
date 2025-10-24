class StorageManager {
    static save(key, data) {
        try { sessionStorage.setItem(key, JSON.stringify(data)); return true; }
        catch (e) { console.error('sessionStorage save:', e); return false; }
    }
    static load(key, def = null) {
        try { const v = sessionStorage.getItem(key); return v ? JSON.parse(v) : def; }
        catch (e) { console.error('sessionStorage load:', e); return def; }
    }
    static remove(key) {
        try { sessionStorage.removeItem(key); return true; }
        catch (e) { console.error('sessionStorage remove:', e); return false; }
    }
    static isAvailable() {
        try { sessionStorage.setItem('__sst__','1'); sessionStorage.removeItem('__sst__'); return true; }
        catch { return false; }
    }
    static getUsedSpace() {
        let t = 0; for (let i = 0; i < sessionStorage.length; i++) { const k = sessionStorage.key(i); const v = sessionStorage.getItem(k) || ''; t += (k?.length||0) + v.length; } return t;
    }
}
window.StorageManager = StorageManager;