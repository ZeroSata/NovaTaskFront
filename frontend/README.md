# Nova Frontend

React + TypeScript + Vite frontend for the existing Nova Data Axum API.

## Run

```bash
npm install
npm run dev
```

The Vite dev server runs on `http://localhost:5173` and proxies `/api/*` to `http://127.0.0.1:3000/*`.

If the API is hosted elsewhere, set `VITE_API_URL`:

```bash
VITE_API_URL=https://api.example.com npm run build
```

## Current API integration

- `GET /users`
- `GET /users/{user_id}/agents`
- `POST /users/{user_id}/agents`
- `GET /vms/status/{status}`
- `GET /vms/{id}`
- `GET /vms/{vm_id}/connections`
- `PUT /agents/{id}` and `PUT /vms/{id}` are prepared in the API client for the next edit/detail screens.

## Screens

- Обзор — executive cockpit with live API metrics
- AI-команда — agent registry, search and create-agent flow
- Инфраструктура — VM cards and status filters
- Журнал — connection audit stream per VM
- Команда — ownership and responsibility boundary
