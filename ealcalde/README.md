SPA ES6 - ealcalde (diego alcalde tebar)

Contenido:
- index.html
- css/style.css
- js/app.js (módulo ES6)

Cómo probar localmente:
1. Para usar módulos `type="module"` en algunos navegadores puede ser necesario un servidor local. Puedes usar Python: `python3 -m http.server 8000` desde la carpeta `ealcalde`.
2. Abrir `http://localhost:8000` en el navegador.
3. Rellenar el formulario y enviar.
4. Pulsar "Cargar posts (async/await)" para obtener posts de ejemplo.

El localStorage utiliza la clave `ealcalde_user`.

Notas para entrega:
- Incluir solo la carpeta `ealcalde` en tu PR.
- No modificar ficheros comunes del repo compartido.

Tetris ES6
----------
Esta versión implementa un Tetris sencillo en ES6. Flujo:
- Inicio de sesión/registro en cliente (usuario + email) con validación por regex.
- Tras iniciar sesión, accedes al juego Tetris (canvas) con controles de teclado.
- Puntuación y líneas se calculan y se guardan en `localStorage`.
- Leaderboard con las mejores puntuaciones.

Controles:
- A / D : mover pieza izquierda/derecha
- W : rotar
- S : bajar 1 fila (soft drop)
- espacio : caída rápida (hard drop)
- Botones: Iniciar, Pausa, Terminar

Cómo cumple los requisitos:
- ES6: se usan clases (`Tetris`, `App`), arrow functions, `let`/`const`, template strings, destructuring y spread.
- Programación funcional: uso de `map` para renderizar filas/tabla, `sort` y `slice` para leaderboard.
- Manejo del DOM y eventos: listeners para formulario, botones y teclado.
- Validación de formulario con expresiones regulares.
- Persistencia de puntuaciones en `localStorage`.

Pruebas rápidas para el profesor:
- Iniciar sesión y comprobar que carga la interfaz del juego.
- Pulsar Iniciar: el tablero debe empezar a caer piezas.
- Mover/rotar piezas con teclado y comprobar colisiones.
- Terminar el juego y comprobar que la puntuación aparece en la tabla.
- Recargar la página y comprobar persistencia.

Archivo principal: `js/app.js` contiene la implementación y comentarios.
