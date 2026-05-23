# SIRA

> Project description placeholder — add a short overview of SIRA here.

SIRA is a collaborative full-stack project composed of three services:

- **backend/** — Node.js + Express REST API (default port `3001`)
- **frontend/** — React + Vite + Tailwind CSS SPA (default port `5173`)
- **python-api/** — Optional FastAPI service called from the backend (default port `8000`)

---

## Project layout

```
sira/
├── backend/      # Node.js + Express API
├── frontend/     # React + Vite + Tailwind SPA
└── python-api/   # Optional FastAPI service
```

---

## Prerequisites

- Node.js 18+ and npm
- Python 3.10+ (only if you plan to run the Python API)

---

## Installing dependencies

Each service manages its own dependencies. Install them per service:

### Backend
```bash
cd backend
npm install
cp .env.example .env
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
```

### Python API (optional)
```bash
cd python-api
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

---

## Running services locally

Run each service in its own terminal.

### Backend
```bash
cd backend
npm run dev
```
Exposes the API at `http://localhost:3001/api`. Health check: `GET /api/health`.

### Frontend
```bash
cd frontend
npm run dev
```
Opens the dev server at `http://localhost:5173`. Requests to `/api/*` are proxied to the backend.

### Python API (optional)
```bash
cd python-api
uvicorn app.main:app --reload --port 8000
```
Exposes the service at `http://localhost:8000`. Health check: `GET /health`.

---

## Environment variables

Never commit real `.env` files — only `.env.example` templates are tracked. Copy each `.env.example` to `.env` locally and fill in any required values.

---

## Git workflow

Use short, descriptive branch names following these prefixes:

- `feature/<name>` — new features (e.g. `feature/auth-login`)
- `fix/<name>` — bug fixes (e.g. `fix/header-overflow`)
- `chore/<name>` — refactors, tooling, deps, docs (e.g. `chore/update-deps`)

Recommended flow:

1. Create a branch from `main`: `git checkout -b feature/<name>`
2. Commit often with clear messages
3. Push and open a pull request against `main`
4. Request review, then squash-merge once approved

---

## Notes

- The backend talks to the Python API via `backend/src/services/pythonBridge.js` using `PYTHON_API_URL`.
- The frontend talks to the backend via `frontend/src/services/api.js` (axios instance with `baseURL: /api`).
- Tailwind is configured in `frontend/tailwind.config.js`; global directives live in `frontend/src/index.css`.
