# Avatar App Menu Architecture

## Main Menu (Near-Term Architecture)

### 🧵 Conversations

**Purpose:**
Inbox for all message threads (DMs, comments, chats) connected to the user’s linked platforms.

**Features/Controls:**

* List of conversation threads (with unread indicator)
* Search and filter by user or channel
* Thread view: displays message history
* Message entry textbox
* AI generate reply
* Manual or auto-reply toggle per thread
* Intent flagging visual indicator
* Delete/archive thread

---

### 📊 Insights

**Purpose:**
Analytics dashboard for user engagement, avatar activity, and business value.

**Features/Controls:**

* Message volume chart (daily/weekly)
* Fan engagement breakdown (replies, high-intent, conversion)
* Time saved (messages handled by avatar)
* Sentiment analysis trends
* Download/export data

---

### ⚙️ Settings

> **All settings-related configuration is grouped under this main menu item.**
> Each subsection is a dedicated page within the Settings area.

#### 🧠 Persona

* **Purpose:** Configure the avatar’s communication style, boundaries, and safety preferences.
* **Features/Controls:**

  * PrivacyPersonalityForm (tone, style tags, allowed/restricted topics, fallback reply)
  * System prompt preview
  * Save and reset persona settings
  * Last-updated timestamp

#### 📥 Content Sources

* **Purpose:** Manage which social/content platforms are connected for ingestion and training.
* **Features/Controls:**

  * OAuth connect/disconnect for IG, YouTube, X, etc.
  * Show list of currently connected sources
  * Ingest content (manual/auto)
  * Review and redact imported chunks
  * Toggle which sources can be used for grounding avatar replies

#### ⚙️ AI Behavior

* **Purpose:** Control technical AI and language model parameters.
* **Features/Controls:**

  * Select language model (GPT-4, Claude, etc.)
  * Temperature slider (creativity vs. accuracy)
  * Max tokens (response length cap)
  * Global auto-reply toggle
  * Enable/disable typing delay
  * Prompt debug mode

#### 🔒 Moderation & Safety

* **Purpose:** Configure safety nets, restricted topics, and escalation rules.
* **Features/Controls:**

  * Add/remove restricted phrases or topics
  * Enable NSFW and hate speech filters
  * High-intent classifier threshold (manual override)
  * Define escalation workflows (flag to human, block, etc.)
  * Moderation logs and review queue

#### 📤 Replies & Delays

* **Purpose:** Control the pacing and review flow for avatar-generated messages.
* **Features/Controls:**

  * Enable/disable typing simulation (show “typing...” indicator)
  * Configure delay (randomized or fixed seconds)
  * Manual approval queue for high-intent/sensitive messages
  * Reply scheduling (future)
  * Out-of-office auto-responses

#### 💬 Prompt Preview (Dev)

* **Purpose:** Debug and review the current system prompt and prompt history for the avatar.
* **Features/Controls:**

  * View latest system prompt (as sent to the LLM)
  * Compare with previous versions
  * Test sample input messages with current prompt
  * Copy to clipboard
  * Show prompt diff when persona or model settings change

---

## 🚀 Potential Future (Roadmap Candidates)

### 🤖 Automation (Advanced Workflow/Endgame)

**Purpose:**
Platform for user-defined, multi-step automation and AI-driven rules (beyond messaging).

**Possible Features/Controls:**

* Complex rule builder ("If X then Y" workflows)
* Cross-channel automations
* Integration with external tools (Zapier/Make)
* Scheduled sequences, event-based triggers
* Advanced exception handling
* Auto-action logs and analytics

### 🧑‍🎤 My Avatar

**Purpose:**
Preview and customize the digital avatar’s appearance and public profile.

**Features/Controls:**

* Avatar preview (photo/animation)
* Edit display name and public bio
* Set avatar profile picture
* Public links and social handles
* Avatar introduction video upload (future)

---

**Note:**
Each page should have a clear header, brief description of its purpose, and context-sensitive help (tooltip or “Learn more” link) for each control.

