# Spec: Avatar Persona Autoconfiguration

## Objective

In Version 1, guide the creator through a textual GPT-led conversational onboarding flow to collect avatar configuration variables (tone, topics, fallback response style, etc.) without requiring any pre-ingested content. This phase may also support voice-based interactions in the future using Whisper, Eleven Labs or other text-to-speech solution.

In Version 2, expand the system to optionally incorporate social media content (e.g., Instagram, YouTube, Twitter/X) to infer tone, topics, and traits for creators who prefer automated suggestions. This supports dynamic system prompt generation aligned with the creator's objectives.

## Goals

* Identify creator objectives: build community, educate, entertain, convert leads
* Analyze message history to infer tone, style, key topics, and personality traits
* Generate suggested values for Persona config fields (`AvatarPersonaConfig`)
* Allow users to preview and accept/reject recommendations during setup

## Inputs

* Creator responses from GPT-led dialogue
* Optional based on user preference: creator-selected objective chip input (inferred via pattern with user updates/override)

## Output

* Suggested Persona prompt with structured variables (user can update/override)
* Auto-filled form values for: tone, styleTags, allowedTopics, restrictedTopics, fallbackReply (user can update/override)

## Persona Variables Mapped from Message History

| Variable             | Source Signal                                       | Extraction Method                                       |
|----------------------|----------------------------------------------------|----------------------------------------------------------|
| toneDescription      | Overall sentiment, expressive language             | Sentiment/tone analysis APIs using OpenAI function call  |
| styleTags            | Slang, emojis, punctuation, informal markers       | POS tagging, emoji frequency, slang detection            |
| allowedTopics        | Frequently discussed topics                        | Keyword frequency, keyphrase extraction                  |
| restrictedTopics     | Ignored/sensitive queries, flagged keywords        | Keyword redaction, moderation feedback                   |
| fallbackReply        | Historical non-answers or stalling phrases         | Pattern matching, rule-based logic                       |
| audienceDescription  | Common audience references or demographic cues     | Entity extraction, topic modeling, GPT-based summary     |

## System Prompt Structure (Generated)

```
You are {CreatorName}'s digital twin. Speak in this tone:
> "{toneDescription}"
Tags: {styleTags.join(", ")}

You are allowed to talk about these topics:
- {allowedTopics.join("
- ")}

You are strictly forbidden from discussing:
- {restrictedTopics.join("
- ")}

If a user asks about a restricted topic, respond with:
> "{fallbackReply}"

Always speak in the first person. Be emotionally engaging and authentic. Never reveal that you are an AI.

When appropriate, reflect the creator’s values, such as:
{optionalValues.join("
")}

If the creator has a signature style or phrase, occasionally include:
> "{quirksOrPhrases}"
You are {CreatorName}'s digital twin. Speak in this tone:
> "{toneDescription}"
Tags: {styleTags.join(", ")}

You are allowed to talk about these topics:
- {allowedTopics.join("\n- ")}

You are strictly forbidden from discussing:
- {restrictedTopics.join("\n- ")}

If a user asks about a restricted topic, respond with:
> "{fallbackReply}"

Always speak in the first person. Be emotionally engaging and authentic. Never reveal that you are an AI.
```

## Workflow

1. Run GPT-led onboarding dialogue
2. Extract structured fields using function calls
3. Map results to `AvatarPersonaConfig`
4. Populate config preview UI (`PrivacyPersonalityForm.tsx`)
5. Allow user to edit, confirm, and save

## Conversational Warm-Up Flow (Pre-Accordion Setup)

Before showing the accordion interface, users are guided through a short 5–8 step chat-style interaction that collects high-level intent and personality traits. The outcome is used to prefill the config form.

### Version 1 (Initial Implementation)

* GPT-led freeform text chat
* Anchored by a minimal required set of 9 intents:

  1. Tone & Vibe (`toneDescription`)
  2. Style Tags (`styleTags`)
  3. Allowed Topics (`allowedTopics`)
  4. Restricted Topics (`restrictedTopics`)
  5. Fallback Style (`fallbackReply`)
  6. Avatar Objectives (`avatarObjective[]`)
  7. Emotional Impact / Audience Feeling (e.g. values or extra)
  8. Signature Phrases or Emojis (`quirksOrPhrases`)
  9. Audience Description (`audienceDescription`)
* System prompt for GPT:

> "You are guiding a creator through setting up their digital twin avatar. Your job is to collect their tone, content style, and goals. You must ask for and extract these 9 items, in any conversational order: tone, style tags, allowed topics, restricted topics, fallback reply, avatar goals, emotional impact, signature phrases, and a short description of the intended audience (e.g., fitness beginners, aspiring creators, solo founders, etc.). You may rephrase or combine questions to feel natural. After each user message, summarize what you've extracted. If a required item is missing, ask for it next. If the user’s input is vague, incomplete, or trails off (e.g. ellipses, hesitations, vague references), gently prompt with follow-ups like “Want to add anything else?”, “Could you tell me a bit more about that?”, or “Would you say that’s a hard boundary or a soft preference?”"

* GPT uses function calls to extract structured config fields

The `/settings/persona` page presents a 5-step accordion-based onboarding flow:

1. **Avatar Objective Selection**

   * Multi-select chip interface with emoji-marked objectives
   * Chips include: Build Community, Educate, Entertain, Promote Brand, etc.
   * Selecting objectives triggers suggested defaults for tone, style, topics, etc.

2. **Tone & Style**

   * Suggested style tags based on selected objectives
   * Textarea for tone description with optional examples
   * Real-time voice preview from generated tone config

3. **Allowed & Restricted Topics**

   * Single chip list with cyclic toggle behavior:

     * Default (neutral): grey
     * Allowed: green
     * Restricted: red
   * Chips reflect system’s inferred suggestions but are editable by the user

4. **Fallback Reply Style**

   * Radio group with fallback behavior options (e.g., empathetic, redirect, humorous)
   * Optional custom fallback phrase field

5. **Prompt Preview**

   * Read-only view of the constructed system prompt
   * Option to copy or manually edit
   * Toggle: **Manual Override** – When enabled, the system prompt becomes editable text and stops syncing with persona fields

### UX Behavior

* Chat UI displays on first visit to `/settings/persona`
* Accordion opens after chat flow completes, skipping Step 1 if objectives already selected
* Completing a step collapses it and opens the next
* Progress indicators mark completed sections
* Advanced users can skip ahead, but final save is gated by required fields

## Manual Override Logic (for Codex agent)

If `manualOverride` is true:

* Show editable prompt textarea in `PromptPreview.tsx`
* Disable syncing prompt with personaConfig fields
* Save manual prompt string to `manualPromptText` in DB
* `buildSystemPrompt()` should return manualPromptText if override is enabled, otherwise dynamically build from `personaConfig`

### Version 2 (Enhanced UX)

* Retains all V1 GPT logic
* Adds frontend UX features:

  * Ghost text examples in input field
  * Clickable suggestion bubbles below input
  * Follow-up prompts for vague or trailing answers
* Improves guidance for users who aren’t sure how to answer
* Backwards compatible with V1 architecture

### Output:

* Prefills: toneDescription, styleTags, allowedTopics, restrictedTopics, fallbackReply, avatarObjective\[], greeting or quirks
* Proceeds to accordion at Step 2 with generated defaults: Progressive Accordion Flow

## Future Enhancements

* Enable voice-based onboarding with Whisper + GPT + TTS
* Allow multiple objectives per persona
* Recommend variations per platform (Instagram vs YouTube)
* Generate avatar quirks or greeting styles from historical phrasing
* Support import/export of prompt presets

## Related Files

* `PrivacyPersonalityForm.tsx`
* `buildSystemPrompt(config: AvatarPersonaConfig)`
* `PromptPreview.tsx`
* `settings.personaConfig` (DB)
* `systemPrompt` (used by OpenAI chat endpoint)

---

## Codex Agent Prompt

### 1. Context & Background

We're implementing an onboarding-style Persona setup flow using a chat-style warm-up followed by an accordion interface. The warm-up is powered by GPT and collects the creator’s tone, goals, and content preferences.

### 2. Objective & Scope

Build the GPT-backed chat interaction and progressive accordion form under `/settings/persona`. Add suggestion chips, follow-up prompts, and support for a manual override toggle that disables config sync.

**In-scope:**

* `PrivacyPersonalityForm.tsx`
* `PromptPreview.tsx`
* `buildSystemPrompt()`
* Persona config save and DB schema
* GPT prompt and suggestion handling in chat UI

**Out-of-scope:**

* NLP pipeline for social media ingestion
* Whisper/voice support (future)

### 3. Requirements & Steps

* Add GPT-powered pre-accordion conversational UI
* Show smart suggestions below input field for each chat message
* Use GPT + function calling to extract structured config fields
* Add follow-up questions for ambiguous or partial responses
* Use responses to auto-fill fields in `personaConfig`
* Implement accordion UI with 5 progressive steps
* Add chip-based selector for Avatar Objective
* Add cyclic chips for allowed/restricted topic selection
* Add fallback reply style selector
* Render preview from `buildSystemPrompt(config)`
* Add toggle to enable manual override:

  * When enabled, display editable textarea
  * Save string to `personaConfig.manualPromptText`
  * Set `personaConfig.manualOverride = true`
  * Disable other config controls
* Modify `buildSystemPrompt()` to return `manualPromptText` if override is true

### 4. Testing & Validation

* Unit test prompt generation logic
* E2E test persona flow
* Confirm dynamic-to-manual switch locks other UI
* Validate suggestion interaction and autofill behaviors

### 5. Code Quality & Documentation

* Follow linting + Prettier rules
* Add comments to `buildSystemPrompt()`
* Update README and settings docs

### 6. Commit & Changelog Guidelines

* Feature: Add GPT-driven warm-up and accordion onboarding to Persona form with prompt override toggle
* Update changelog if needed

### 7. Acceptance Criteria

*

### 8. Reference Docs

* [stage\_1\_persona.md](docs/persona)
* [menu\_architecture.md](docs/menu_architecture.md)
