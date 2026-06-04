# Codebase Navigation

## Entry points

- `index.html` — SPA shell + GitHub Pages 404-redirect script (restores URL path after redirect)
- `public/404.html` — GitHub Pages fallback; encodes URL into query string for `index.html` to restore
- `src/main.tsx` — React 19 mount
- `src/App.tsx` — router with `basename="/calendario-equipos-omni"`, `<AuthProvider>`, all routes

## Route map

| Path | Component | Notes |
|------|-----------|-------|
| `/login` | `Login.tsx` | Sends magic link email |
| `/auth-callback` | `AuthCallback.tsx` | Completes email link sign-in, detects first login |
| `/` | `Calendar.tsx` | Main view — protected |
| `/teams` | `Teams.tsx` | Team management + self-assignment — protected |
| `/profile` | `Profile.tsx` | Edit display name — protected; `?first=true` = onboarding mode |

`PrivateRoute` gates on `firebaseUser` (not `appUser`). Renders loading spinner while auth resolves.

## Module boundaries

```
src/lib/         ← Firebase init (firebase.ts) + all Firestore CRUD (firestore.ts)
src/types/       ← All shared types, constants (ABSENCE_TYPE_LABELS, TEAM_COLORS)
src/context/     ← AuthContext: firebaseUser, appUser, loading, refreshAppUser
src/hooks/       ← useAbsences / useTeams / useUsers — fetch on mount, expose reload()
src/components/  ← CalendarView, TeamFilter, AbsenceModal
src/pages/       ← Route-level components
```

## Data flow

All Firestore reads go through hooks (`useTeams`, `useUsers`, `useAbsences`). These fetch once on mount; call their `.reload()` to refresh after mutations. All writes go through `src/lib/firestore.ts` — never call Firestore SDK directly from components.

## Key data model quirks

- `Absence.startDate` / `endDate`: stored as ISO strings `"YYYY-MM-DD"`, not timestamps
- Parse date strings with `new Date(y, m-1, d)` (local time) — never `new Date("YYYY-MM-DD")` which parses as UTC and shifts the day in non-UTC timezones
- `CalendarView` adds +1 day to `endDate` for react-big-calendar's exclusive end convention
- `Absence.notes` must be omitted (not `undefined`) when empty — Firestore rejects `undefined` field values
- `useTeams` sorts alphabetically by name (Spanish locale) — all consumers get sorted data automatically

## Fiscal year

`TeamFilter` computes fiscal year as Feb 1 → Jan 31. Logic lives in `TeamFilter/index.tsx:getFiscalYear()`. If month ≥ 2, fiscal year starts current year; otherwise previous year.

## External integrations

- **Firebase Auth**: Email link (passwordless) only. No Google/OAuth. Auth domain: `calendario-equipos-omni.firebaseapp.com`
- **Firestore**: 3 collections — `users`, `teams`, `absences`
- **GitHub Pages**: deployed at `https://isaachuergabayon.github.io/calendario-equipos-omni/`
- **react-big-calendar**: month + week views, `date-fns` localizer, Spanish locale, week starts Monday

## Unused files

`src/App.css` and `src/assets/react.svg`, `vite.svg`, `hero.png` are Vite scaffold leftovers — safe to ignore.
