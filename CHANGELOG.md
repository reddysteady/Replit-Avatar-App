<!-- CHANGELOG.md -->

Follow the instructions in [Changelog Guide](CHANGELOG_GUIDE.md) to update this
CHANGLOG.md file.

## 2025-06-07

- [Added] Created `CHANGELOG.md` and added contribution instructions to
  `README.md`.
- [Fixed] Missing `parentMessageId` from in-memory storage caused replies to
  show as top-level messages.
- [Fixed] Implemented thread support in `MemStorage` so replies nest correctly
  when using in-memory mode.
- [Fixed] Missing `parentMessageId` from in-memory storage caused replies to
  show as top-level messages.
- [Added] GitHub Actions workflow running TypeScript and test checks.
- [Changed] Instagram credentials now read from environment variables.
- [Fixed] Implemented thread support in `MemStorage` so replies nest correctly
  when using in-memory mode.
- [Changed] Reply endpoint switched to `/api/${source}/reply` and payload now
  includes `messageId`.
- [Fixed] Messages with parentMessageId of 0 are now stored as null; client
  sends null for new parent messages.
- [Fixed] `ConversationThread` mutation now accepts
  `parentMessageId: number | null`.

## 2025-06-08

- [Added] `npm test` now runs a pretest script that installs dependencies if
  `vitest` is missing.
- [Added] README notes that `npm install` must be run so the `vitest` runner is
  available.
- [Codex][Added] Orange avatar ring for high intent conversations in `ThreadRow`
  and `ConversationThread`.
- [Codex][Added] Gated client logger and removed legacy ConversationThread
  files.
- [Codex][Changed] Updated conversation chip styling in `ThreadRow.tsx` to use a
  grayscale palette.
- [Codex][Fixed] Serialized objects in `ConversationThread.tsx` when logging to
  avoid TypeScript errors.
- [Codex][Added] Sample conversation data for UI testing with high-intent flag.
- [Codex][Fixed] Converted object logging calls in ConversationThread to strings
  for TypeScript compatibility.
- [Codex][Fixed] High-intent threads are now flagged correctly.
- [Codex][Fixed] UI now displays sample threads when no data is returned.
- [Codex][Added] Message and thread deletion with WhatsApp-style actions.

## 2025-06-09

- [Codex][Added] Faker-based message generation endpoints with tests and UI
  accordion tools.
- [Codex][Added] Message and thread deletion with WhatsApp-style actions.
- [Codex][Fixed] Deletion actions now immediately update the UI cache.
- [Codex][Changed] Conversation chips are lighter gray; selected threads now use
  a darker highlight.
- [Codex][Fixed] Selected thread styling broke due to missing `selected` prop in
  `ThreadRow`.
- [Codex][Fixed] `selected` defaults to `false` in `ThreadRow` to prevent
  runtime errors.
- [Codex][Fixed] Thread list messages now truncate within the container and show
  the full text on hover or long press.
- [Codex] [Fixed] Stopped auto-selecting the first thread after deletion so the
  conversation pane clears.
- [Codex][Fixed] Conversation list now shows the latest message with the
  sender's first name.
- [Codex][Fixed] Restored conversation chip rendering in `ThreadRow` and added
  unit test.
- [Codex][Fixed] Thread list now refreshes immediately after sending a reply so
  the left pane chip updates.
- [Codex][Fixed-3] Added `min-w-0` to `ThreadRow` container so conversation
  chips truncate correctly.
- [Codex][Added] Sidebar now includes a link to the Testing Tools page.
- [Replit Assistant][Changed] README now directs users to the Testing Tools page
  instead of the Messages page Tools accordion.
- [Codex][Changed] Tools menu restored to the main Messages interface for easier
  access.
- [Codex][Changed] Tools dropdown aligned with trigger using `right-0` so menu
  stays on screen.
- [Codex][Changed] "Generate For Thread" now uses a dropdown populated with
  thread names.
- [Codex][Changed] `/api/test/generate-for-user` now uses thread participant
  details and generates content referencing the participant.
- [Codex][Fixed] `/api/test/generate-for-user` returns messages with nested
  sender info so avatars display.
- [Codex][Added] Tools accordion on Messages page now includes refresh and
  webhook options.

## 2025-06-10

- [Codex] Added "Generate Reply" button in `ConversationThread` for AI-assisted
  replies.
- [Codex] Fixed Message deletion now fades out and doesn't scroll to the bottom.
- [Codex] [dded]"Generate Reply" button in `ConversationThread` for AI-assisted
  replies.
- [Codex] [Added] Settings page now includes a Flex processing toggle and
  backend honors the field in OpenAI requests.
- [Codex] [Changed] Desktop view now wraps long message text instead of
  truncating it.
- [Codex] [Changed] Conversation thread now aligns outbound messages to the
  right and removes avatars for a WhatsApp-style view.
- [Codex] [Added] Composer "Generate Reply" button populates the message input.
- [Codex] [Changed-4] Dropdown menu now shows a grey chevron icon and only a
  Delete option.
- [Codex][Removed] Vertical thread lines from conversation and reply UI.
- [Codex][Fixed] Query invalidation keys now match `useMessages` so batch
  message generation refreshes all pages.
- [Codex] Generate Reply buttons now use a robot icon with a blue background.
- [Codex][Changed] "Updated bullet format examples in README.md, AGENTS.md, and
  CHANGELOG.md."
- [Codex][Changed] "Fixed spacing after agent name in README and CHANGELOG
  examples."
- [Codex] Clarified README changelog instructions and agent guidelines for
  missing date sections.
- [Codex] `/api/test/generate-for-user` accepts a `content` body so admins can
  send custom messages from the Tools menu.
- [Codex][Fixed] `/api/test/generate-for-user` now correctly uses the `content`
  body when provided.

## 2025-06-11

- [Codex][Added] TypeScript and ESLint build scripts.
- [Codex][Changed] Fixed lint/type-check errors across src.
- [Codex][Fixed] Mobile conversation view no longer shows filter dropdown.
- [Codex][Added] `ChatHeader` component mimics WhatsApp chat header with back
  button and avatar.
- [Codex][Added] Sidebar link and new route for Privacy Policy page.
- [Codex][Changed] `/api/threads/:id/generate-reply` now generates dynamic
  replies using user settings.
- [Codex][Changed] AI Model setting now determines which OpenAI model is used
  for replies.
- [Codex][Added] Unit test confirms custom model is passed to the OpenAI API.
- [Codex][Fixed] Generate Reply now returns OpenAI content.
- [Codex][Fixed-2] Load env early in AI service so replies use OpenAI.
- [Codex][Added] OPENAI_API_KEY example variable.
- [Codex][Fixed-3] AI service now falls back to stored OpenAI tokens when env
  key is missing.
- [Codex][Changed-4] Warn when OpenAI API key missing and log updates to
  /api/settings. [Codex][Fixed-4] generateAiReply now checks response.ok and
  logs server errors. [Codex][Changed] AI service prefers stored OpenAI token
  over environment variable.

## 2025-06-12

- [Codex][Changed] Removed manual dotenv parser from AI service.
- [Codex][Fixed] AI reply generation errors now show detailed messages.
- [Codex][Fixed] generateReply correctly accesses keySource across error
  handling.
- [Codex][Removed] Mobile long press to expand messages. [Codex][Changed] Mobile
  chat header now includes menu icon and sits at page top. [Codex][Changed]
  ChatHeader only appears in conversation view; thread list restored
  MobileHeader. [Codex][Changed] Burger menu items now use minimal text styles.
  [Codex][Changed] Burger menu padding trimmed and icons added for thread
  actions.
- [Codex][Changed] Mobile conversation view now uses `ChatHeader` for
  WhatsApp-style back navigation.
- [Codex][Removed] Removed page header so `ChatHeader` sits at top.
- [Codex][Changed] Burger menu opens as overlay panel with grouped tools.
- [Codex][Fixed] Restored desktop header with page title, tools, and filter
  menu. [Codex][Changed] ChatHeader displayed on mobile conversation view only.
- [Codex][Added] DEBUG_AI logs around batch message generation for
  troubleshooting.
- [Codex][Added] `/api/content/search` endpoint for embedding-based content
  lookup.
- [Codex][Added] Migration adds PGVector extension and `content_items` table.
- [Codex][Fixed] ChatHeader now shows on mobile when selecting a thread.
- [Codex][Added] Documented SUPABASE_DATABASE_URL, OPENAI_API_KEY, and other
  server environment variables in README.
- [Codex][Added] /api/content/search endpoint and ranking tests.
- [Codex][Added] Content item storage and vector search. [Codex][Added] Thread
  auto-reply patch route with storage update. [Codex][Added] autoReply field to
  MessageThread schema. [Codex][Fixed] Removed duplicate variable in
  findSimilarContent.
- [Codex][Added] Auto-reply label for AI responses. [Codex][Added] Per-thread AI
  reply toggle and PATCH endpoint. [Codex][Fixed] Auto-reply schema cleanup and
  patch route response shape. [Codex][Changed] Instagram webhook checks thread
  `autoReply` before sending AI replies. [Codex][Changed] Custom messages
  trigger AI auto-reply when settings allow.

## 2025-06-13

- [Codex][Fixed] ThreadList uses `autoReply` payload when toggling per-thread AI
  replies.
- [Codex][Changed] Instagram auto-replies require both global and thread flags;
  `processNewMessage` now returns the saved message and thread.
- [Codex][Fixed] Send Custom Message now auto-replies after settings load.
- [Codex][Changed] Send Custom Message button waits for settings cache before
  enabling.
- [Codex][Added] Deep debug trace in Messages mutation when auto-reply triggers.
- [Codex][Fixed] Fallback fetch ensures AI settings exist before evaluating
  channel flags.
- [Codex][Fixed] Fallback fetch ensures AI settings exist before evaluating
  channel flags.
- [Codex][Fixed] Test route now triggers AI auto-reply when enabled.
- [Codex][Added] Coverage for auto-reply in generate-for-user route.
- [Codex][Fixed] Mobile ChatHeader menu shows actions even without callbacks.
- [Codex][Added] Unit test for custom message auto-reply.
- [Codex][Added] ChatHeader menu generates custom message for active thread.
- [Codex][Changed] Burger menu includes textbox to send custom message; button
  disabled when empty.
- [Codex][Changed] Adjust AI Replies row layout in `ThreadRow` for a tighter
  grouping.

## 2025-06-15

- [Codex][Changed] Right-align AI Replies toggle in `ThreadRow`.
- [Codex][Fixed-2] Batch messages now create threads and refresh the thread
  list.
- [Codex][Added] Configurable response delay for automated AI replies.
- [Codex][Added] AvatarPersonaConfig interface for persona setup described in
  docs/stage_1_persona.md.
- [Codex][Fixed] Restored mobile burger menu in ThreadedMessages.
- [Codex][Fixed] Removed extra top padding on mobile conversation screen.
- [Codex][Added] Persona settings route and sidebar link.
- [Codex][Added] PrivacyPersonalityForm and AvatarSettingsPage.
- [Codex][Added] buildSystemPrompt utility and persona API storage.
- [Codex][Changed] OpenAI service uses stored systemPrompt.
- [Codex][Added] Thread delete popover with confirmation in `ThreadRow` and
  state handling in `ThreadList`.
- [Codex][Changed] Navigation updated to match docs/menu_architecture.md for
  desktop and mobile.
- [Codex][Changed] Switched routing to react-router-dom.
- [Codex][Fixed] Batch message senderId uses nanoid to avoid duplicates.

## 2025-06-16

- [Codex][Fixed] System prompt preview textarea no longer stretches past page.
- [Codex][Changed] Tone & Style textarea height increased for easier editing.
- [Codex][Changed] Default settings now omit legacy creatorToneDescription
  field.
- [Codex][Changed] AIService builds system prompt from personaConfig or default
  constant.
- [Codex][Changed] `creatorToneDescription` removed from settings API responses
  and validation.
- [Codex][Added] AIService tests confirm personaConfig prompt handling.
- [Codex][Changed] `createMessage` and `addMessageToThread` now strip `id`
  before insert.
- [Codex][Added] DEBUG_AI log before custom message fetch in `ThreadedMessages`.
- [Codex][Docs] Explained thread prerequisites in README.

- [Codex][Changed-2] Replaced creatorToneDescription with personaConfig across
  codebase.
- [Codex][Changed] Persona API schema enforces non-empty strings and arrays.
- [Codex][Fixed] Database status check typing errors.
- [Codex][Changed] Persona API schema enforces non-empty strings and arrays.
- [Codex][Fixed] Database status check typing errors.
- [Codex][Fixed] AvatarSettings shows server error message on save failure.
- [Codex][Fixed] Database status endpoint typings for type-check.
- [Codex][Changed] PrivacyPersonalityForm now stores presets in state so saved
  style tags and topics display after reloading.
- [Codex][Fixed] Clearing persona resets form fields to defaults in
  PrivacyPersonalityForm.
- [Codex][Changed] Allow removal of style and topic chips via × button.

## 2025-06-17

- [Codex][Changed] Persona tags use chip-based UI with electric blue selection.
- [Codex][Changed] Allowed and restricted topics combined into tri-state chips.
- [Codex][Added] Tests check rendering of new chips.
