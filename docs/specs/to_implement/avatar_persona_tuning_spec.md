# Avatar Persona Tuning Progression

## Purpose of This Spec

This specification is intended for implementation by an AI coding agent within the existing Avatar App. It defines a progressive, gamified persona development system that collects and refines user traits through natural language interaction. These parameters shape how the AI avatar speaks, behaves, and responds. The system is structured to incrementally build up a fully expressive and user-aligned digital persona, while maintaining a fun and engaging experience through badges, levels, and personality insights.

The AI agent should use this spec to:

- Implement logic for detecting and storing persona traits at each stage
- Trigger stage transitions (NPC → Noob → Pro → Hero → Legend) based on completed parameter sets
- Generate onboarding and in-chat questions using the `Parameter-to-Question Table`
- Enable Big Five trait calibration across stages
- Surface badges and visual cues in the UI based on current stage
- Support future expansion by referencing this extensible progression framework

---

## 🎮 Persona Progression: From Blank to Legend

| **Stage** | **Name**   | **Meaning**                                                                               | **Icon** | **Celebration Copy**                                             |
| --------- | ---------- | ----------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------- |
| 1         | **NPC**    | This is how the person starts before nay persoa tuning. Undefined. Waiting. No voice yet. | ⬛        | “You’re a blank slate... but greatness is loading.”              |
| 2         | **Noob**   | You’ve hatched — early identity forming.                                                  | 🐣       | “You’ve cracked the shell — now we find your voice.”             |
| 3         | **Pro**    | You’re lifting off — goals, tone, and audience dialed in.                                 | 🚀       | “Blast off. You’ve got a voice, and you’re moving with purpose.” |
| 4         | **Hero**   | Persona complete. Aligned, expressive, and ready to lead.                                 | 🎖️      | “You’ve earned your badge. This persona’s got presence.”         |
| 5         | **Legend** | Peak form. GOAT status. Unmistakable digital icon.                                        | 🐐       | “Legend unlocked. You’ve built a digital icon. 🐐”               |

---

## 📊 Parameter-to-Question Table (Mapped to Persona Progression)

| Persona Stage | Parameter               | Description / Purpose                         | Recommended Question Types     | Sample Questions                                                |
| ------------- | ----------------------- | --------------------------------------------- | ------------------------------ | --------------------------------------------------------------- |
| NPC           | Initial Context         | Avatar origin, creator intent                 | Direct                         | "What are you building this avatar for?"                        |
| Noob          | Tone Description        | Core communication “voice”                    | Direct, scenario, indirect     | “How would you describe your natural communication style?”      |
| Noob          | Style Tags              | Descriptive labels for style/personality      | Scenario, example-driven       | “What three words would a close friend use for your vibe?”      |
| Noob          | Big Five: Quick Pulse   | Indirect OCEAN sampling via relatable choices | Scenario-based, indirect       | “You get a last-minute invite to a wild party. What do you do?” |
| Pro           | Allowed Topics          | Safe/approved content areas                   | Direct, preference, scenario   | “Are there any topics you’re always happy to discuss?”          |
| Pro           | Restricted Topics       | Off-limits/sensitive areas                    | Direct, scenario, reflective   | “Are there any topics you prefer not to talk about?”            |
| Pro           | Fallback Reply          | Standard phrase for restricted topics         | Example-driven, scenario       | “If someone asks about a topic you avoid, how do you respond?”  |
| Pro           | Big Five: Confirmations | Refine traits through focused feedback loops  | Forced-choice, reflective      | “Do you prefer planned routines or adapting on the fly?”        |
| Hero          | Audience Description    | Who the avatar is for                         | Scenario, persona, niche       | “If you picture your ideal follower, who comes to mind?”        |
| Hero          | Signature Phrases       | Voice consistency through repeated phrasing   | Example-based, self-describe   | “What’s a phrase or line you often say?”                        |
| Hero          | Trait Modulation        | Control how strongly traits are expressed     | Slider, contextual calibration | “How energetic should this avatar feel when replying to fans?”  |
| Legend        | Edge Cases & Filters    | Handling trolling, sensitive escalation       | Scenario, behavioral boundary  | “How would you want this avatar to respond to harassment?”      |
| Legend        | Goals & Boundaries      | Long-term persona alignment/limits            | Reflective, goal-based         | “What should this persona *never* say or do?”                   |
| Legend        | Dynamic Modes           | Persona mode switching (e.g., hype, empathy)  | Tag-based, profile selector    | “Switch to Hype Mode” or “Respond as Calm Mode”                 |

---

## 🧠 Expanded Use of Big Five Personality Framework

| Trait                 | Meaning                                 | Example Avatar Behavior                                 |
| --------------------- | --------------------------------------- | ------------------------------------------------------- |
| **Openness**          | Curious, creative, adventurous          | Uses metaphors, varies language, explores new topics    |
| **Conscientiousness** | Organized, reliable, disciplined        | Replies thoroughly, avoids slang, stays on-topic        |
| **Extraversion**      | Outgoing, energetic, enjoys interaction | Uses emojis, asks questions, keeps the vibe high        |
| **Agreeableness**     | Warm, kind, conflict-averse             | Uses empathetic tone, de-escalates, shows appreciation  |
| **Neuroticism**       | Sensitive, anxious, emotionally aware   | Responds carefully, avoids triggers, validates concerns |

Applied across stages (Noob = quick pulse, Pro = confirmations, Hero = modulation, Legend = dynamic profiles).