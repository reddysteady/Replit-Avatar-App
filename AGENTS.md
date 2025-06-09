# AGENTS.md

## AI Agents Used

### 1. OpenAI Codex

* **Role:** Automated code generation, completion, and refactoring in the Crypto Mini-Game PvP PoC project.
* **Scope:**

  * Generates backend (Node.js/Express) and frontend (HTML/JS) code.
  * Writes and updates smart contract code (Rust/Anchor).
  * Provides code suggestions and automated test scripts.
* **Integration:** Used via OpenAI API in Replit or other supported IDE integrations.

### 2. Replit AI Assistant

* **Role:** Conversational, context-aware coding assistant embedded within Replit's IDE.
* **Scope:**

  * Provides in-IDE code explanations, refactoring suggestions, and answers technical questions.
  * Can generate code, explain errors, and automate basic project scaffolding.
  * Assists with dependency management and debugging guidance.
* **Integration:** Available directly inside the Replit workspace as an AI-powered assistant panel or chat.

### 3. Human Developers

* **Role:**

  * Design architecture.
  * Review, test, and approve all AI-generated code.
  * Own deployment and production merges.

---

## Agent Protocols & Guidelines

* **All AI-generated code must be:**

  * Documented in the `CHANGELOG.md` before being committed or merged.
  * Marked with a top-of-file comment referencing the changelog and change reason.
  * Reviewed by a human before deployment.

* **AI agents (like Codex and Replit Assistant):**

  * Are not permitted to deploy code or merge to production branches autonomously.
  * May generate boilerplate, code fixes, refactoring, and unit tests.
  * Should include inline comments describing what was changed and why.
  * After generating code or tests, agents must run `npm run check` to validate correctness.
  * If errors are returned, the agent should attempt to fix them or create a new task to fix the error before the code is committed.
  * Before creating or committing changes, agents must:
  - Pull the latest code from the target branch (`git pull origin main`)
  - Check for potential file conflicts in modified or related files
  - Run `git diff` or `git status` to detect uncommitted or overlapping changes
  - If conflicts are detected, agents must regenerate or adjust code to merge cleanly before creating a PR

---
## 🧪 Unit Testing Expectations for AI-Generated Code

* All AI-generated functions must include unit tests using **Jest**.
* Tests must cover:
  - Standard (happy path) behavior
  - Common edge cases, including:
    - Missing or malformed input
    - External API or system failures
    - Invalid user behavior
    - Duplicate or out-of-order requests
    - Configuration or environment errors
* External dependencies (e.g., API calls) must be mocked.
* Tests should fail if logic is broken and clearly describe the scenario being validated.
* Agents must use the prompt suffix:  
  > “Also generate a Jest unit test that covers expected behavior and edge cases such as input validation errors, API failures, and misconfiguration.”


## Best Practices & Limitations

* **Human-in-the-Loop:** All major architecture, security, or payment-related code must be human-reviewed.
* **Change Review:** AI-generated changes should be compared to the existing codebase and changelog to prevent redundant fixes.
* **Agent Limitations:**

  * Codex and Replit Assistant may not fully understand context or business logic—always verify output.
  * Do not use Codex or Replit Assistant for sensitive data management, wallet key handling, or production deploys.

---

## Agent Change Documentation

* All agent actions and generated code must be referenced in the changelog, with a note indicating “AI-generated” (e.g., `[Codex]`, `[Replit Assistant]`). Date should be in Pacific Time. If that date already exist add change item with the existing date section.
* Example changelog entry:

  ```
  ## [2025-06-05]
  ### Added
  - [Codex] Generated new function for match result signing in backend/server.js.
  - [Replit Assistant] Refactored wallet connection logic in frontend/game.js for better error handling.
  ```

---

## Issue Reporting & Feedback

* **All issues—including those related to AI-generated code—should be recorded in the GitHub Issues tracker.**

  * Prefix the issue title with `[Agent]` and note the specific agent (e.g., `[Codex]` or `[Replit Assistant]`) if relevant.
  * Assign appropriate labels or categories for better filtering and tracking.
  * Provide a clear description of the issue, the agent involved, and any relevant context or reproduction steps.
* Discussion, resolution notes, and closing status should be updated directly within the GitHub Issue.

---

**(End of file)**
