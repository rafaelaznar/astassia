# 📖 Guía de Instalación y Ejecución del Proyecto

## 🚀 Paso a Paso para Abrir el Proyecto

### 1️⃣ **Requisitos Previos**
Antes de comenzar, asegúrate de tener instalado:
- **Node.js** (versión 14 o superior)
- **npm** (viene incluido con Node.js)

Para verificar si los tienes instalados, abre una terminal y ejecuta:
```bash
node --version
npm --version
```

### 2️⃣ **Instalar Dependencias**
Abre una terminal en la carpeta del proyecto (`jalcalde`) y ejecuta:
```bash
npm install
```
Este comando instalará todas las dependencias necesarias (Express, Axios, CORS, etc.).

### 3️⃣ **Configurar Credenciales de Spotify**
Edita el archivo `config.json` y asegúrate de que contenga tus credenciales de la API de Spotify:
```json
{
  "server": {
    "host": "127.0.0.1",
    "port": 5500
  },
  "spotify": {
    "clientId": "TU_CLIENT_ID",
    "clientSecret": "TU_CLIENT_SECRET",
    "redirectUri": "http://127.0.0.1:5500/callback"
  }
}
```

### 4️⃣ **Iniciar el Servidor**
Ejecuta uno de los siguientes comandos según tu preferencia:

**Modo Normal:**
```bash
npm start
```

**Modo Desarrollo (con recarga automática):**
```bash
npm run dev
```

El servidor se iniciará en `http://127.0.0.1:5500`

### 5️⃣ **Abrir la Aplicación**
Una vez que el servidor esté corriendo, abre tu navegador y ve a:
```
http://127.0.0.1:5500
```

---

## 🎵 ¡Listo para Usar!
Ahora podrás iniciar sesión con tu cuenta de Spotify y disfrutar del mini reproductor.

## ⚠️ Solución de Problemas
- **Error de puerto ocupado:** Cambia el puerto en `config.json`
- **Error de dependencias:** Ejecuta `npm install` nuevamente
- **Error de autenticación:** Verifica tus credenciales de Spotify en `config.json`
