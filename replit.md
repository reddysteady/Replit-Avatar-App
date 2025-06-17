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
- ✓ Database schema configured and deployed
- ✓ Express server with API routes functional
- ✓ Frontend React application built and running
- ✓ Database connection issues resolved
- ✓ Application fully operational on port 5000
- ✓ Startup issues resolved - application launches successfully
- ✓ AI messaging system working with persona configuration
- ✓ Threaded messaging functionality operational

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
- 2025-06-17: Resolved application startup failures and parsing errors - application now launches successfully
- 2025-06-17: Confirmed all core functionality working: AI messaging, persona configuration, threaded conversations
- 2025-06-16: Fixed Persona configuration system - set up proper AvatarPersonaConfig with style tags, allowed/restricted topics, and fallback replies
- 2025-06-16: Verified AI responses now correctly use full persona system including topic restrictions and fallback handling
- 2025-06-16: Fixed Response Delay setting to properly affect auto-replies in threaded messages
- 2025-06-16: Resolved database connection timeout issues by switching to standard PostgreSQL configuration
- 2025-06-15: Fixed database connection issues by removing unsupported vector type
- 2025-06-15: Improved PostgreSQL pool configuration with proper timeouts
- 2025-06-15: Successfully deployed database schema and resolved startup failures
- 2025-06-13: Fixed module import errors for @faker-js/faker and dotenv packages

## User Preferences
- Non-technical user requiring simple explanations
- Prefers working application over technical details