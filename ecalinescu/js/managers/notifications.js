class NotificationManager { 
    static container = null;
    static init(){ this.container=document.getElementById('toastContainer'); if(!this.container) console.error('No toast container'); }
    static show(title,message,type='success',duration=4000){ if(!this.container) return; const t=this.createToast(title,message,type); this.container.appendChild(t); setTimeout(()=>this.remove(t),duration); return t; }
    static createToast(title,message,type){ const t=document.createElement('div'); t.className=`toast ${type}`; t.innerHTML=`<div class="toast-content"><strong>${title}</strong>${message?`<br>${message}`:''}</div><button class="toast-close" aria-label="Cerrar notificación"><i class="fas fa-times"></i></button>`; t.querySelector('.toast-close').addEventListener('click',()=>this.remove(t)); return t; }
    static remove(t){ if(t&&t.parentNode){ t.classList.add('fade-out'); setTimeout(()=>t.remove(),300);} }
    static clear(){ if(this.container) this.container.innerHTML=''; }
}
window.NotificationManager = NotificationManager;