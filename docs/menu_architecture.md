## 📜 Menu Architecture (v1) <!-- keep heading stable for deep links -->

### Main (left-hand) menu

| Icon | Label             | Route                               | Page component         | Stored data touched                     | Core features / controls                                                                                                                           |
| ---- | ----------------- | ----------------------------------- | ---------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🧵   | **Conversations** | `/` <br>`/instagram` <br>`/youtube` | `ThreadedMessages.tsx` | `messages` (table) <br>`messageThreads` | List & search threads · unread badge · message composer · “Generate reply” with AI · per-thread **Auto-Reply** toggle · high-intent flag · archive |
| 📊   | **Insights**      | `/analytics`                        | `Analytics.tsx`        | `analytics`                             | Volume charts · high-intent heat-map · time-saved KPI · download CSV                                                                               |
| ⚙️   | **Settings**      | `/settings` (loads first sub-tab)   | `Settings.tsx`         | —                                       | Tabs jump into sub-pages below                                                                                                                     |

> **Mobile nav** surfaces the same items via `MobileHeader.tsx`.

---

### ⚙️ Settings subsections

| Sub-page                        | Route                        | Page component                                                | Stored data                                  | Key UI / logic                                                                          |
| ------------------------------- | ---------------------------- | ------------------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------- |
| 🧠 Persona (Voice & Boundaries) | `/settings/persona`          | `AvatarSettingsPage.tsx` → hosts `PrivacyPersonalityForm.tsx` | `personaConfig` JSON + `systemPrompt` string | Tone & style; allowed / restricted topics; fallback reply; prompt preview; last-updated |
| 📥 Content Sources              | `/settings/sources`          | `ContentSourcesPage.tsx` *(planned)*                          | `connectedSources[]`                         | OAuth connect/disconnect; ingest & redact; toggle for RAG usage                         |
| ⚙️ AI Behavior                  | `/settings/ai` (default tab) | **AI Settings** tab inside `Settings.tsx`                     | `aiSettings`                                 | Model, temperature, max tokens, global auto-reply, typing delay                         |
| 🔒 Moderation & Safety          | `/settings/moderation`       | `ModerationSettingsPage.tsx` *(planned)*                      | `moderationRules`                            | Restricted keywords, NSFW filter, escalation workflow, review queue                     |
| 📤 Replies & Delays             | `/settings/replies`          | `ReplyDelaySettingsPage.tsx` *(planned)*                      | `replySettings`                              | Typing simulation, send delay, manual approval queue, OOO replies                       |
| 💬 Prompt Preview (Dev)         | `/settings/prompt-preview`   | `PromptPreviewPage.tsx`                                       | `systemPrompt` + history                     | View / diff current prompt, run test message, copy prompt                               |

---

### Road-map (not yet in UI)

| Label               | Purpose                             | Notes                                                                |
| ------------------- | ----------------------------------- | -------------------------------------------------------------------- |
| 🤖 **Automation**   | Visual rule builder (“If X then Y”) | Cross-channel workflows, Zapier/Make export                          |
| 🧑‍🎤 **My Avatar** | Avatar appearance & public bio      | Photo / animation preview; editable display name; future intro video |

---

### UX & Dev conventions

* **Icons:** Greyscale by default; accent for active state. Sized 20 – 24 px.
* **Route naming:** Always kebab-case; group under `/settings/*` for any config.
* **Components:** One top-level page file per route; sub-components live in `client/src/components`.
* **Stored data:** All new per-user settings should serialize into the `settings` table inside the appropriate JSON column.
* **Doc linkage:** Whenever a route, label or component name changes, update this file *and* reference it from `AGENTS.md` Pre-Flight ▶ “Menu schema”.

---

> **Reminder to contributors:** When adding a new submenu, extend the table above, implement a Radix `NavItem` in both `Sidebar.tsx` and `MobileHeader.tsx`, create or update route in `App.tsx`, and write at least one Vitest rendering test that asserts the nav link exists and becomes active.
