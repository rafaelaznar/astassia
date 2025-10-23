/**
 * auth.js
 *
 * Este archivo implementa un sistema simple de autenticación usando localStorage.
 * Permite a los usuarios registrarse, iniciar y cerrar sesión, y gestiona la interfaz de login/logout.
 *
 * Es solo para fines educativos y demostrativos, no para producción (no almacena contraseñas de forma segura).
 */

// ========== 1. VARIABLES GLOBALES ==========
// Referencias a elementos del DOM y variables de estado globales para la autenticación.
const authModalEl = document.getElementById('authModal');        // Modal completo
const authModal = new bootstrap.Modal(authModalEl);              // Instancia de Bootstrap
const authBtn = document.getElementById('authBtn');              // Botón Login/Logout
const authBtnText = document.getElementById('authBtnText');      // Texto del botón

let isLoggedIn = false;      // Indica si el usuario está logueado
let currentUser = null;      // Objeto con los datos del usuario actual

// ========== 2. CARGAR SESIÓN AL INICIAR ==========
// Al cargar la página, comprobamos si hay una sesión guardada en localStorage
// para mantener al usuario logueado entre recargas.
const session = localStorage.getItem('esoares_session');
if(session){
  currentUser = JSON.parse(session);  // Convertimos texto a objeto
  isLoggedIn = true;                  // Marcamos como logueado
}

// ========== 3. ACTUALIZAR INTERFAZ ==========
// Actualiza la interfaz según el estado de autenticación:
// Si hay usuario logueado, muestra su nombre y el botón permite cerrar sesión.
// Si no, muestra "Login" y el botón abre el modal de autenticación.
function updateAuthUI(){
  if(isLoggedIn && currentUser){
    // CASO: Usuario SÍ está logueado
    authBtnText.textContent = currentUser.name;  // Mostramos su nombre
    authBtn.onclick = handleLogout;              // Botón hace logout
  } else {
    // CASO: Usuario NO está logueado  
    authBtnText.textContent = 'Login';           // Mostramos "Login"
    authBtn.onclick = ()=> authModal.show();     // Botón abre modal
  }
}

// ========== 4. FUNCIÓN DE CERRAR SESIÓN ==========
// Elimina la sesión del usuario y actualiza la interfaz.
// Pregunta confirmación antes de cerrar sesión.
function handleLogout(){
  // Preguntamos confirmación al usuario
  if(confirm('¿Cerrar sesión?')){
    // Limpiamos datos de sesión
    localStorage.removeItem('esoares_session');
    isLoggedIn = false;
    currentUser = null;
    
    updateAuthUI();  // Actualizamos la interfaz
    
    // Cerramos el modal si está abierto
    const modalInstance = bootstrap.Modal.getInstance(authModalEl);
    if(modalInstance) modalInstance.hide();
    
    alert('Sesión cerrada');
    
    // Volvemos a la sección de inicio
    showSection('inicio');
  }
}

// ========== 5. CAMBIAR ENTRE LOGIN Y REGISTRO ==========
// Permite alternar entre los formularios de login y registro dentro del modal.
// Así el usuario puede cambiar de modo fácilmente.
document.getElementById('toRegisterLink').addEventListener('click', (e)=>{
  e.preventDefault();  // Evita que el link recargue la página
  
  // Ocultamos login, mostramos registro
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'block';
  document.getElementById('authModalTitle').textContent = 'Registrarse';
});

// Cuando haces clic en "Inicia sesión" (desde registro)  
document.getElementById('toLoginLink').addEventListener('click', (e)=>{
  e.preventDefault();
  
  // Ocultamos registro, mostramos login
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('authModalTitle').textContent = 'Iniciar Sesión';
});

// ========== 6. MANEJAR FORMULARIO DE LOGIN ==========
// Procesa el formulario de login: valida campos, busca usuario en localStorage,
// y si es correcto, guarda la sesión y actualiza la interfaz.
document.getElementById('loginForm').addEventListener('submit', (e)=>{
  e.preventDefault();  // Evita que el formulario se envíe
  
  // Obtenemos valores de los campos
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  // Validación básica
  if(!email || !password){
    alert('Completa los campos');
    return;  // Salimos de la función
  }
  
  // Buscamos usuarios en localStorage
  const users = JSON.parse(localStorage.getItem('esoares_users') || '[]');
  
  // Buscamos usuario que coincida con email y contraseña
  // btoa() convierte la contraseña a base64 (NO es seguro, solo para demo)
  const found = users.find(u => u.email === email && u.password === btoa(password));
  
  if(found){
    // LOGIN EXITOSO
    isLoggedIn = true;
    currentUser = {name: found.name, email: found.email};
    
    // Guardamos sesión en localStorage
    localStorage.setItem('esoares_session', JSON.stringify(currentUser));
    
    updateAuthUI();     // Actualizamos interfaz
    authModal.hide();   // Cerramos modal
    alert('Login exitoso');
    
    e.target.reset();   // Limpiamos formulario
  } else {
    alert('Credenciales incorrectas. Asegúrate de registrarte primero.');
  }
});

// ========== 7. MANEJAR FORMULARIO DE REGISTRO ==========
// Procesa el formulario de registro: valida campos, verifica que el email no exista,
// guarda el nuevo usuario en localStorage y cambia a modo login.
document.getElementById('registerForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  
  // Obtenemos valores
  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const confirm = document.getElementById('registerConfirm').value;

  // Validaciones
  if(!name || !email || !password || !confirm){
    alert('Completa todos los campos');
    return;
  }
  
  if(password.length < 6){
    alert('La contraseña debe tener al menos 6 caracteres');
    return;
  }
  
  if(password !== confirm){
    alert('Las contraseñas no coinciden');
    return;
  }

  // Verificamos si el email ya existe
  const users = JSON.parse(localStorage.getItem('esoares_users') || '[]');
  if(users.find(u => u.email === email)){
    alert('Email ya registrado');
    return;
  }
  
  // REGISTRO EXITOSO - Guardamos nuevo usuario
  users.push({
    id: Date.now(),                    // ID único (timestamp actual)
    name: name,
    email: email,
    password: btoa(password),          // Contraseña en base64 (NO seguro)
    createdAt: new Date().toISOString() // Fecha de creación
  });
  
  localStorage.setItem('esoares_users', JSON.stringify(users));
  alert('Registro exitoso. Ahora inicia sesión.');
  
  // Cambiamos a formulario de login
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('authModalTitle').textContent = 'Iniciar Sesión';
});

// ========== 8. INICIALIZAR INTERFAZ ==========
// Al cargar el archivo, actualiza la interfaz de autenticación según el estado actual.
updateAuthUI();