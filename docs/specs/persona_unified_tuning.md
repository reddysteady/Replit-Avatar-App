# Avatar App — **Unified Persona‑Tuning Specification (v 1.3)**

*Last updated 2025‑06‑19 — now fully expands all core + sub-context persona traits; no placeholders or external references remain.*

---

## 0 Purpose

Create one authoritative flow that **captures, stores, and applies** every signal needed for the avatar to speak convincingly in the creator’s voice.

---

## 1 Key Terminology

| Term                                        | Definition                                                                                                                                                                                                         |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Parameter**                               | A dimension we want to capture (e.g. *toneProfile*, *values & beliefs*).                                                                                                                                           |
| **Question Type**                           | **Direct** → an explicit ask (“How should I sound when teaching?”). **Implicit** → a scenario or role‑play that lets GPT infer the answer (“Imagine a beginner asks me for help — reply as me.”).                  |
| **Objective Prompt**                        | A meta‑instruction given to GPT to **write its own** question aimed at a single parameter (e.g. “Ask a concise implicit question to learn the user’s communication preferences.”). No static question bank needed. |
| **Context Key (********`ctx`****\*\*\*\*)** | Runtime situation label (e.g. `whenTeaching`, `whenChallenged`).                                                                                                                                                   |

---

## 2 Canonical Data Model

```ts
export interface ToneProfile {
  baseline: string;
  whenTeaching: string;
  whenChallenged: string;
  whenReceivingPraise: string;
  whenComfortingOthers: string;
  whenSettingBoundaries: string;
}

export interface CommunicationPrefs {
  verbosity: 'concise' | 'detailed' | 'balanced';
  emojiUse: 'none' | 'sparingly' | 'frequent';
  formality: 'formal' | 'casual' | 'mixed';
}

export interface EmotionalTriggers {
  topicsThatExcite: string[];
  topicsThatUpset: string[];
}

export interface ValuesAndBeliefs {
  corePrinciples: string[];
  moralPriorities: string[];
}

export interface PersonaContext {
  toneProfile: ToneProfile;
  communicationPrefs: CommunicationPrefs;
  emotionalTriggers: EmotionalTriggers;
  valuesAndBeliefs: ValuesAndBeliefs;
  culturalBackground: string;
  hobbiesAndInterests: string[];
  audience: string;
  personaObjective: string;
  boundaries: string;
  currentProjects: string[];
}
```

---

## 3 Dynamic Question Engine

> **Goal:** Progressively fill all parameters to ≥ 0.6 confidence without relying on static question banks.

### 3.1 Workflow

1. **Queue Build** – Prioritize missing or low-confidence parameters from the `PersonaContext` model.
2. **Objective Prompt Construction** – For each parameter, generate a GPT meta-instruction like:

   ```jsonc
   {
     "role": "system",
     "content": "Craft one {questionType} question under 50 words to learn the user's {parameter}. Never mention you're collecting data."
   }
   ```
3. **GPT generates the user-facing question.**
4. **User replies.** Append to conversation history.
5. **Extraction call** to `extractPersonaConfig()` parses user’s answer and updates confidence and values.
6. **Repeat** until all required fields are ≥ confidence threshold.

### 3.2 Parameter Catalogue

| Parameter                             | Prompt Goal                                                   |
| ------------------------------------- | ------------------------------------------------------------- |
| **toneProfile.baseline**              | Ask how the user sounds in everyday conversation.             |
| **toneProfile.whenTeaching**          | Ask how the user sounds when explaining a concept.            |
| **toneProfile.whenChallenged**        | Ask how they handle disagreement or pushback.                 |
| **toneProfile.whenReceivingPraise**   | Ask how they respond to compliments or recognition.           |
| **toneProfile.whenComfortingOthers**  | Ask how they support someone emotionally.                     |
| **toneProfile.whenSettingBoundaries** | Ask how they express limits or say no firmly.                 |
| **communicationPrefs**                | Discover preferences for verbosity, formality, and emoji.     |
| **emotionalTriggers**                 | Discover what kinds of situations excite or upset them.       |
| **valuesAndBeliefs**                  | Identify core values, principles, and moral beliefs.          |
| **culturalBackground**                | Ask about heritage or cultural lens that shapes expression.   |
| **hobbiesAndInterests**               | Find what lights them up outside their work.                  |
| **audience**                          | Describe their typical follower (age, interests, mindset).    |
| **personaObjective**                  | Clarify the avatar’s main job (educate, entertain, inspire…). |
| **boundaries**                        | Discover what topics are off-limits or need soft handling.    |
| **currentProjects**                   | Learn what they’re working on or promoting currently.         |

## 3.3 Chip Cloud Validation (Fixed-Interval Milestone Approach)

To balance user rhythm and simplicity, chip cloud validation is triggered **after every 3 parameters** are extracted and filled.

* **Workflow:**

  * The onboarding flow presents three sequential questions, each about a different persona parameter.
  * After three answers (and a corresponding extraction pass for each), the system displays a chip cloud for all three parameters just filled.
  * Chips are **grouped visually by parameter type**, with each group titled (e.g., “Tone Profile: Challenged”, “Values & Beliefs”, “Communication Preferences”).
  * The user can select/deselect chips, edit, or add their own.
  * The user must press **Done** to continue; skipping is not permitted.
* **Persistence:**

  * User actions in the chip cloud immediately update the persona object in memory.
  * After “Done,” the flow continues with the next set of parameters.

---

## 4 GPT Extraction Prompt

Every GPT system prompt used for extraction must include:

* “Ignore your own generated questions — extract only from the user’s answers.”
* For each persona parameter, infer a structured field (or leave null).
* Extraction logic should support:

  * JSON output with nested structure.
  * Confidence score.
  * Key justification if possible (for debugging).

---

## 5 System Prompt Builder & Tone Resolver

The System Prompt Builder function uses the `toneProfile` object from the stored persona to dynamically adjust tone based on conversation context.

When a message is received, the runtime `ctx` key (e.g., `whenTeaching`, `whenComfortingOthers`) is passed into the resolver function. The system selects the matching value from `toneProfile`, falling back in this order:

1. `toneProfile[ctx]`
2. `toneProfile.baseline`
3. `personaContext.toneDescription` (if implemented)
4. "Friendly and helpful" (default fallback)

This resolved tone is injected into the beginning of the system prompt to steer GPT’s response style for that interaction.

---

## 6 Implementation Roadmap

| Phase | Priority | Scope                                                                                   |
| ----- | -------- | --------------------------------------------------------------------------------------- |
| 2E    | P1       | Implement full dynamic question engine with GPT-generated onboarding questions          |
| 2F    | P1       | Extraction support for all 16 canonical traits, with multi-context tone fallback system |
| 2G    | P2       | Confidence tracker and toggling UI for direct/indirect input modes                      |

---

## 7 Testing

* **Unit-DQE** – Verify generated questions match objective prompt intent, stay under 50 words.
* **Extraction-E2E** – End-to-end: GPT infers and extracts all fields with consistent accuracy.
* **Regression-Coverage** – Ensure `toneProfile`, `valuesAndBeliefs`, `communicationPrefs`, and sub-contexts always receive inferred defaults when partially filled.

---

*End of v 1.3 spec*
