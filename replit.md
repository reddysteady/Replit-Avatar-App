# AI-Powered Messaging Platform

## Project Overview
An intelligent AI-powered messaging platform that enables advanced digital communication through sophisticated context-aware technologies and adaptive interaction models.

### Technologies
- Node.js/Express backend with TypeScript
- React frontend with Vite
- PostgreSQL database with Drizzle ORM
- OpenAI GPT integration for AI responses
- Real-time message threading and conversation management
- Instagram and YouTube API integrations

## Current State
- ✓ Dependencies resolved (@faker-js/faker, dotenv)
- ✓ Database schema configured
- ✓ Express server with API routes functional
- ✓ Frontend React application built
- ⚠️ Workflow configuration issue: npm run dev only starts Vite, not full Express server

## Architecture
- **Backend**: Express server on port 5000 (includes both API and frontend serving)
- **Frontend**: React with Vite bundling, served by Express in development
- **Database**: PostgreSQL with message threads, users, messages, and related tables
- **Services**: Instagram, YouTube, AI (OpenAI), OAuth, Content management

## Startup Configuration Issue
The current `npm run dev` script only runs `vite` instead of the full Express server. The correct startup command is:
```bash
NODE_ENV=development npx tsx server/index.ts
```

This command starts the Express server which:
1. Serves API routes on port 5000
2. Integrates Vite middleware for frontend development
3. Handles both backend and frontend in a single process

## Recent Changes
- 2025-06-13: Fixed module import errors for @faker-js/faker and dotenv packages
- 2025-06-13: Identified workflow configuration discrepancy between npm scripts and actual server startup

## User Preferences
- Non-technical user requiring simple explanations
- Prefers working application over technical details