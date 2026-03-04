# Authentication & MFA

This repo now ships with built-in email/password authentication plus optional TOTP-based MFA.

## Backend
- Stack: FastAPI + SQLModel + SQLite + JWT (HS256).
- New dependencies: `sqlmodel`, `passlib[bcrypt]`, `pyjwt`, `pyotp`.
- Config (set in `backend/app/.env`):
  - `AUTH_SECRET_KEY`: secret string for signing JWTs (required in production).
  - `ACCESS_TOKEN_EXPIRE_MINUTES`: optional override; defaults to 1440 (24h).

Run locally:
```bash
cd backend/app
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
SQLite lives at `backend/app/data/app.db` (auto-created). The FastAPI docs at `http://localhost:8000/docs` include the auth endpoints.

## API surface
- `POST /auth/register` — body `{email, password}` → user.
- `POST /auth/login` — body `{email, password, totp_code?}` → `{access_token, user}` (requires `totp_code` if MFA enabled).
- `POST /auth/mfa/setup` — bearer token required → `{secret, otpauth_url}` (scan with authenticator).
- `POST /auth/mfa/verify` — bearer + `{totp_code}` → enables MFA.
- `GET /auth/me` — bearer → user profile.
- Core routes (`/upload-image`, `/analyze`, `/recipes/*`) now require a valid bearer token.

## Frontend
- New `/auth` page for login/signup + MFA enrollment.
- Tokens persist in `localStorage` under `iv_token`; all API calls automatically send `Authorization: Bearer <token>`.
- Nav shows signed-in email with sign-out; uploads/search redirect to `/auth` if not signed in.

Run locally:
```bash
cd frontend
npm install
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 npm run dev
```

### MFA flow
1) Login, click **Generate MFA secret**, scan the QR/secret in your authenticator app.
2) Enter the 6-digit code and click **Verify & Enable**.
3) Next logins require the code in addition to password.
