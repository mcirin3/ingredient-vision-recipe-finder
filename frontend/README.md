Frontend for Ingredient Vision (Next.js 16 App Router).

## Run locally
```bash
cd frontend
npm install
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 npm run dev
```

Open http://localhost:3000.

## Auth flow
- Go to `/auth` to create an account or log in (email + password).
- If MFA is enabled on an account, the login form will ask for a 6-digit code.
- After login, the token is stored in `localStorage` (`iv_token`) and sent on all API requests.
- The navigation bar shows your email and provides a sign-out button.

See `../docs/auth.md` for backend setup and endpoint details.
