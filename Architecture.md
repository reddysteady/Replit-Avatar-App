# Architecture

> **TL;DR** SocialTwin ingests Instagram DMs, stores them in Neon Postgres via
> Drizzle ORM, and (optionally) generates AI auto‑replies using OpenAI. A
> Vite/React client consumes the REST API. CI runs on GitHub Actions.

## 1. System Context

| Actor                        | Role                                   |
| ---------------------------- | -------------------------------------- |
| **Instagram Graph API**      | Sends DM webhooks                      |
| **SocialTwin API (Express)** | Validates, stores, triggers AI replies |
| **Neon Postgres**            | Persists threads, messages, settings   |
| **OpenAI**                   | Generates response text                |
| **GitHub Actions**           | Builds / tests / lints on every push   |

## 2. Component & Data‑Flow Diagram

%% SocialTwin – Message Flow graph TD IG[Instagram Webhook (incoming DM)] IG
-->|POST| API[/api/instagram/webhook] API --> AR[Auto-reply service] AR -->
Threads[(threads table)] AR --> Messages[(messages table)]

subgraph Client CT[ConversationThread] MQ[MessageQueue] MI[MessageItem] end

Messages & Threads -->|GET /api/threads/:id/messages| CT CT --> MQ --> MI CT
-->|POST /api/threads/:id/auto-reply| AutoReplyReq[(auto-reply req)] MI -->|POST
/api/threads/:id/send| SendMsg[(send msg)]

subgraph Optional Btn[Send Custom Message button] Btn -->|POST
/api/test/generate-for-user/:id| CustomAPI[(test route)] CustomAPI --> AR end

## 3. Runtime Sequence (Happy Path)

1. **Instagram** → `POST /api/instagram/webhook`
2. **Server** inserts inbound row → checks flags → calls `services/openai.ts`
3. AI reply saved (`isOutbound=true`)
4. **Client** fetches `/api/threads/:id/messages` via SWR → renders

## 4. Data Model (Drizzle Schema)

| Table      | Key columns                                     |
| ---------- | ----------------------------------------------- |
| `threads`  | `id`, `platform`, `autoReply`                   |
| `messages` | `id`, `threadId`, `isOutbound`, `isAiGenerated` |
| `settings` | `userId`, `autoReplyInstagram`, `temperature`   |

_Schema lives in `shared/schema.ts`._

## 5. Deployment & Ops

| Concern      | Current state                                      |
| ------------ | -------------------------------------------------- |
| **Runtime**  | Replit Nix for dev → Node 18 containers in prod    |
| **Database** | Neon Postgres (env `SUPABASE_DATABASE_URL`)                 |
| **Secrets**  | GitHub → Actions secrets & environment variables   |
| **Logging**  | Basic timestamped `logger.ts` (upgrade path: Pino) |

### 5.1 CI/CD Pipeline (GitHub Actions)

| File                       | Purpose                                    |
| -------------------------- | ------------------------------------------ |
| `.github/workflows/ci.yml` | Lint, type‑check, run Vitest, build client |
| _add more if needed_       |                                            |

_Key highlights:_ matrix jobs for Node 18 & 20, cached installs, least‑privilege
`permissions`.

## 6. Configuration Matrix

| Env var          | Required | Description                    |
| ---------------- | -------- | ------------------------------ |
| `SUPABASE_DATABASE_URL`   | ✅       | Neon connection string         |
| `OPENAI_API_KEY` | ✅       | Used by `services/openai.ts`   |
| `WEBHOOK_SECRET` | ⚠️       | Instagram signature validation |
|`INSTAGRAM_APP_ID`|

## 7. Observability (Planned)

- **Logs**: migrate to Pino → structured JSON shipped to Logtail/Datadog.
- **Metrics**: OTEL JS SDK → Honeycomb.
- **Dashboards‑as‑code** under `/observability`.

## 8. Troubleshooting FAQ

- **No AI reply?**

  1. Check `settings.autoReplyInstagram=true` and `thread.autoReply=true`.
  2. Query:

  ```sql
  select * from messages
  where thread_id = $1
  order by timestamp desc limit 5;
  ```

- **CI failing?** – Run `npm run lint && npm run type‑check && npm test` locally
  (mirrors Workflow). – Inspect Action logs in PR checks.

## 9. ADR Log

ADRs live in `/ADRs` (example: **ADR‑0001 Use Neon instead of Supabase**).

## 10. Glossary

| Term           | Meaning                       |
| -------------- | ----------------------------- |
| **Thread**     | One DM conversation           |
| **Auto‑reply** | AI‑generated outbound message |

---

### Editing tips

- Update the Mermaid diagram under section 2 whenever routes/components change.
- Commit diagram edits and `.png` exports together (consider `mermaid-cli`
  GitHub Action).
- Add new env vars to the matrix above and `.env.example`.
- For major design shifts, add an ADR and link it here.
