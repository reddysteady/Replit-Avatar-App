# AGENTS.md

This document is the **single source of truth** for how automated agents (e.g.
OpenAI Codex, Replit AI Assistant) and human contributors collaborate on any
coding task in this repository. Keep it **generic**—language‑, framework‑ and
feature‑agnostic. If a feature needs domain‑specific rules (e.g. OpenAI
integration), link out to a dedicated doc instead of bloating this file.

---

## 1 · Agents & Roles

| Agent            | Primary Role                                                       | Notes                                 |
| ---------------- | ------------------------------------------------------------------ | ------------------------------------- |
| **OpenAI Codex** | Generate, refactor, and fix code; scaffold tests; draft docs.      | Triggered via CLI or IDE extension.   |
| **Replit AI**    | Conversational, in‑IDE assistant for quick snippets & explanations | Lives inside the Replit workspace UI. |
| **Humans**       | Design architecture; review & merge PRs; own production deploys    | Always have the final sign‑off.       |

---

## 2 · Agent Protocols & Guidelines

- **All generated code must be:**

  - Recorded in `CHANGELOG.md` following **CHANGELOG_GUIDE.md**.
  - Annotated at the top of each new/edited file with the reason for change.
  - Validated by npm run type-check, npm run lint, and npm test before commit.


- **Agents may not** merge to protected branches or deploy; humans must review.
- **Conflict detection:** Agents must pull latest, run `git diff`, and
  regenerate if merge conflicts appear.
- **Sensitive data:** Agents must never hard‑code secrets or write plaintext
  keys.

---

## 3 · Pre‑Flight Checklist ✅

Log each step with `[AGENT‑PRECHECK]`. Abort if any item fails.

1. Working tree is clean **or** a feature/fix branch is checked out.
2. Always check for all required environment variables (see `README.md → Environment Variables`) before running tests, builds, or the app.
     - Reference `.env.example` for all keys.
     - If a variable is missing, **do not** create a dummy value in code—fail fast with a clear error.
     - If an agent or script detects missing env vars, prompt the human user to set them or update `.env.example`.
     - Only run the pre-flight checklist when actual secrets are present; never "fake pass" by inventing placeholders.
4. .npm run type-check and npm run lint pass.
5. .npm test passes (Vitest suite).
6. If the task touches an **external service** (API, DB, queue, etc.) run its
   health‑check script under `scripts/health/` and ensure success.

---

## 4 · Standard Debug Flow 🔍

Tag runtime diagnostics with `[DEBUG‑AI]`.

1. Reproduce the bug; capture UI/network trace if applicable.
2. Add **temporary** `console.debug('[DEBUG‑AI]', …)` at entry & exit of each
   call‑stack hop.
3. Capture full error/stack before any fallback logic executes.
4. Remove or guard (`DEBUG_AI`) all temporary logs before commit.

---

## 5 · Mandatory Tests 🧪 (Vitest)

| Scope      | Recommended stack & helpers                                    |
| ---------- | -------------------------------------------------------------- |
| **Server** | Vitest + `supertest` (or `undici` test client)                 |
| **Client** | Vitest + React Testing Library + `@testing-library/user-event` |

- Run suites with npm test.
- CI fails if coverage for touched files drops (npm test -- --coverage).
- Use `--silent=false` locally to surface `[DEBUG‑AI]` logs.

> **Example skeleton server test** (remove when writing real specs):
>
> ```ts
> import { describe, it, expect } from 'vitest'
> import request from 'supertest'
> import app from '../../src/app'
>
> describe('GET /health', () => {
>   it('returns OK', async () => {
>     const res = await request(app).get('/health')
>     expect(res.status).toBe(200)
>     expect(res.body.ok).toBe(true)
>   })
> })
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

- **Types:** feat / fix / chore / docs / test / refactor / perf / ci.
- Keep commit bodies concise; reference issue numbers where relevant.

---

## 7 · Code Style References 🧩

- All Markdown/YAML/JSON files must be formatted with Prettier.
  - Run `npm run format` before every commit.
  - CI will fail if formatting does not match.
- Linted by ESLint—**do not** override configs.
- React components in PascalCase; custom hooks start with `use…`.
- Remove stray `console.log`; keep `[DEBUG‑AI]` or `[AGENT‑PRECHECK]` only when gated behind env flags.

---

## 8 · Quick‑Start Commands 🏃

```bash
Line	Change
npm install # install dependencies
npm run dev # run client & server concurrently
npm run type-check # TypeScript project refs
npm run lint # lint all packages
npm test # run Vitest suite
DEBUG_AI=true npm run dev # backend logs
```

Verbose debug:

```bash
DEBUG_AI=true pnpm dev   # backend logs
# browser console:
window.DEBUG_AI = true   # frontend logs
```

---

## 9 · Changelog Reference

All contributors—human **and** AI—must follow **CHANGELOG_GUIDE.md** when adding
entries to `CHANGELOG.md`.

---

## 10 · Issue Reporting & Feedback

- File issues in GitHub with clear reproduction steps. If an agent was involved,
  prefix the title with `[Agent:<name>]`.
- Keep discussion and resolutions in the issue thread; link related PRs.

---

**End of file**
