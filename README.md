# Replit-Avatar-App

![CI](https://github.com/owner/repo/actions/workflows/ci.yml/badge.svg)

This project powers an avatar messenger application built with Node.js and React.

## Environment Variables

Create a `.env` file with the following variables:

- `DATABASE_URL` – PostgreSQL connection string for the server database
- `OPENAI_API_KEY` – API key used when generating AI replies
- `INSTAGRAM_APP_ID` – Facebook App ID for Instagram OAuth
- `INSTAGRAM_APP_SECRET` – Facebook App Secret for Instagram OAuth
- `INSTAGRAM_VERIFY_TOKEN` – Token used to validate incoming Instagram webhooks
- `VITE_INSTAGRAM_APP_ID` – Front-end copy of `INSTAGRAM_APP_ID`
- `WEBHOOK_BASE_URL` – Base URL for constructing webhook callbacks

The test suite expects these environment variables (or suitable mocks) to be present when running `npm test`.

## Setup

Run `npm install` before executing tests or starting the server so the
project's dev dependencies, including the `vitest` test runner, are available.
Running `npm test` will automatically install dependencies if they are missing.

## Updating this README

Before making any changes, please:

1. All code changes—whether authored by humans or AI agents—**must** be recorded in `CHANGELOG.md`. Follow the exact conventions outlined in
[CHANGELOG_GUIDE.md](./CHANGELOG_GUIDE.md)
2. Add a top-of-file comment in any source file you modify, pointing to the new changelog entry.
3. Provide concise inline comments describing what was changed and why.
4. Submit small, atomic commits.

Following these steps keeps the README and the project history clear for everyone.

## Admin Tools

Open the **Testing Tools** page from the sidebar when running the dev server.
Use **Generate Batch Messages** to create 10 demo messages (at least three flagged high intent).
Use **Generate For Thread** to add a fake incoming message to a specific thread ID.
The Tools dropdown has returned to the Messages page header for quick access, but the dedicated Testing Tools page remains available.

## Continuous Integration

This project uses a GitHub Actions workflow located at `.github/workflows/ci.yml` to
run TypeScript checks and tests on every push.
