# Git Workflows

## Branch model

Single branch: `main`. All changes go directly to `main`. No feature branches or PRs in current workflow.

## Deploy on push

Every push to `main` triggers the GitHub Actions deploy workflow and publishes to production immediately. Do not push broken builds.

## Pre-push checklist

Always run before committing:
```bash
npm run build    # catches TS errors + build failures
npm run lint     # ESLint
```

## Commit style

No enforced commit message convention in this repo. Use short, descriptive messages in English or Spanish. Examples from history:
- `fix: exclude undefined notes field from firestore writes`
- `feat: add user profile page with first-time onboarding`
- `fix: parse absence dates as local midnight to avoid UTC timezone shift`

## GitHub Actions secrets

Required for CI — must be set in repo Settings → Secrets:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## GitHub Pages

Source is set to GitHub Actions (not branch deploy). The workflow uploads `dist/` as a Pages artifact.
