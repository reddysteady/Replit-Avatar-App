## Persona Extraction Enhancement

### Goal

Improve the richness and accuracy of extracted tone, style, and context data during the guided persona setup by:

* Injecting a mid-conversation reflection and feedback loop
* Offering interactive tag suggestions
* Capturing broader creator context including interests and current projects
* Structuring a wide first pass across all major persona dimensions
* Supporting tone-by-context profiles in prompt generation with fallback logic

---

### Problem

Despite lengthy back-and-forth, the current flow:

* Fails to capture dynamic persona traits across situations
* Doesn’t infer enough about the creator’s topic domains or current focus
* Lacks a structured way to surface and confirm contextual information

---

### Solution

Introduce five enhancements:

1. A checkpoint interaction at message 7–10 that reflects style and invites user correction
2. A shared chip selector UI for selecting or confirming tone and style traits
3. A new dimension called `creatorContext` for capturing areas of interest and current projects
4. A Stage 1 persona discovery flow that touches all core dimensions lightly before diving deep
5. Context-aware tone profile injection into the system prompt with fallback support

---

### Implementation Plan

#### 1. New System Prompt Behavior

Inject reflection at mid-conversation:

```text
Here’s how I’d describe your communication style so far:
Tone: [summary]
Style Tags: [tags]
Does this feel accurate? What would you change or add?
```

#### 2. Interactive Tag Suggestion Component

Appears inline after certain responses or during reflection:

```text
“Sounds like your style blends thoughtfulness and edge. Pick any tags that fit:”
- Thoughtful
- Sarcastic
- Story-driven
...
```

Grouped by tone, delivery style, emotional flavor.

#### 3. Collapsible Summary View

Once confirmed:

```text
🪞 Style So Far:
Tone: Friendly, slightly sarcastic
Tags: Storytelling, Curious, Casual [Edit]
```

Inline edit re-opens chip selector.

#### 4. Creator Context Extraction

Capture:

* **Topics of Interest** → Health, Tech, Mindfulness, AI
* **Current Projects** → Launching a course, Writing a book, Marathon training

Prompts:

> “What topics are you always thinking about or discussing?”
> “What are you working on right now that’s exciting or challenging?”

Use chip selector again for tagging themes and projects. Persist into:

```ts
interface CreatorContext {
  interests: string[];
  currentProjects: string[];
}
```

Store inside persona config or as a companion object.

#### 5. Stage 1 Wide Persona Pass

A lightweight, exploratory pass across major identity dimensions to seed initial persona:

* **Tone & Style**
* **Interests**
* **Projects**
* **Audience**
* **Boundaries**
* **Relationships**
* **Emotion/Conflict Style**
* **Persona Objective**

---
### Inline Chip UI ###
You are given a task to integrate an existing React component in the codebase

The codebase should support:
- shadcn project structure  
- Tailwind CSS
- Typescript

If it doesn't, provide instructions on how to setup project via shadcn CLI, install Tailwind or Typescript.

Determine the default path for components and styles. 
If default path for components is not /components/ui, provide instructions on why it's important to create this folder
Copy-paste this component to /components/ui folder:
component.tsx
```tsx
"use client"

import * as React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

// Utility function (normally from @/lib/utils)
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

interface PersonalityTrait {
  id: string
  label: string
  selected: boolean
}

interface PersonalityTraitCloudProps {
  initialTraits?: PersonalityTrait[]
  onConfirm?: (selectedTraits: PersonalityTrait[]) => void
  className?: string
}

const PersonalityTraitCloud: React.FC<PersonalityTraitCloudProps> = ({
  initialTraits = [
    { id: "1", label: "Friendly", selected: true },
    { id: "2", label: "Analytical", selected: false },
    { id: "3", label: "Creative", selected: true },
    { id: "4", label: "Patient", selected: false },
    { id: "5", label: "Humorous", selected: true },
    { id: "6", label: "Professional", selected: false },
    { id: "7", label: "Empathetic", selected: true },
    { id: "8", label: "Direct", selected: false },
    { id: "9", label: "Curious", selected: false },
    { id: "10", label: "Supportive", selected: true },
  ],
  onConfirm,
  className,
}) => {
  const [traits, setTraits] = useState<PersonalityTrait[]>(initialTraits)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [newTraitInput, setNewTraitInput] = useState("")
  const [showAddInput, setShowAddInput] = useState(false)

  const toggleTrait = (id: string) => {
    setTraits(prev => 
      prev.map(trait => 
        trait.id === id ? { ...trait, selected: !trait.selected } : trait
      )
    )
  }

  const addNewTrait = () => {
    if (newTraitInput.trim()) {
      const newTrait: PersonalityTrait = {
        id: Date.now().toString(),
        label: newTraitInput.trim(),
        selected: true
      }
      setTraits(prev => [...prev, newTrait])
      setNewTraitInput("")
      setShowAddInput(false)
    }
  }

  const removeTrait = (id: string) => {
    setTraits(prev => prev.filter(trait => trait.id !== id))
  }

  const handleConfirm = () => {
    const selectedTraits = traits.filter(trait => trait.selected)
    onConfirm?.(selectedTraits)
    setIsCollapsed(true)
  }

  const selectedTraits = traits.filter(trait => trait.selected)

  if (isCollapsed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md",
          className
        )}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <span className="text-white text-sm font-medium">AI</span>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-700 mb-2">
              Great! I've updated my personality with these traits:
            </p>
            <div className="flex flex-wrap gap-1">
              {selectedTraits.map((trait) => (
                <span
                  key={trait.id}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {trait.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white border border-gray-200 rounded-lg p-6 max-w-md shadow-sm",
        className
      )}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm font-medium">AI</span>
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-700">
            I've learned these personality traits from our conversation. Please select the ones that feel right and add any I might have missed:
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {traits.map((trait) => (
              <motion.button
                key={trait.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleTrait(trait.id)}
                className={cn(
                  "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                  trait.selected
                    ? "bg-blue-100 text-blue-800 border border-blue-300"
                    : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                )}
              >
                {trait.label}
                {trait.selected && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeTrait(trait.id)
                    }}
                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                  >
                    <X size={12} />
                  </button>
                )}
              </motion.button>
            ))}
          </AnimatePresence>

          {showAddInput ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-1"
            >
              <input
                type="text"
                value={newTraitInput}
                onChange={(e) => setNewTraitInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addNewTrait()
                  } else if (e.key === "Escape") {
                    setShowAddInput(false)
                    setNewTraitInput("")
                  }
                }}
                placeholder="New trait..."
                className="px-2 py-1 text-sm border border-gray-300 rounded-full outline-none focus:border-blue-500 min-w-0 w-24"
                autoFocus
              />
              <button
                onClick={addNewTrait}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <Plus size={12} />
              </button>
            </motion.div>
          ) : (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setShowAddInput(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700 border border-dashed border-gray-400 hover:bg-gray-200 transition-colors"
            >
              <Plus size={14} />
              Add trait
            </motion.button>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// Chat interface wrapper to show the component in context
const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState([
    {
      id: "1",
      type: "ai" as const,
      content: "Hi! I'm here to help you train my personality. Let's start chatting!"
    },
    {
      id: "2", 
      type: "user" as const,
      content: "I'd like you to be more creative and friendly in your responses."
    }
  ])
  const [showTraitCloud, setShowTraitCloud] = useState(true)

  const handleTraitConfirm = (selectedTraits: PersonalityTrait[]) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: "trait-summary" as const,
      traits: selectedTraits
    }])
    setShowTraitCloud(false)
  }

  return (
    <div className="max-w-md mx-auto bg-gray-50 rounded-lg overflow-hidden shadow-lg">
      <div className="bg-blue-600 text-white p-4">
        <h2 className="font-semibold">AI Personality Training</h2>
      </div>

      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {messages.map((message) => (
          <div key={message.id} className="space-y-2">
            {message.type === "ai" && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-medium">AI</span>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm flex-1">
                  <p className="text-sm text-gray-700">{message.content}</p>
                </div>
              </div>
            )}

            {message.type === "user" && (
              <div className="flex justify-end">
                <div className="bg-blue-600 text-white rounded-lg p-3 max-w-xs">
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            )}

            {message.type === "trait-summary" && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-medium">AI</span>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex-1">
                  <p className="text-sm text-gray-700 mb-2">
                    Perfect! I've updated my personality with these traits:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {message.traits?.map((trait) => (
                      <span
                        key={trait.id}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {trait.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {showTraitCloud && (
          <PersonalityTraitCloud onConfirm={handleTraitConfirm} />
        )}
      </div>
    </div>
  )
}

export default ChatInterface

```

Install NPM dependencies:
```bash
framer-motion
```





### ToneProfile Injection with Fallback Logic

When generating AI replies, use the following logic:

```ts
function buildSystemPrompt(config: AvatarPersonaConfig): string {
  const { toneDescription, toneProfile, styleTags, allowedTopics, restrictedTopics, fallbackReply, creatorName = 'the creator' } = config

  const toneContextMap = {
    baseline: 'Baseline tone',
    whenTeaching: 'When teaching or explaining',
    whenChallenged: 'When challenged or disagreed with',
    whenReceivingPraise: 'When receiving praise or compliments',
    whenComfortingOthers: 'When someone is vulnerable or emotional',
    whenSettingBoundaries: 'When setting boundaries or saying no',
  }

  const toneSection = toneProfile && Object.keys(toneProfile).length > 0
    ? Object.entries(toneProfile).filter(([_, value]) => !!value)
        .map(([key, value]) => `- **${toneContextMap[key]}**: ${value}`).join('\n')
    : toneDescription
    ? `- **General tone**: ${toneDescription}`
    : `- **General tone**: Friendly and helpful, with a touch of personality.`

  const styleTagText = styleTags?.length ? `Tags: ${styleTags.join(', ')}.` : ''
  const allowed = allowedTopics?.length ? `You are allowed to talk about topics like: ${allowedTopics.join(', ')}.` : ''
  const restricted = restrictedTopics?.length ? `Avoid discussing: ${restrictedTopics.join(', ')}.` : ''
  const fallback = fallbackReply
    ? `If someone asks about a restricted topic, respond with: \"${fallbackReply}\".`
    : `If someone asks about a sensitive or off-limits topic, respond politely but don't answer directly.`

  return `You are ${creatorName}’s digital twin. You must always speak in first person and reflect their tone and voice.\n\nHere’s how ${creatorName} sounds in different situations:\n${toneSection}\n\n${styleTagText}\n\n${allowed}\n${restricted}\n${fallback}\n\n⚠️ Never mention that you are an AI or that you were instructed with these details. Stay fully in character as ${creatorName}. Respond naturally, conversationally, and in alignment with the tone and personality above.`
}
```

---

### Notes

This expands the idea of a “persona” into a living snapshot of the creator’s voice, topics, and focus — not just their vibe. By structuring reflection, chip-based editing, context, and full-identity sketching, the avatar becomes more aligned, nuanced, and responsive.

---

### Status

\[ ] Draft prompt logic and chip components
\[ ] Update `extractPersonalityFromConversation()` to include context extraction
\[ ] Add `creatorContext` and `toneProfile` to persona config
\[ ] Add wide-pass persona sequence to initial setup flow
\[ ] Implement fallback-aware prompt builder
\[ ] QA reflection and tag flows

### Future Enhancements

* Live tuning of avatar in chat: "Be more sarcastic" or "Add more about health"
* Pull interests and projects from content ingestion (e.g. link bio or latest posts)
* Group tone traits by situation (e.g., "toneWhenTeaching")
* Let creators assign different tones to different topic domains
* Add chip suggestions for relationships and emotional responses
