# SIRA — Solución Inteligente de Recuperación Activa

## Descripción del proyecto

SIRA es una plataforma web con IA orientada a la **permanencia estudiantil y la recuperación financiera** en instituciones educativas. Resuelve una problemática crítica para empresas e instituciones de todos los tamaños: la gestión eficiente de recuperación de cartera de estudiantes en mora o en riesgo de deserción.

## Módulos y funcionalidades principales

- **Dashboard administrativo** — vista centralizada de indicadores clave de cartera y permanencia.
- **Predicción de riesgo** — modelos de IA que identifican estudiantes en riesgo de deserción o mora.
- **Automatización inteligente** — flujos automatizados de seguimiento, notificaciones y acciones de recuperación.
- **Chatbot financiero** — asistente conversacional para orientar a estudiantes sobre opciones de pago y acuerdos.
- **Acuerdos personalizados** — generación de planes de pago adaptados al perfil de cada estudiante.
- **Enfoque humano** — la plataforma prioriza la empatía y la permanencia estudiantil, no solo la cobranza.

## AURA — Mascota flotante interactiva

AURA es la mascota/asistente flotante de la plataforma. Aparece como un elemento persistente en la UI con el que el usuario puede interactuar en lenguaje natural para hacer peticiones, navegar la plataforma o recibir orientación contextual.

La integración con IA (Gemini) vive en **`backend/`** por seguridad: el frontend nunca toca la API key, llama a `POST /api/aura/chat` y el backend hace el puente con Google Gemini.

## Arquitectura — monorepo de 3 capas

```
sira/
├── backend/      # Node.js + Express API (puerto 3001). Maneja Gemini para AURA.
├── frontend/     # React 19 + Vite + TypeScript + Tailwind 4 (puerto 5173).
└── python-api/   # FastAPI opcional (puerto 8000), usado para modelos de IA / scoring.
```

- **Frontend → Backend**: el dev server de Vite hace proxy de `/api/*` al backend.
- **Backend → Python API**: el backend llama a Python vía `services/pythonBridge.js` (axios) cuando necesita inferencia de modelos.
- **AURA**: el componente `AuraAssistant.tsx` debe llamar a `POST /api/aura/chat` (no a Gemini directamente).

## Stack y convenciones

- **Frontend**: React 19, TypeScript, react-router 7, Tailwind CSS 4 (`@import "tailwindcss"` + `@theme`), motion, lucide-react, recharts, axios.
- **Backend**: Node.js + Express, CommonJS, dotenv, helmet, cors, morgan, `@google/genai`.
- **Python API**: FastAPI + uvicorn.
- **Comunicación**: REST JSON. Endpoints bajo `/api/*`.
- **Estilos**: clases Tailwind. Componentes con clases utilitarias (`glass-card`, `btn-primary`, `sidebar-link`) definidas en `frontend/src/index.css`.
- AURA debe implementarse como componente flotante reutilizable con soporte de lenguaje natural (integración con `/api/aura`).

## Notas de desarrollo

- Priorizar diseño empático y accesible; el usuario final puede ser un administrador financiero o un estudiante.
- AURA no es solo decorativa: debe tener capacidad real de entender peticiones y ejecutar acciones en la plataforma.
- El dashboard administrativo es el punto de entrada principal para el rol administrador.
- **Nunca** llamar a `@google/genai` desde el frontend — la API key debe permanecer server-side.
