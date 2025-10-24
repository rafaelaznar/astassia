# SmartRecipes - Proyecto SPAs (jQuery y ES6)

Este repositorio contiene dos versiones de la misma Single Page Application (SPA) buscadora de películas.

Nota: la versión jQuery en este directorio consume la API OMDb (https://www.omdbapi.com/). OMDb requiere una API key para uso regular; crea o edita `js/config.js` y coloca tu clave en la propiedad `apiKey` (puedes solicitar una gratuitamente en http://www.omdbapi.com/apikey.aspx). No subas claves privadas al repositorio.

Carpetas de entrega:
- `jquery/` → Versión implementada con jQuery (entrega para la parte jQuery).
- `es6/` → Versión implementada con ES6 moderno (entrega para la parte ES6).

Requisitos:
- Obtener una API key gratuita en http://www.omdbapi.com/apikey.aspx y colocarla en `js/config.js` (propiedad `apiKey`).

Cómo ejecutar localmente:

1. Abre `index.html` en tu navegador (sirve directamente desde el sistema de archivos para uso local).
2. Si prefieres un servidor local (recomendado), en el directorio del proyecto ejecuta un servidor estático (por ejemplo `python3 -m http.server 8000`) y visita `http://localhost:8000`.

Nota de seguridad: Mantén la clave en privado y usa variables de entorno / servidor para production.

Instrucciones rápidas:
- Abrir `index.html` en el navegador.
- Escribe un título y presiona Enter o haz clic en Buscar. Usa Tab para navegar los resultados y Enter/Space para abrir detalles.

Criterios implementados:
- Uso de jQuery y ES6 (módulos, clases, fetch, async/await).
- Validaciones con expresiones regulares.
- Manejo del DOM y eventos.
- Peticiones asíncronas a una API remota.
- Accesibilidad básica (aria-live, labels ocultos).
- Facilidad para integrarlo en Git/GitHub: estructura clara por carpetas para entregar.

Sugerencias de mejora / próximos pasos:
- Añadir tests automatizados (Jest / Puppeteer) para validar flujos.
- Añadir bundler (Vite/Parcel) para la versión ES6 si se requiere deploy.
- Añadir paginación y caché local para reducir llamadas a la API.

Cambios visuales recientes:
- Mejoras en estilos (contraste, espaciado y focus) para inputs, botones y tarjetas.
- Ajustes responsive para mejorar la visualización en móviles.

Si quieres ajustar colores o volver al estilo anterior, dímelo y lo revierto o lo personalizo a tu gusto.

Fecha probable de entrega: 22/Oct
