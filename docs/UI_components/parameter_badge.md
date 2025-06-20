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
import { X, Plus, Award, Target, MessageSquare, Shield, RotateCcw, User, Users, Sparkles, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

// Utility function (normally from @/lib/utils)
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

interface PersonalityTrait {
  id: string
  label: string
  selected: boolean
  category?: string
}

interface Badge {
  id: string
  category: string
  label: string
  icon: string
  earned: boolean
  earnedAt?: Date
}

interface PersonalityTraitCloudProps {
  initialTraits?: PersonalityTrait[]
  onConfirm?: (selectedTraits: PersonalityTrait[], category?: string) => void
  className?: string
  category?: string
}

interface Message {
  id: string
  type: "ai" | "user" | "trait-summary"
  content?: string
  traits?: PersonalityTrait[]
}

const PersonalityTraitCloud: React.FC<PersonalityTraitCloudProps> = ({
  initialTraits = [
    { id: "1", label: "Friendly", selected: true, category: "tone" },
    { id: "2", label: "Analytical", selected: false, category: "tone" },
    { id: "3", label: "Creative", selected: true, category: "style" },
    { id: "4", label: "Patient", selected: false, category: "tone" },
    { id: "5", label: "Humorous", selected: true, category: "tone" },
    { id: "6", label: "Professional", selected: false, category: "style" },
    { id: "7", label: "Empathetic", selected: true, category: "tone" },
    { id: "8", label: "Direct", selected: false, category: "style" },
    { id: "9", label: "Curious", selected: false, category: "tone" },
    { id: "10", label: "Supportive", selected: true, category: "tone" },
  ],
  onConfirm,
  className,
  category = "tone",
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
    onConfirm?.(selectedTraits, category)
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
        "bg-background border border-border rounded-lg p-6 max-w-md shadow-sm",
        className
      )}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm font-medium">AI</span>
        </div>
        <div className="flex-1">
          <p className="text-sm text-foreground">
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
                className="px-2 py-1 text-sm border border-input rounded-full outline-none focus:border-blue-500 min-w-0 w-24 bg-background text-foreground"
                autoFocus
              />
              <button
                onClick={addNewTrait}
                className="p-1 hover:bg-accent rounded-full transition-colors text-foreground"
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

// Badge Animation Component
const BadgeAnimation: React.FC<{ badge: Badge; onComplete: () => void }> = ({ badge, onComplete }) => {
  const iconMap = {
    tone: Award,
    style: Target,
    allowedTopics: MessageSquare,
    restrictedTopics: Shield,
    fallbackResponse: RotateCcw,
    avatarObjective: User,
    audienceDescription: Users,
  }

  const IconComponent = iconMap[badge.category as keyof typeof iconMap] || Award

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{
        scale: [0, 1.2, 1],
        rotate: [0, 360],
        y: [0, -200]
      }}
      transition={{
        duration: 2,
        times: [0, 0.3, 1],
        ease: "easeOut"
      }}
      onAnimationComplete={onComplete}
      className="absolute z-50 left-1/2 transform -translate-x-1/2"
    >
      <div className="bg-yellow-400 text-yellow-900 px-3 py-2 rounded-full shadow-lg flex items-center gap-2">
        <IconComponent size={16} />
        <span className="text-sm font-bold">{badge.label}</span>
      </div>
    </motion.div>
  )
}

// Badge Collection Header
const BadgeHeader: React.FC<{ badges: Badge[] }> = ({ badges }) => {
  const earnedBadges = badges.filter(badge => badge.earned)

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700">Progress</h3>
        <span className="text-xs text-gray-500">{earnedBadges.length}/7 Complete</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {badges.map((badge) => {
          const iconMap = {
            tone: Award,
            style: Target,
            allowedTopics: MessageSquare,
            restrictedTopics: Shield,
            fallbackResponse: RotateCcw,
            avatarObjective: User,
            audienceDescription: Users,
          }

          const IconComponent = iconMap[badge.category as keyof typeof iconMap] || Award

          return (
            <motion.div
              key={badge.id}
              initial={badge.earned ? { scale: 0 } : false}
              animate={badge.earned ? { scale: 1 } : false}
              transition={{ delay: 0.5, type: "spring" }}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                badge.earned
                  ? 'bg-yellow-400 text-yellow-900 shadow-sm'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              <IconComponent size={12} />
              <span className="font-medium">{badge.label}</span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// Chat interface wrapper to show the component in context
const ChatInterface: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "ai",
      content: "Hi! I'm here to help you train my personality. Let's start chatting!"
    },
    {
      id: "2",
      type: "user",
      content: "I'd like you to be more creative and friendly in your responses."
    }
  ])
  const [showTraitCloud, setShowTraitCloud] = useState(true)
  const [currentCategory] = useState("tone")
  const [animatingBadge, setAnimatingBadge] = useState<Badge | null>(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const [badges, setBadges] = useState<Badge[]>([
    { id: "1", category: "tone", label: "Tone", icon: "🎭", earned: false },
    { id: "2", category: "style", label: "Style", icon: "✨", earned: false },
    { id: "3", category: "allowedTopics", label: "Topics", icon: "💬", earned: false },
    { id: "4", category: "restrictedTopics", label: "Limits", icon: "🛡️", earned: false },
    { id: "5", category: "fallbackResponse", label: "Fallback", icon: "🔄", earned: false },
    { id: "6", category: "avatarObjective", label: "Objective", icon: "👤", earned: false },
    { id: "7", category: "audienceDescription", label: "Audience", icon: "👥", earned: false },
  ])

  const handleTraitConfirm = (selectedTraits: PersonalityTrait[], category?: string) => {
        // Add the trait summary message
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: "trait-summary",
      traits: selectedTraits
    }])

    // Check if this category should earn a badge
    if (category && selectedTraits.length > 0) {
      const badgeToEarn = badges.find(badge => badge.category === category && !badge.earned)
      if (badgeToEarn) {
        // Start badge animation
        setAnimatingBadge(badgeToEarn)
      }
    }

    setShowTraitCloud(false)
  }

  const handleBadgeAnimationComplete = () => {
    if (animatingBadge) {
      // Mark badge as earned
      setBadges(prev => prev.map(badge =>
        badge.id === animatingBadge.id
          ? { ...badge, earned: true, earnedAt: new Date() }
          : badge
      ))
      setAnimatingBadge(null)
      setShowSuccessMessage(true); // Show success message after badge animation
      setTimeout(() => setShowSuccessMessage(false), 3000); // Hide after 3 seconds
    }
  }

    return (
    <div className="max-w-md mx-auto bg-background rounded-lg overflow-hidden shadow-lg relative">
      <div className="bg-primary text-primary-foreground p-4">
        <h2 className="font-semibold">AI Personality Training</h2>
      </div>

      <BadgeHeader badges={badges} />

      <div className="p-4 space-y-4 max-h-96 overflow-y-auto relative">
        {animatingBadge && (
          <BadgeAnimation
            badge={animatingBadge}
            onComplete={handleBadgeAnimationComplete}
          />
        )}

        <AnimatePresence>
          {showSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
            >
              <CheckCircle2 size={16} />
              <span className="text-sm font-medium">Personality Updated!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {messages.map((message) => (
          <div key={message.id} className="space-y-2">
            {message.type === "ai" && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-medium">AI</span>
                </div>
                <div className="bg-card text-card-foreground rounded-lg p-3 shadow-sm flex-1">
                  <p className="text-sm">{message.content}</p>
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
          <PersonalityTraitCloud
            onConfirm={handleTraitConfirm}
            category={currentCategory}
          />
        )}
      </div>
    </div>
  )
}

// Export both components for flexibility
export { PersonalityTraitCloud, ChatInterface }

// Simple App component to render the interface
const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
      <ChatInterface />
    </div>
  )
}

export default App

// Simple render function for testing
if (typeof window !== 'undefined') {
  // Create root element if it doesn't exist
  let rootElement = document.getElementById('root')
  if (!rootElement) {
    rootElement = document.createElement('div')
    rootElement.id = 'root'
    document.body.appendChild(rootElement)
  }

  // Simple React render (for environments where ReactDOM is available)
  if (typeof ReactDOM !== 'undefined' && ReactDOM.render) {
    ReactDOM.render(<App />, rootElement)
  } else if (typeof ReactDOM !== 'undefined' && ReactDOM.createRoot) {
    const root = ReactDOM.createRoot(rootElement)
    root.render(<App />)
  }
}

// Also export App as default for manual rendering
export { App }

```

Install NPM dependencies:
```bash
framer-motion
```
