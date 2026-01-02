# OCR Splitter - Backend API

Backend para **OCR Splitter**, un sistema de división de gastos con reconocimiento óptico de caracteres.

## 🚀 Características

- **OCR de Boletas**: Extrae automáticamente items y precios usando Google Cloud Vision API
- **Firebase Firestore**: Integración con la misma base de datos del frontend
- **Autenticación Firebase**: Validación de tokens JWT
- **TypeScript**: Tipado estático completo
- **Validaciones**: Zod schemas y Multer para archivos

## 📋 Requisitos Previos

- **Node.js** 20 o superior
- **npm** o **yarn**
- **Cuenta de Firebase** con Firestore habilitado
- **Google Cloud Vision API** habilitada

## 🔧 Instalación

### 1. Clonar e Instalar Dependencias

```bash
cd ocr-splitter-backend
npm install
```

### 2. Configurar Credenciales de Firebase

#### Descargar Service Account

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **ocr-splitter**
3. Settings ⚙️ → **Project Settings** → **Service Accounts**
4. Clic en **Generate new private key**
5. Guarda el archivo como `firebase-service-account.json` en la raíz del proyecto

### 3. Habilitar Google Cloud Vision API

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona el proyecto **ocr-splitter**
3. **APIs & Services** → **Library**
4. Busca **"Cloud Vision API"** → **Enable**

El mismo `firebase-service-account.json` funciona para ambas APIs.

### 4. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz con:

```env
PORT=3000
FRONTEND_URL=http://localhost:5173
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json
FIREBASE_PROJECT_ID=ocr-splitter
```

## 🏃 Ejecutar el Servidor

### Modo Desarrollo (con hot reload)

```bash
npm run dev
```

### Compilar TypeScript

```bash
npm run build
```

### Modo Producción

```bash
npm start
```

## 📡 API Endpoints

### Health Check

```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-01T10:30:00.000Z",
  "service": "OCR Splitter Backend"
}
```

### Procesar Boleta con OCR

```
POST /api/ocr/process
Content-Type: multipart/form-data
```

**Body:**
- `file`: Imagen de la boleta (JPEG, PNG, WebP o PDF, max 8MB)

**Response (Éxito):**
```json
{
  "success": true,
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Coca Cola",
      "price": 1500,
      "qty": 1
    },
    {
      "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "name": "Pizza Napolitana",
      "price": 8500,
      "qty": 1
    }
  ]
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "No se detectó texto en la imagen"
}
```

## 🧪 Probar con Postman/Thunder Client

1. Crear nueva request **POST**
2. URL: `http://localhost:3000/api/ocr/process`
3. Body: `form-data`
4. Key: `file` (tipo: File)
5. Value: Seleccionar imagen de boleta
6. Send ✅

## 📁 Estructura del Proyecto

```
ocr-splitter-backend/
├── src/
│   ├── config/
│   │   ├── firebase.ts          # Firebase Admin SDK
│   │   └── google-vision.ts     # Google Vision Client
│   ├── middleware/
│   │   ├── auth.middleware.ts   # Verificación de tokens Firebase
│   │   ├── upload.middleware.ts # Multer (subida de archivos)
│   │   └── error.middleware.ts  # Manejo de errores global
│   ├── routes/
│   │   └── ocr.routes.ts        # Endpoint de OCR
│   ├── schemas/
│   │   └── ocr.schema.ts        # Validaciones Zod
│   ├── services/
│   │   └── ocr.service.ts       # Lógica OCR + Parser
│   ├── types/
│   │   └── index.ts             # Tipos TypeScript
│   └── server.ts                # Punto de entrada
├── .env
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── firebase-service-account.json  # ⚠️ NO COMMITEAR
```

## 🔒 Seguridad

- ✅ CORS configurado solo para el frontend
- ✅ Validación de tipos de archivo (solo imágenes/PDF)
- ✅ Límite de tamaño: 8MB
- ✅ Autenticación con Firebase (middleware listo para usar)
- ⚠️ **NUNCA** commitear `firebase-service-account.json` ni `.env`

## 🐛 Troubleshooting

### Error: "No se proporcionó ningún archivo"

- Asegúrate de usar `form-data` en Postman
- El campo debe llamarse exactamente `file`

### Error: "Error al procesar la imagen con Google Vision API"

- Verifica que Vision API esté habilitada
- Confirma que `GOOGLE_APPLICATION_CREDENTIALS` apunta al JSON correcto
- Revisa que el JSON tenga permisos de Vision API

### Error: "Firebase Admin initialization failed"

- Verifica que `firebase-service-account.json` exista
- Confirma que el `FIREBASE_PROJECT_ID` sea correcto

### CORS Error en el Frontend

- Verifica que `FRONTEND_URL` en `.env` coincida con la URL del frontend
- Reinicia el servidor después de cambiar variables de entorno

## 🔗 Integración con Frontend

En el frontend (Vue), reemplaza el mock en `src/services/mocks.ts`:

```typescript
export async function processOCR(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('http://localhost:3000/api/ocr/process', {
    method: 'POST',
    body: formData,
  });

  return response.json();
}
```

## 📝 TODO - Próximos Sprints

- [ ] Endpoints CRUD para grupos/items
- [ ] Middleware de autenticación en rutas protegidas
- [ ] Integración de pasarelas de pago (Webpay, Flow, Khipu)
- [ ] Notificaciones push con Firebase Cloud Messaging
- [ ] Tests unitarios con Jest/Vitest
- [ ] Documentación con Swagger/OpenAPI

## 👨‍💻 Autor

**Sebastian Palacios Vera**  
Proyecto de Ingeniería Informática - 2024

## 📄 Licencia

MIT
