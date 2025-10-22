class ThemeManager {
    static currentTheme='light';
    static init(){
        const saved=this.loadTheme();
        const media=window.matchMedia('(prefers-color-scheme: dark)');
        this.currentTheme=saved||(media.matches?'dark':'light');
        this.applyTheme(this.currentTheme);
        media.addEventListener('change',e=>{ if(!saved) this.setTheme(e.matches?'dark':'light'); });
    }
    static setTheme(t){ this.currentTheme=t; this.applyTheme(t); this.saveTheme(t); }
    static saveTheme(t){ try{ localStorage.setItem(CONFIG.STORAGE_KEYS.THEME,t);}catch(e){ console.warn('Guardar tema:',e);} }
    static loadTheme(){ try{ return localStorage.getItem(CONFIG.STORAGE_KEYS.THEME);}catch(e){ console.warn('Cargar tema:',e); return null;} }
    static toggle(){ this.setTheme(this.currentTheme==='light'?'dark':'light'); }
    static applyTheme(t){ document.documentElement.setAttribute('data-theme',t); const btn=document.getElementById('themeToggle'); if(btn){ const i=btn.querySelector('i'); if(i) i.className=t==='light'?'fas fa-moon':'fas fa-sun'; } }
}
window.ThemeManager = ThemeManager;