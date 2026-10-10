# Nova Frontend — Authentication

The frontend uses the Rust API JWT authentication.

## Local development

1. Start the Rust backend on `http://127.0.0.1:3000`.
2. Start the frontend:

```bash
npm install
npm run dev
```

Vite proxies `/api/*` to the Rust API, so the browser calls `/api/auth/login`, `/api/me`, etc.

## Login

The login form calls `POST /auth/login` and stores the returned JWT in browser `localStorage` under `nova_access_token`.

Every API request automatically sends:

```http
Authorization: Bearer <jwt>
```

On startup the frontend calls `GET /me`. If the token is missing or invalid, the user is returned to the login screen.

The backend only issues a JWT to users with `is_staff = true`, so non-staff users cannot enter the SaaS control plane.

## Staff users

The Team screen creates users with a password. If staff access is selected, the frontend creates the user and then calls:

```http
PATCH /users/{id}/staff
```

Changing staff access is never done through the ordinary user update endpoint.
