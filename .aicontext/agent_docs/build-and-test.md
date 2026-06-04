# Build & Test

## Prerequisites

- Node.js **22.13.1** (pinned via `.tool-versions` / asdf `ivm-node`)
- Install: `npm install` — do NOT use `npm ci`; the lockfile is generated on macOS and may miss Linux bindings for CI
- `.npmrc` forces `registry=https://registry.npmjs.org/` — do not remove; Inditex private registry breaks installs

## Local development

```bash
npm run dev        # Vite dev server on http://localhost:5173
```

Auth callback URL in `src/pages/Login.tsx` switches automatically: localhost in dev, GitHub Pages domain in production. No manual change needed.

## Build

```bash
npm run build      # tsc -b && vite build → dist/
```

`vite.config.ts` sets `base: '/calendario-equipos-omni/'` — required for GitHub Pages subdirectory deployment. Do not change this.

## Typecheck

TypeScript runs as part of build (`tsc -b`). To check without building:

```bash
npx tsc --noEmit
```

`tsconfig.app.json` enforces `noUnusedLocals` and `noUnusedParameters` — fix these before committing.

## Lint

```bash
npm run lint       # eslint on src/
```

## No tests

There are no automated tests in this repo.

## CI/CD

Push to `main` triggers `.github/workflows/deploy.yml`:
1. Injects 6 `VITE_FIREBASE_*` secrets as env vars
2. Runs `npm install && npm run build`
3. Deploys `dist/` to GitHub Pages

Do not push broken builds to `main` — it deploys immediately. Always run `npm run build` locally before committing.

## Required env vars

Copy `.env.example` to `.env` for local dev:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

All 6 must also exist as GitHub Actions secrets for CI to work.
