## 📜 Menu Architecture - near term

### Main (left-hand) menu – Desktop

| Icon | Label             | Route                               | Page Component            | Notes                                                                                      |
|------|-------------------|-------------------------------------|---------------------------|--------------------------------------------------------------------------------------------|
| 💬   | Conversations      | `/` and all platform-specific routes (e.g. `/instagram`, `/youtube`)   | `ThreadedMessages.tsx`    | Unified inbox with AI reply, auto-reply toggle, intent flag, archive, thread view        |
| 📊   | Insights           | `/analytics`                        | `Analytics.tsx`           | Replaces "Analytics" label. Volume charts, intent trends, CSV export                      |
| ⚙️   | Settings           | `/settings`                         | `Settings.tsx`            | First sub-item (AI Behavior) loads by default                                              |
| 🧪   | Testing Tools      | `/settings/testing-tools`           | `TestingToolsPage.tsx`    | Admin only - Includes batch message gen, DB/cache reload, webhook setup                                |
| 🔒   | Privacy Policy     | `/settings/privacy`                 | `PrivacyPage.tsx`         | Static markdown page                                                                       |

---

### ⚙️ Settings Sub-pages (nested under Settings)

| Label               | Route                        | Page Component                 | Description                                                                                       |
|---------------------|------------------------------|--------------------------------|---------------------------------------------------------------------------------------------------|
| Content Sources     | `/settings/sources`          | `ContentSourcesPage.tsx`       | OAuth integration (e.g., Instagram), ingestion toggles, sync timestamps                          |
| Persona             | `/settings/persona`          | `AvatarSettingsPage.tsx`       | Voice & boundaries, tone description, tags, allowed/restricted topics, fallback response         |
| AI Settings         | `/settings/ai`               | `AISettingsPage.tsx`           | Model, temperature, max length, delay settings, flex toggle                                       |
| Automation          | `/settings/automation`       | `AutomationPage.tsx`           | Message triggers and auto-responses via rule builder. In future, may be configured via dialogue. |
| Notifications       | `/settings/notifications`    | `NotificationSettings.tsx`     | Email/in-app, digest frequency, high-intent triggers                                              |
| API Keys            | `/settings/api`              | `APIKeysPage.tsx`              | Token management for Instagram, OpenAI, and webhook base URL                                     |

---

### 📱 Mobile Navigation (Slide-out Drawer)

- Triggered via top-right burger menu
- Drawer slides in from the **right**
- Reuses same menu structure as desktop sidebar
- **Thread Actions** displayed *below* main menu when on `/` and all platform-specific routes (e.g. `/instagram`, `/youtube`)
  - Divider line separates Thread Actions (e.g. Generate Batch Messages, Generate Custom Message)

---

### UX Conventions

- Icons: 20–24px, greyscale default, accent on active (`#FF7300`)
- Route names: kebab-case and grouped by `/settings/*`
- Subpages in `Settings.tsx` use tabs or nested navigation depending on viewport
- Component location: All page-level components in `/client/src/pages` or `/components` as applicable

---

### Contributor Notes

- When modifying the menu, update this document and reference in `AGENTS.md`
- Ensure test coverage for route links using Vitest or equivalent
- Avoid duplication of communication style fields between Persona and AI Behavior