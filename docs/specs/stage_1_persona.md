# Feature Spec: Stage 1 - Avatar Persona Setup (Voice & Boundaries)

---

## Menu Placement & Page Title

- **Menu Location:**  
 On the Persona page under the Settings menu.
```

````
- **Route:**  
`/settings/persona`
- **Menu Label:**  
`Persona`
- **Page Title:**  
At the top of the page, display:  
**Persona: Voice & Boundaries**

> This ensures users can easily find and understand where to configure their avatar’s communication style and boundaries.

---

## Overview
This feature enables creators to define their avatar's tone, personality, and conversational boundaries through a structured UI. The collected configuration is transformed into a dynamic system prompt that governs how the AI responds on the creator's behalf. This is the first step in a multi-stage persona development pipeline.

---

## Goals
- Allow creators to describe their avatar's communication style.
- Enable explicit control over allowed and restricted topics.
- Define fallback responses for sensitive or off-limits topics.
- Generate a dynamic AI system prompt from the saved configuration.
- Prepare the system for subsequent stages (e.g. content ingestion).

---

## Components

### 1. PrivacyPersonalityForm.tsx
- Built with React, Tailwind CSS, and ShadCN UI.
- Form sections:
- **Tone & Style:** Textarea + tag-style checkboxes.
- **Allowed Topics:** Checkbox list + freeform input.
- **Restricted Topics:** Checkbox list + freeform input.
- **Fallback Response:** Radio button group + custom option.
- "Save Preferences" button triggers `onSave` callback with full config object.
- **Codex Prompt:**
> Build a complete React component called `PrivacyPersonalityForm.tsx` using Tailwind and ShadCN UI. Include sections for tone description, allowed and restricted topics (both with checkboxes and freeform fields), and fallback responses (radio group + optional text input). Ensure validation for required fields. On save, return the full `AvatarPersonaConfig` object via the `onSave` callback.

### 2. AvatarPersonaConfig (TypeScript Interface)
```ts
interface AvatarPersonaConfig {
toneDescription: string;
styleTags: string[];
allowedTopics: string[];
restrictedTopics: string[];
fallbackReply: string;
}
````

* **Codex Prompt:**

  > Define a fully documented TypeScript interface `AvatarPersonaConfig` containing fields for tone description, style tags, allowed topics, restricted topics, and a fallback reply. Add JSDoc-style comments for each field explaining its purpose.

### 3. buildSystemPrompt(config: AvatarPersonaConfig): string

* Injects config into a structured system prompt string.
* Output format includes:

  * Tone description
  * Allowed and restricted topics
  * Fallback response directive
  * Instructions to always speak as the creator (first person)
  * Guardrails to avoid AI self-reference
* **Codex Prompt:**

  > Create a function `buildSystemPrompt(config: AvatarPersonaConfig)` that returns a complete system prompt as a string. The prompt must include tone description, allowed topics, restricted topics, fallback instructions, and a rule to always speak in the creator's voice without disclosing that it is AI. Ensure proper formatting and escaping of user input.

### 4. AvatarSettingsPage.tsx

* Hosts the `PrivacyPersonalityForm`.
* Implements `handlePersonaConfig()`:

  * Calls `buildSystemPrompt()` with config
  * Stores resulting prompt in component state
  * Can optionally preview the prompt in UI
* **Codex Prompt:**

  > Build a page `AvatarSettingsPage.tsx` that renders the `PrivacyPersonalityForm` component. On form submission, invoke `handlePersonaConfig(config)` which generates the system prompt using `buildSystemPrompt` and stores it in a local state variable. Add a collapsible section that displays the generated prompt for preview. Ensure the prompt can be copied for debugging.

### 5. System Prompt Integration

* `systemPrompt` is passed into chat completion API request (OpenAI, etc).
* Ensures consistent avatar behavior across all conversations.
* **Codex Prompt:**

  > Modify the server-side chat handler to retrieve the saved `systemPrompt` for the current user/avatar, and inject it as the `system` role message in the OpenAI chat completion API. Ensure fallback to a default prompt if user config is missing.

---

## Example Prompt Output

```
You are Jamie Lee's digital twin. You speak in this tone:
> "Playful, sarcastic, Gen Z vibes with lots of emojis 😜"
Tags: Friendly, Sarcastic

You are allowed to talk about these topics:
- My pets
- My skincare routine
- My favorite snacks

You are strictly forbidden from discussing:
- My dating life
- Where I live

If a user asks about a restricted topic, you must respond with:
> "Haha, that's something I keep to myself 😄"

Always speak in the first person as if you are Jamie. Be authentic, emotionally engaging, and reflect their known personality. Never reveal that you are an AI or assistant.
```

---

**Additional Assessment/Clarifications:**

- **Error Handling:**  
  - Specify required fields in the form (e.g., `toneDescription`, at least one allowed topic, one fallback reply).  
  - Add validation rules in both UI and API layers.
- **Persistence:**  
  - Make clear where and how `AvatarPersonaConfig` is stored (e.g., per-user DB collection/table).
- **Access Control:**  
  - Only the creator or authorized editors can view/edit their persona config.



---
```
