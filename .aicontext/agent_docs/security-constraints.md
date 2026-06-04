# Security Constraints

## Firebase credentials

- All 6 `VITE_FIREBASE_*` vars are in `.env` (gitignored). Never commit `.env`.
- In CI they are injected from GitHub Actions secrets. Never hardcode credentials.
- `src/lib/firebase.ts` reads only from `import.meta.env` — do not change this pattern.

## Firestore rules (`firestore.rules`)

Rules must be manually published in the Firebase Console — this file is the source of truth but is NOT auto-deployed.

Current rules:
- `users/{userId}`: any auth user can read; only the document owner can write
- `teams/{teamId}`: any auth user can read and write
- `absences/{absenceId}`: any auth user can read; create requires `userId == request.auth.uid`; update/delete requires document owner

When adding new collections, add corresponding rules before deploying. Missing rules default to deny-all.

## Auth flow

- Firebase Email Link (passwordless). No passwords stored.
- Magic links expire in **1 hour**. Sessions persist via `localStorage` indefinitely until sign-out.
- `isSignInWithEmailLink` check in `AuthCallback.tsx` prevents processing arbitrary URLs.
- Email is stored in `localStorage` as `emailForSignIn` during the flow and cleared after use.

## Authorized domains

`isaachuergabayon.github.io` must be listed as an authorized domain in Firebase Auth console. Adding new domains requires manual Firebase Console update.

## Known browser issue

Brave browser with Shields enabled blocks `firestore.googleapis.com`. Instruct users to use Chrome or Safari, or disable Shields for the domain.

## No admin roles

There are no admin roles or privilege escalation paths. Any authenticated user can create/edit/delete their own absences and manage teams. Do not add admin-only paths without also adding Firestore rule enforcement.
