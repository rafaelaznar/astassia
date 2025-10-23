const STORAGE_USER = 'ealcalde_user';
const STORAGE_SCORES = 'ealcalde_scores';

// Tamaño de la rejilla (columnas x filas)
const COLS = 10, ROWS = 20, BLOCK = 28;

// Formas de tetrominós (representadas en matrices)
const TETROMINOS = {
  I: [[1,1,1,1]],
  J: [[1,0,0],[1,1,1]],
  L: [[0,0,1],[1,1,1]],
  O: [[1,1],[1,1]],
  S: [[0,1,1],[1,1,0]],
  T: [[0,1,0],[1,1,1]],
  Z: [[1,1,0],[0,1,1]]
};

const COLORS = { I: '#00f0f0', J: '#0000f0', L: '#f0a000', O:'#f0f000', S:'#00f000', T:'#a000f0', Z:'#f00000' };

class Tetris {
  constructor(canvas){
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.pixelRatio = window.devicePixelRatio || 1;
  // Recalcular al cambiar el tamaño de la ventana
    window.addEventListener('resize', ()=> this.setCanvasSize());
    this.grid = this.createGrid();
    this.score = 0; this.lines = 0; this.level = 1;
    this.dropInterval = 1000;
    this.dropCounter = 0; this.lastTime = 0;
    this.resetPiece();
  // Establecer tamaño del canvas después de crear rejilla y pieza para que draw() tenga datos válidos
    this.setCanvasSize();
    this.gameOver = false; this.running = false;
  }

  setCanvasSize(){
    const cssWidth = COLS * BLOCK;
    const cssHeight = ROWS * BLOCK;
    this.canvas.style.width = cssWidth + 'px';
    this.canvas.style.height = cssHeight + 'px';
    this.canvas.width = Math.round(cssWidth * this.pixelRatio);
    this.canvas.height = Math.round(cssHeight * this.pixelRatio);
    this.ctx.setTransform(this.pixelRatio,0,0,this.pixelRatio,0,0);
    this.draw();
  }

  createGrid(){ return Array.from({length:ROWS}, ()=> Array(COLS).fill(0)); }

  resetPiece(){
    const keys = Object.keys(TETROMINOS);
    const type = keys[Math.floor(Math.random()*keys.length)];
    this.piece = { type, matrix: TETROMINOS[type], pos: {x: Math.floor(COLS/2)-Math.floor(TETROMINOS[type][0].length/2), y:0} };
  }

  rotate(matrix){
  // transponer + invertir filas
    return matrix[0].map((_,i)=> matrix.map(row=> row[i]).reverse());
  }

  collide(grid, piece){
    const {matrix, pos} = piece;
    for (let y = 0; y < matrix.length; y++) {
      for (let x = 0; x < matrix[y].length; x++) {
        if (!matrix[y][x]) continue;
        const gx = x + pos.x;
        const gy = y + pos.y;
  // Comprobar límites horizontales
        if (gx < 0 || gx >= COLS) return true;
  // Comprobar límites verticales (permitimos piezas por encima de la rejilla)
        if (gy >= ROWS) return true;
        if (gy >= 0 && grid[gy][gx] !== 0) return true;
      }
    }
    return false;
  }

  merge(grid, piece){
    const {matrix, pos, type} = piece;
    for(let y=0;y<matrix.length;y++){
      for(let x=0;x<matrix[y].length;x++){
        if(!matrix[y][x]) continue;
        const gx = x + pos.x;
        const gy = y + pos.y;
  // Si la pieza queda por encima del tablero (gy < 0), consideramos fin de partida
        if(gy < 0){
          this.gameOver = true;
          this.running = false;
          return;
        }
  // Proteger índices fuera de rango por si hubiera posiciones extrañas
  if(gy >= 0 && gy < ROWS && gx >= 0 && gx < COLS){
          grid[gy][gx] = type;
        }
      }
    }
  }

  clearLines(){
    let rowCount = 0;
    outer: for(let y=ROWS-1;y>=0;y--){
      for(let x=0;x<COLS;x++) if(!this.grid[y][x]) continue outer;
      const row = this.grid.splice(y,1)[0].fill(0);
      this.grid.unshift(row);
      rowCount++; y++;
    }
    if(rowCount>0){
      this.lines += rowCount;
      this.score += rowCount * 100 * this.level;
  // Subir de nivel cada 5 líneas en lugar de cada 10
  this.level = Math.floor(this.lines/5)+1;
  // Mantener la reducción de 100 ms por nivel, con un mínimo de 100 ms
  this.dropInterval = Math.max(100, 1000 - (this.level-1)*100);
    }
  // Si al limpiar quedan bloques en la primera fila, es fin de partida
    if(this.grid[0].some(cell => cell !== 0)){
      this.gameOver = true;
      this.running = false;
    }
  }

  move(offset){
  // Mover paso a paso para permitir desplazamientos múltiples si offset>1
    const step = Math.sign(offset);
    for(let i=0;i<Math.abs(offset);i++){
      this.piece.pos.x += step;
      if(this.collide(this.grid,this.piece)){
        this.piece.pos.x -= step;
        break;
      }
    }
  }

  drop(){ this.piece.pos.y++; if(this.collide(this.grid,this.piece)){ this.piece.pos.y--; this.merge(this.grid,this.piece); this.resetPiece(); this.clearLines(); if(this.collide(this.grid,this.piece)){ this.gameOver = true; this.running = false; } } }

  rotatePiece(){
    const prev = this.piece.matrix;
    this.piece.matrix = this.rotate(this.piece.matrix);
    if(!this.collide(this.grid,this.piece)) return;
  // Wall kicks simples: probar desplazamientos a izquierda y derecha
    const kicks = [1, -1, 2, -2];
    for(const k of kicks){
      this.piece.pos.x += k;
      if(!this.collide(this.grid,this.piece)) return;
      this.piece.pos.x -= k;
    }
  // Revertir si todos los intentos fallan
    this.piece.matrix = prev;
  }

  update(time=0){
    if(!this.running) return;
    const delta = time - this.lastTime; this.lastTime = time; this.dropCounter += delta;
    if(this.dropCounter > this.dropInterval){ this.drop(); this.dropCounter = 0; }
    this.draw();
    if(!this.gameOver) requestAnimationFrame((t)=> this.update(t)); else this.onGameOver();
  }

  draw(){
    const ctx = this.ctx; ctx.fillStyle = '#111'; ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
  // Dibujar rejilla
    for(let y=0;y<ROWS;y++){
      for(let x=0;x<COLS;x++){
        const cell = this.grid[y][x];
        if(cell){ ctx.fillStyle = COLORS[cell]; ctx.fillRect(x*BLOCK, y*BLOCK, BLOCK-1, BLOCK-1); }
      }
    }
  // Dibujar pieza actual
    if(this.piece){
      const {matrix, pos, type} = this.piece;
      for(let y=0;y<matrix.length;y++){
        for(let x=0;x<matrix[y].length;x++){
          if(matrix[y][x]){ ctx.fillStyle = COLORS[type]; ctx.fillRect((pos.x+x)*BLOCK, (pos.y+y)*BLOCK, BLOCK-1, BLOCK-1); }
        }
      }
    }
  }

  // Limpiar el tablero y eliminar la pieza activa
  clear(){
    this.grid = this.createGrid();
    this.piece = null;
    this.draw();
    this.score = 0; this.lines = 0; this.level = 1;
  }

  // Empezar comprobando colisión para detectar fin inmediato (pila arriba)
  start(){
    this.grid = this.createGrid(); this.score=0; this.lines=0; this.level=1; this.gameOver=false; this.running=true;
    this.resetPiece();
  // Si la nueva pieza colisiona inmediatamente, fin de partida
    if(this.collide(this.grid,this.piece)){
      this.gameOver = true; this.running = false; return;
    }
    this.lastTime=0; this.update();
  }

  pause(){ if(this.gameOver) return; this.running = !this.running; if(this.running) this.update(); }

  onGameOver(){ if(this.onGameEnd) this.onGameEnd({score:this.score, lines:this.lines, level:this.level}); }
}

// Lógica de la app: autenticación, UI y almacenamiento
class App {
  constructor(){
    this.loginForm = document.getElementById('loginForm');
    this.userNameInput = document.getElementById('userName');
    this.userBirthdateInput = document.getElementById('userBirthdate');
    this.authMsg = document.getElementById('authMsg');

    this.playerInfo = document.getElementById('playerInfo');
    this.startBtn = document.getElementById('startBtn');
    this.pauseBtn = document.getElementById('pauseBtn');
    this.endBtn = document.getElementById('endBtn');
    this.scoreEl = document.getElementById('score');
    this.levelEl = document.getElementById('level');
    this.linesEl = document.getElementById('lines');
    this.gameMsg = document.getElementById('gameMsg');

    this.leaderboardEl = document.getElementById('leaderboard');
    this.clearScoresBtn = document.getElementById('clearScores');

    this.canvas = document.getElementById('tetris');
    this.tetris = new Tetris(this.canvas);
    this.tetris.onGameEnd = (data)=> this.handleGameOver(data);

  this._msgTimer = null;

    this.user = null;
    this.bind();
    this.renderLeaderboard();
    this.checkSavedUser();
  }

  bind(){
    this.loginForm.addEventListener('submit', (e)=> this.handleLogin(e));
    this.startBtn.addEventListener('click', ()=> this.startGame());
    this.pauseBtn.addEventListener('click', ()=> this.pauseGame());
    this.endBtn.addEventListener('click', ()=> this.endGame());
    this.clearScoresBtn.addEventListener('click', ()=> this.clearScores());
    // Back button
  const back = document.getElementById('backBtn');
  if(back) back.addEventListener('click', ()=> this.goToPage('welcome'));
  // Manejadores del modal de ayuda
  const helpBtnWelcome = document.getElementById('helpBtnWelcome');
  const helpBtnGame = document.getElementById('helpBtnGame');
    const helpModal = document.getElementById('helpModal');
    const helpClose = document.getElementById('helpClose');
    const helpCloseFooter = document.getElementById('helpCloseFooter');
  const openHelp = ()=>{ if(helpModal){ helpModal.setAttribute('aria-hidden','false'); /* enfocar botón de cerrar */ if(helpClose) helpClose.focus(); } };
    const closeHelp = ()=>{ if(helpModal){ helpModal.setAttribute('aria-hidden','true'); } };
  if(helpBtnWelcome) helpBtnWelcome.addEventListener('click', openHelp);
  if(helpBtnGame) helpBtnGame.addEventListener('click', openHelp);
    if(helpClose) helpClose.addEventListener('click', closeHelp);
    if(helpCloseFooter) helpCloseFooter.addEventListener('click', closeHelp);
    if(helpModal) helpModal.addEventListener('click', (e)=>{ if(e.target === helpModal) closeHelp(); });
    document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape' && helpModal && helpModal.getAttribute('aria-hidden') === 'false') closeHelp(); });
 
    document.addEventListener('keydown', (e)=>{
      const activeTag = document.activeElement && document.activeElement.tagName;
      if ((e.code === 'Space' || e.key === ' ') && activeTag !== 'INPUT' && activeTag !== 'TEXTAREA'){
        e.preventDefault();
        return;
      }
      this.handleKey(e);
    });
  }

  // Mensajes en overlay centrado
  showMessage(text, variant='info', duration=2800){
    const el = this.gameMsg;
    if(!el) return;
    if(this._msgTimer){ clearTimeout(this._msgTimer); this._msgTimer = null; }
    el.textContent = text;
    el.classList.remove('success','danger','show');
    if(variant === 'success') el.classList.add('success');
    if(variant === 'danger') el.classList.add('danger');
    requestAnimationFrame(()=> el.classList.add('show'));
    if(duration && duration > 0){
      this._msgTimer = setTimeout(()=>{
        el.classList.remove('show');
        this._msgTimer = null;
      }, duration);
    }
  }

  hideMessage(){
    if(this._msgTimer){ clearTimeout(this._msgTimer); this._msgTimer = null; }
    if(this.gameMsg) this.gameMsg.classList.remove('show','success','danger');
  }

  checkSavedUser(){
  // Si existe un usuario en localStorage, restaurarlo y mostrar el juego
    const s = localStorage.getItem(STORAGE_USER);
    if(s){
      try{ this.user = JSON.parse(s); this.showGameUI(); return; }
      catch(e){ localStorage.removeItem(STORAGE_USER); }
    }
  }

  handleLogin(e){
    e.preventDefault();
    const name = this.userNameInput.value.trim();
    const birthdate = new Date(this.userBirthdateInput.value);
    
    
    // Validar nombre (longitud y formato con regex: letras, espacios, apóstrofes y guiones)
    const nameOkLength = name.length >= 2;
    const nameRegex = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '\-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
    if(!nameOkLength || !nameRegex.test(name)){
      this.showAuthMsg('Nombre inválido. Usa solo letras y separadores (espacio, apostrofe, guion).');
      return;
    }

  // Validar fecha
    if(isNaN(birthdate.getTime())){
      this.showAuthMsg('Por favor, selecciona tu fecha de nacimiento');
      return;
    }

  // Calcular edad exacta usando la fecha actual
  const today = new Date();
  const age = today.getFullYear() - birthdate.getFullYear();
  const m = today.getMonth() - birthdate.getMonth();
  const d = today.getDate() - birthdate.getDate();

  // Ajustar si aún no ha llegado el día/mes de cumpleaños
  const isEighteen = (age > 18) || (age === 18 && (m > 0 || (m === 0 && d >= 0)));

    if(!isEighteen){
      this.showAuthMsg('Lo sentimos, debes tener 18 años cumplidos para jugar');
      return;
    }

    this.user = {name, birthdate: birthdate.toISOString()}; 
  // Guardar usuario en localStorage
    localStorage.setItem(STORAGE_USER, JSON.stringify(this.user)); 
    this.showAuthMsg('¡Bienvenido ' + name + '!', false); 
  // Mostrar interfaz del juego
    this.showGameUI();
  // Fallback robusto: si por alguna razón la animación/estilos impiden ver el juego,
  // forzamos la visibilidad inmediata del contenedor de juego y ocultamos la bienvenida.
    try{
      const welcome = document.getElementById('welcome-page');
      const game = document.getElementById('game-page');
      if(welcome && game){
  welcome.classList.remove('active','slide-in','slide-out');
  game.classList.add('active');
  // Asegurar que la tabla de puntuaciones y el HUD están actualizados
        this.renderLeaderboard();
        this.updateHUD();
        const start = document.getElementById('startBtn');
        if(start) start.focus();
      }
    }catch(err){ /* silent */ }
  // Asegurar que la tabla de puntuaciones esté actualizada al mostrar el juego
    this.renderLeaderboard();
  }

  showAuthMsg(msg,isErr=true){ this.authMsg.textContent=msg; this.authMsg.style.color=isErr? '#b00':'#080'; setTimeout(()=>this.authMsg.textContent='',3000); }

  showGameUI(){ 
    this.playerInfo.textContent = `Jugador: ${this.user.name}`;
    this.tetris.clear();
    this.updateHUD();
    this.goToPage('game');
  }

  // Navegación entre páginas con animación y gestión del foco
  goToPage(page){
    const welcome = document.getElementById('welcome-page');
    const game = document.getElementById('game-page');
    
    if(page === 'game'){
  // Hacer el cambio inmediato y añadir slide-in para evitar problemas de tiempo
  // Asegurar que la bienvenida se oculta y el juego es visible
  if(welcome){ welcome.classList.remove('active','slide-in'); welcome.classList.add('slide-out'); }
  if(game){ game.classList.add('active','slide-in'); }
  // Focar el botón de iniciar
      const start = document.getElementById('startBtn');
      if(start) start.focus();
  // Limpiar clases de animación al poco tiempo
      setTimeout(()=>{
        if(welcome) welcome.classList.remove('slide-out');
        if(game) game.classList.remove('slide-in');
      },350);
    } else {
  // Mostrar la bienvenida y ocultar el juego; eliminar cualquier display:none inline de la bienvenida
      if(game){ game.classList.remove('active'); game.classList.add('slide-out'); }
  if(welcome){ welcome.classList.add('active','slide-in'); }
      const name = document.getElementById('userName');
      if(name) name.focus();
      setTimeout(()=>{
  if(game) { game.classList.remove('slide-out'); }
        if(welcome) welcome.classList.remove('slide-in');
      },350);
    }
  }

  

  startGame(){ this.hideMessage(); this.tetris.start(); this.updateHUD(); }
  pauseGame(){ this.tetris.pause(); }

  // Terminar partida y limpiar tablero
  endGame(){
    this.tetris.gameOver = true;
    this.tetris.running = false;
    this.handleGameOver({score:this.tetris.score, lines:this.tetris.lines, level:this.tetris.level});
  // Limpiar el tablero visual y reiniciar el HUD
    this.tetris.clear();
    this.updateHUD();
    this.showMessage('Partida terminada', 'danger', 3200);
  }

  handleKey(e){
    if(!this.tetris.running) return;
    const k = (e.key || '').toLowerCase();
    switch(k){
  case 'a': // mover a la izquierda
        this.tetris.move(-1);
        break;
  case 'd': // mover a la derecha
        this.tetris.move(1);
        break;
  case 's': // caída suave
        this.tetris.drop();
        break;
  case 'w': // rotar
        this.tetris.rotatePiece();
        break;
    }
    this.updateHUD();
  }

  handleGameOver({score,lines,level}){
    this.showMessage(`Game Over Puntuación: ${score}`, 'danger', 3800);
    this.saveScore({name:this.user.name, score, lines, level, date: new Date().toISOString()});
    this.renderLeaderboard();
  }

  updateHUD(){ this.scoreEl.textContent = this.tetris.score; this.levelEl.textContent = this.tetris.level; this.linesEl.textContent = this.tetris.lines; }

  // Actualizar de forma inmutable usando operador spread (ES6)
  saveScore(record){ const arr = this.loadScores(); const next = [...arr, record]; localStorage.setItem(STORAGE_SCORES, JSON.stringify(next)); }
  loadScores(){ const raw = localStorage.getItem(STORAGE_SCORES); return raw? JSON.parse(raw):[]; }

  renderLeaderboard(){
    const scores = this.loadScores().sort((a,b)=> b.score - a.score).slice(0,10);
    if(scores.length === 0){
      this.leaderboardEl.innerHTML = '<p>No hay puntuaciones</p>';
      return;
    }
    const rows = scores.map((s,i)=> {
      const date = new Date(s.date).toLocaleString();
      return `
        <tr>
          <td>${i+1}</td>
          <td>${this.escapeHtml(s.name)}</td>
          <td>${s.score}</td>
          <td>${date}</td>
        </tr>`;
    }).join('');
    this.leaderboardEl.innerHTML = `
      <table>
        <thead>
          <tr><th>#</th><th>Jugador</th><th>Puntos</th><th>Fecha</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  clearScores(){ localStorage.removeItem(STORAGE_SCORES); this.renderLeaderboard(); }

  escapeHtml(s){ return String(s).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c])); }
}

// Inicializar la aplicación de forma segura
try{
  if(document.readyState !== 'loading') new App(); else document.addEventListener('DOMContentLoaded', ()=> new App());
}catch(e){ /* error de inicialización silencioso */ }
