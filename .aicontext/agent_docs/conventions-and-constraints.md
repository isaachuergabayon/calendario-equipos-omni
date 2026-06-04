# Conventions & Constraints

## Language

All UI text, labels, messages, and comments are in **Spanish**. Keep this consistent.

## TypeScript

- Strict mode on. `noUnusedLocals` and `noUnusedParameters` enforced — the build fails if violated.
- All shared types live in `src/types/index.ts`. Add new domain types there, not in component files.
- Use `type` imports (`import type { ... }`) for type-only imports.

## Date handling

**Critical**: Never use `new Date("YYYY-MM-DD")` — this parses as UTC and shifts the day in non-UTC timezones (e.g. Spain UTC+2 renders June 8 as June 7). Always parse date strings as local time:
```ts
const [y, m, d] = dateStr.split('-').map(Number)
const date = new Date(y, m - 1, d)
```

## Firestore writes

Never pass `undefined` as a field value to Firestore — it throws `Unsupported field value: undefined`. Omit optional fields conditionally:
```ts
// Wrong
const payload = { ...data }   // spreads notes: undefined

// Right
const payload: Record<string, unknown> = { userId, teamId }
if (data.notes) payload.notes = data.notes
```

## react-big-calendar end dates

All-day event `end` is **exclusive**. To display a single-day event on June 8, set `end = new Date(2026, 5, 9)`. The `CalendarView` handles this automatically — do not apply the +1 elsewhere.

## Component structure

- One component per directory with `index.tsx` as the entry file (e.g. `components/AbsenceModal/index.tsx`)
- Pages are route-level only — business logic goes in hooks or lib
- All Firestore calls go through `src/lib/firestore.ts`. Never import from `firebase/firestore` directly in components or pages.

## Styles

All styles in `src/index.css` — single global CSS file, no CSS modules or styled-components. Follow the existing BEM-ish class naming (e.g. `.filter-row-main`, `.stats-days`, `.btn-icon-danger`). Do not create new CSS files.

## Hooks pattern

Hooks in `src/hooks/` fetch data on mount and expose `{ data, loading, reload }`. After any mutation, call `.reload()` to refresh. Do not add real-time listeners (no `onSnapshot`) — polling via reload is intentional.

## Auth state

Use `useAuth()` to access `appUser` (Firestore user doc) and `firebaseUser` (Firebase Auth). After updating the user's Firestore doc, call `refreshAppUser()` so the context reflects the change immediately.

## Team sorting

`useTeams` sorts alphabetically with `localeCompare('es')`. Do not re-sort in components.

## No test framework

There are no unit or integration tests. Verify changes by running `npm run build` and manually testing in the browser.
