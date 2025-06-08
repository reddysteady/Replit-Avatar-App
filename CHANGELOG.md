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

## 2025-06-09
- [Fixed] `ConversationThread` mutation now accepts `parentMessageId: number | null`.



