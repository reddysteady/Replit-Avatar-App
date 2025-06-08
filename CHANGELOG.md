# Changelog

All notable changes to this project will be documented in this file.

## 2025-06-07
- [Added] Created `CHANGELOG.md` and added contribution instructions to `README.md`.

## 2025-06-07
- [Fixed] Missing `parentMessageId` from in-memory storage caused replies to show as top-level messages.
- [Changed] Instagram credentials now read from environment variables.
- [Fixed] Implemented thread support in `MemStorage` so replies nest correctly when using in-memory mode.

