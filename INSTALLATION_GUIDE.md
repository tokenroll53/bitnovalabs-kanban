# Bitnova Labs — Kanban PWA

## Guía de Instalación y Configuración Firebase

---

### Descripción

Tablero Kanban colaborativo para desarrollo de software y venta de servicios de Bitnova Labs. Aplicación web progresiva (PWA) con sincronización en tiempo real entre dispositivos, autenticación con Google y funcionalidad offline.

### Archivos del Proyecto

| Archivo | Descripción |
|---|---|
| `index.html` | Aplicación completa (interfaz, estilos, lógica, Firebase) |
| `manifest.json` | Configuración PWA (nombre, iconos, colores) |
| `sw.js` | Service Worker para caché y modo offline |
| `icon-192.png` | Icono de la app 192×192px |
| `icon-512.png` | Icono de la app 512×512px |

### Estructura del Repositorio

```
bitnova-kanban/
├── index.html
├── manifest.json
├── sw.js
├── icon-192.png
├── icon-512.png
└── INSTALLATION_GUIDE.md
```

---

## PASO 1: Crear Proyecto en Firebase

1. Ve a [console.firebase.google.com](https://console.firebase.google.com).
2. Haz clic en **Agregar proyecto**.
3. Nombre del proyecto: `bitnova-kanban` (o el que prefieras).
4. Deshabilita Google Analytics si no lo necesitás (opcional).
5. Haz clic en **Crear proyecto** y espera que se configure.

---

## PASO 2: Configurar Autenticación (Google Login)

1. En la consola de Firebase, ve a **Authentication** (menú lateral).
2. Haz clic en **Comenzar**.
3. En la pestaña **Sign-in method**, haz clic en **Google**.
4. Activa el toggle **Habilitar**.
5. Selecciona un **correo de soporte** (tu email).
6. Haz clic en **Guardar**.

---

## PASO 3: Crear Base de Datos Firestore

1. En la consola de Firebase, ve a **Firestore Database** (menú lateral).
2. Haz clic en **Crear base de datos**.
3. Selecciona **Iniciar en modo de prueba** (lo aseguraremos después).
4. Elige la ubicación más cercana (ej: `us-central1` o `southamerica-east1`).
5. Haz clic en **Habilitar**.

### Reglas de Seguridad (recomendado)

Una vez creada la base de datos, ve a la pestaña **Reglas** y reemplaza el contenido con:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /cards/{cardId} {
      allow read, write: if request.auth != null;
    }
    match /archivedCards/{cardId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Haz clic en **Publicar**.

---

## PASO 4: Registrar la App Web

1. En la consola de Firebase, ve a **Configuración del proyecto** (ícono de engranaje).
2. Baja hasta la sección **Tus apps**.
3. Haz clic en el ícono **Web** (`</>`).
4. Nombre: `Bitnova Kanban`.
5. **NO** marques Firebase Hosting (usaremos GitHub Pages).
6. Haz clic en **Registrar app**.
7. Firebase te mostrará un bloque de configuración como este:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyB1234567890abcdefg",
  authDomain: "bitnova-kanban.firebaseapp.com",
  projectId: "bitnova-kanban",
  storageBucket: "bitnova-kanban.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};
```

8. **Copia estos valores.** Los necesitarás en el siguiente paso.

---

## PASO 5: Configurar las Credenciales en la App

1. Abre `index.html` en un editor de texto.
2. Busca la sección `FIREBASE_CONFIG`:

```javascript
const FIREBASE_CONFIG = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "123456789",
  appId: "TU_APP_ID"
};
```

3. Reemplaza cada valor con los que copiaste de Firebase.
4. Guarda el archivo.

> **Nota sobre seguridad:** Estas credenciales son de configuración de cliente, no son secretas. La seguridad real está en las reglas de Firestore (Paso 3) que solo permiten acceso a usuarios autenticados.

---

## PASO 6: Autorizar el Dominio

1. En Firebase Console → **Authentication** → **Settings** → pestaña **Authorized domains**.
2. Agrega tu dominio de GitHub Pages: `tu-usuario.github.io`
3. Si usás un dominio personalizado, agrégalo también.
4. `localhost` ya viene autorizado por defecto.

---

## PASO 7: Desplegar en GitHub Pages

1. Crea un repositorio en [github.com/new](https://github.com/new) con nombre `bitnova-kanban` y visibilidad **Public**.

2. Sube los 5 archivos a la raíz del repositorio.

3. Ve a **Settings** → **Pages** → Source: rama `main`, carpeta `/ (root)` → **Save**.

4. En 1-2 minutos tu app estará en: `https://tu-usuario.github.io/bitnova-kanban/`

5. Asegurate de que este dominio esté autorizado en Firebase (Paso 6).

---

## PASO 8: Primera Carga de Datos

La primera vez que inicies sesión, el tablero estará vacío. Tenés dos opciones:

**Opción A — Cargar datos de demo:**
Abre la consola del navegador (F12 → Console) y ejecuta:
```javascript
seedDemoData();
```

**Opción B — Empezar desde cero:**
Creá tarjetas directamente con el botón "Nueva Tarjeta".

---

## Cómo Funciona la Sincronización

### Tiempo real
Cuando alguien mueve, crea o edita una tarjeta, el cambio aparece instantáneamente en todos los dispositivos conectados. No se necesita refrescar la página.

### Modo offline
Si perdés conexión, la app sigue funcionando. Los cambios se guardan localmente y se sincronizan al recuperar conexión. El indicador en el header muestra el estado: verde = sincronizado, ámbar = sin conexión, rojo = error.

### Multi-usuario
Cada usuario inicia sesión con su cuenta de Google. Todos ven el mismo tablero en tiempo real.

---

## Instalación como App Nativa

### En PC (Chrome / Edge)
Abre la URL → clic en el ícono de instalación (⊕) en la barra de direcciones.

### En Android (Chrome)
Abre la URL → menú ⋮ → **Instalar app** o **Agregar a pantalla de inicio**.

### En iPhone / iPad (Safari)
Abre la URL → botón **Compartir** → **Agregar a pantalla de inicio**.

---

## Personalización

### Modificar columnas
Busca el array `COLUMNS` en `index.html` y edita nombres, colores y límites WIP.

### Modificar equipo
Busca el array `TEAM` para agregar o editar miembros.

### Modificar etiquetas
Busca el array `LABELS` para editar categorías.

---

## Solución de Problemas

| Problema | Solución |
|---|---|
| "Error: auth/unauthorized-domain" | Agregar tu dominio en Firebase → Authentication → Settings → Authorized domains |
| La ventana de login no abre | Habilitar popups para tu sitio en el navegador |
| No se sincronizan los datos | Verificar que `FIREBASE_CONFIG` tenga los valores correctos |
| Indicador rojo de sync | Revisar la consola del navegador (F12) |
| Tablero vacío al iniciar | Normal la primera vez. Ejecuta `seedDemoData()` en consola o crea tarjetas manualmente |
| "Missing or insufficient permissions" | Verificar y publicar las reglas de Firestore (Paso 3) |
| La app no se instala como PWA | La URL debe usar HTTPS. GitHub Pages lo provee automáticamente |

---

## Costos de Firebase (Plan Gratuito)

El plan Spark (gratuito) incluye: autenticación ilimitada con Google, 1 GB almacenamiento en Firestore, 50,000 lecturas/día y 20,000 escrituras/día. Para un equipo de hasta ~20 personas, es más que suficiente.

---

*Bitnova Labs © 2026*
