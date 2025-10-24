document.addEventListener('DOMContentLoaded',()=>{
    console.log('🎵 Iniciando Explorador Musical...');
    if(!window.fetch){ alert('Tu navegador no es compatible. Actualiza.'); return; }
    if(!StorageManager.isAvailable()) console.warn('sessionStorage no disponible.');
    try{
        window.musicApp=new MusicApp();
        window.debugMusicApp={
            clearAllData:()=>window.musicApp.clearAllData(),
            showFavorites:()=>console.table(window.musicApp.favorites.map(f=>({id:f.trackId,name:f.trackName,artist:f.artistName}))),
            clearFavorites:()=>{ window.musicApp.favorites=[]; window.musicApp.saveFavorites(); window.musicApp.updateCounters(); console.log('✅ Favoritos limpiados'); }
        };
        console.log('✅ Aplicación iniciada');
    }catch(e){ console.error('❌ Error al iniciar:',e); alert('Error al cargar la aplicación. Recarga la página.'); }
});
window.addEventListener('error',e=>{
    console.error('Error global:',e.error);
    const m=e.error?.message||'';
    if(window.musicApp && m && !m.includes('Non-Error promise rejection captured') && !e.filename?.includes('input') && e.error?.name!=='TypeError'){
        NotificationManager.show('Error','Se produjo un error inesperado','error');
    }
});
window.addEventListener('unhandledrejection',e=>{
    console.error('Promesa rechazada:',e.reason);
    const m=e.reason?.message||'';
    if(window.musicApp && m && !m.includes('fetch')){
        NotificationManager.show('Error','Error en operación asíncrona','error');
    }
});