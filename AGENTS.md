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
