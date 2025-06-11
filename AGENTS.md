# AGENTS.md

This document is the **single source of truth** for how automated agents (e.g. OpenAI Codex, Replit AI Assistant) and human contributors collaborate on any coding task in this repository. Keep it **generic**—language‑, framework‑ and feature‑agnostic. If a feature needs domain‑specific rules (e.g. OpenAI integration), link out to a dedicated doc instead of bloating this file.

---

## 1 · Agents & Roles

| Agent            | Primary Role                                                       | Notes                                 |
| ---------------- | ------------------------------------------------------------------ | ------------------------------------- |
| **OpenAI Codex** | Generate, refactor, and fix code; scaffold tests; draft docs.      | Triggered via CLI or IDE extension.   |
| **Replit AI**    | Conversational, in‑IDE assistant for quick snippets & explanations | Lives inside the Replit workspace UI. |
| **Humans**       | Design architecture; review & merge PRs; own production deploys    | Always have the final sign‑off.       |

---

## 2 · Agent Protocols & Guidelines

* **All generated code must be:**

  * Recorded in `CHANGELOG.md` following **CHANGELOG\_GUIDE.md**.
  * Annotated at the top of each new/edited file with the reason for change.
  * Validated by `pnpm check` (type‑check + lint + tests) **before** commit.
* **Agents may not** merge to protected branches or deploy; humans must review.
* **Conflict detection:** Agents must pull latest, run `git diff`, and regenerate if merge conflicts appear.
* **Sensitive data:** Agents must never hard‑code secrets or write plaintext keys.

---

## 3 · Pre‑Flight Checklist ✅

Log each step with `[AGENT‑PRECHECK]`. Abort if any item fails.

1. Working tree is clean **or** a feature/fix branch is checked out.
2. All *required* environment variables exist (see `README.md → Environment Variables`).
3. `pnpm type-check` **and** `pnpm lint -r` pass.
4. `pnpm vitest run -r` passes across all workspaces.
5. If the task touches an **external service** (API, DB, queue, etc.) run its health‑check script under `scripts/health/` and ensure success.

---

## 4 · Standard Debug Flow 🔍

Tag runtime diagnostics with `[DEBUG‑AI]`.

1. Reproduce the bug; capture UI/network trace if applicable.
2. Add **temporary** `console.debug('[DEBUG‑AI]', …)` at entry & exit of each call‑stack hop.
3. Capture full error/stack before any fallback logic executes.
4. Remove or guard (`DEBUG_AI`) all temporary logs before commit.

---

## 5 · Mandatory Tests 🧪 (Vitest)

| Scope      | Recommended stack & helpers                                    |
| ---------- | -------------------------------------------------------------- |
| **Server** | Vitest + `supertest` (or `undici` test client)                 |
| **Client** | Vitest + React Testing Library + `@testing-library/user-event` |

* Run suites with `pnpm vitest run -r`.
* CI fails if coverage for touched files drops (`vitest run --coverage`).
* Use `--silent=false` locally to surface `[DEBUG‑AI]` logs.

> **Example skeleton server test** (remove when writing real specs):
>
> ```ts
> import { describe, it, expect } from 'vitest';
> import request from 'supertest';
> import app from '../../src/app';
>
> describe('GET /health', () => {
>   it('returns OK', async () => {
>     const res = await request(app).get('/health');
>     expect(res.status).toBe(200);
>     expect(res.body.ok).toBe(true);
>   });
> });
> ```

---

## 6 · Patch & Commit Convention 📝

```text
<type>(scope): <summary>

Problem: <why change was needed>
Solution:
* bullet
* bullet
```

* **Types:** feat / fix / chore / docs / test / refactor / perf / ci.
* Keep commit bodies concise; reference issue numbers where relevant.

---

## 7 · Code Style References 🧩

* Project is formatted by Prettier; linted by ESLint—**do not** override configs.
* React components in PascalCase; custom hooks start with `use…`.
* Remove stray `console.log`; keep `[DEBUG‑AI]` or `[AGENT‑PRECHECK]` only when gated behind env flags.

---

## 8 · Quick‑Start Commands 🏃

```bash
pnpm i             # install all workspaces
pnpm dev           # run client & server concurrently
pnpm type-check    # TypeScript project refs
pnpm lint -r       # lint all packages
pnpm vitest run -r # run tests
```

Verbose debug:

```bash
DEBUG_AI=true pnpm dev   # backend logs
# browser console:
window.DEBUG_AI = true   # frontend logs
```

---

## 9 · Changelog Reference

All contributors—human **and** AI—must follow **CHANGELOG\_GUIDE.md** when adding entries to `CHANGELOG.md`.

---

## 10 · Issue Reporting & Feedback

* File issues in GitHub with clear reproduction steps. If an agent was involved, prefix the title with `[Agent:<name>]`.
* Keep discussion and resolutions in the issue thread; link related PRs.

---

**End of file**
