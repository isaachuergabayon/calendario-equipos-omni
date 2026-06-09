# AGENTS.md

> Operational instructions for AI coding agents working on `calendario-equipos-omni`.

---

## Context Management

Spawn subagents for exploration tasks reading 3+ files, or any analysis where only the summary matters. Stay in main context for direct edits and short targeted reads (1–2 files).

---

## Skills

> **MANDATORY**: Before starting ANY task, inspect loaded skills and execute every matching one. Skills override general knowledge.

No framework-specific skills are currently registered for this repo. Check for newly loaded skills before each session. If a relevant skill is available (e.g. `aidev-code` for coding conventions), invoke it before writing code.

---

## Build & Test

Load before running any build, test, lint, or install command.

> `read_file .aicontext/agent_docs/build-and-test.md`

---

## Codebase Navigation

Load before modifying, navigating, or adding files to understand module boundaries, dependencies, and integrations.

> `read_file .aicontext/agent_docs/codebase-navigation.md`

---

## Security Constraints

Load before touching authentication, secrets, Firebase config, or Firestore rules.

> `read_file .aicontext/agent_docs/security-constraints.md`

---

## Git Workflows

Load before creating branches, writing commits, or opening pull requests.

> `read_file .aicontext/agent_docs/git-workflows.md`

---

## Conventions & Constraints

Load before writing or reviewing any code to apply naming, style, architecture, and gotcha rules.

> `read_file .aicontext/agent_docs/conventions-and-constraints.md`

---

## Release & Versioning

The app uses **SemVer + `release-it`** for fully automated releases.

### How version flows
1. `package.json#version` is the source of truth.
2. Vite injects it as `__APP_VERSION__` at build time via `process.env.npm_package_version` (set automatically by npm).
3. Declared in `src/env.d.ts` as `declare const __APP_VERSION__: string`.
4. Displayed in the app header as a subtle badge: `v{__APP_VERSION__}`.

### Bump rules (from conventional commits since last tag)
| Commit type | Bump |
|---|---|
| `fix:` | patch (`0.1.0 → 0.1.1`) |
| `feat:` | minor (`0.1.0 → 0.2.0`) |
| `feat!:` / `BREAKING CHANGE` | major (`0.1.0 → 1.0.0`) |

### Release command
```bash
npm run release       # interactivo: muestra bump propuesto, pide confirmación
npm run release:dry   # previsualiza sin ejecutar nada
# Para CI / no-interactivo (agentes):
GITHUB_TOKEN=$ITX_GITHUB_PAT npx release-it --ci
```
`GITHUB_TOKEN` se inyecta automáticamente desde `$ITX_GITHUB_PAT` (definido en `~/.zshrc`).
> **Nota**: release-it requiere `GITHUB_TOKEN` (no `GH_TOKEN`) para crear GitHub Releases via API.
> Los scripts de `package.json` ya lo inyectan correctamente.

### What `npm run release` does
1. Calcula el bump analizando commits desde el último tag
2. Actualiza `package.json#version`
3. Genera/actualiza `CHANGELOG.md`
4. Commit: `chore: release vX.Y.Z`
5. Tag: `vX.Y.Z`
6. Push commit + tag → dispara `deploy.yml` → GitHub Pages se actualiza con la nueva versión
7. Crea GitHub Release con el changelog

### Config files
- `.release-it.json` — configuración de release-it (preset `angular`, GitHub releases activados)
- `CHANGELOG.md` — generado y mantenido automáticamente, no editar a mano
