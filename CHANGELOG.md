# Changelog

All notable changes to this project will be documented in this file.

## 2025-06-07
- [Added] Created `CHANGELOG.md` and added contribution instructions to `README.md`.
- [Fixed] Missing `parentMessageId` from in-memory storage caused replies to show as top-level messages.
- [Fixed] Implemented thread support in `MemStorage` so replies nest correctly when using in-memory mode.
- [Fixed] Missing `parentMessageId` from in-memory storage caused replies to show as top-level messages.
- [Added] GitHub Actions workflow running TypeScript and test checks.
- [Changed] Instagram credentials now read from environment variables.
- [Fixed] Implemented thread support in `MemStorage` so replies nest correctly when using in-memory mode.

## 2025-06-08
- [Changed] Reply endpoint switched to `/api/${source}/reply` and payload now includes `messageId`.
- [Fixed] Messages with parentMessageId of 0 are now stored as null; client sends null for new parent messages.

## 2025-06-09
- [Fixed] `ConversationThread` mutation now accepts `parentMessageId: number | null`.

## 2025-06-08
- [Added] `npm test` now runs a pretest script that installs dependencies if `vitest` is missing.
- [Added] README notes that `npm install` must be run so the `vitest` runner is available.
- [Codex][Added] Orange avatar ring for high intent conversations in `ThreadRow` and `ConversationThread`.



## 2025-06-10
- [Codex][Added] Gated client logger and removed legacy ConversationThread files.
- [Codex][Changed] Updated conversation chip styling in `ThreadRow.tsx` to use a grayscale palette.
- [Codex][Fixed] Serialized objects in `ConversationThread.tsx` when logging to avoid TypeScript errors.

- [Codex][Added] Sample conversation data for UI testing with high-intent flag.
- [Codex][Fixed] Converted object logging calls in ConversationThread to strings for TypeScript compatibility.
- [Codex][Fixed] High-intent threads are now flagged correctly.
