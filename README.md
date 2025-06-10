# Replit-Avatar-App

![CI](https://github.com/owner/repo/actions/workflows/ci.yml/badge.svg)

This project powers an avatar messenger application built with Node.js and React.

## Environment Variables

Create a `.env` file with the following variables:

- `INSTAGRAM_APP_ID` – Facebook App ID for Instagram OAuth
- `INSTAGRAM_APP_SECRET` – Facebook App Secret for Instagram OAuth
- `VITE_INSTAGRAM_APP_ID` – Front-end copy of `INSTAGRAM_APP_ID`

## Setup

Run `npm install` before executing tests or starting the server so the
project's dev dependencies, including the `vitest` test runner, are available.
Running `npm test` will automatically install dependencies if they are missing.

## Updating this README

Before making any changes, please:

1. Check the latest `CHANGELOG.md` to ensure you’re not duplicating efforts.
2. Create or update `CHANGELOG.md` with a dated entry in the correct format (`[Added]`, `[Changed]`, `[Fixed]`, `[Removed]`).
3. Add a top-of-file comment in any source file you modify, pointing to the new changelog entry.
4. Provide concise inline comments describing what was changed and why.
5. Submit small, atomic commits.

Following these steps keeps the README and the project history clear for everyone.

## Admin Tools

Open the **Testing Tools** page from the sidebar when running the dev server.
Use **Generate Batch Messages** to create 10 demo messages (at least three flagged high intent).
Use **Generate For Thread** to add a fake incoming message to a specific thread ID.
The Tools dropdown has returned to the Messages page header for quick access, but the dedicated Testing Tools page remains available.

## Continuous Integration

This project uses a GitHub Actions workflow located at `.github/workflows/ci.yml` to
run TypeScript checks and tests on every push.
