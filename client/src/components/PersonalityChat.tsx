import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { MessageCircle, Send, User, Bot, ArrowRight, SkipForward, Sparkles, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { AvatarPersonaConfig } from '@/types/AvatarPersonaConfig'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog'
import PersonalityTraitCloud, { PersonalityTrait } from './ui/personality-trait-cloud'
import VoiceInput from './ui/voice-input'
import { motion } from 'framer-motion'
import { createExpandedTraits } from '../lib/trait-expansion'
import { PersonaChatStateManager, ExtractionResult } from '../lib/PersonaChatStateManager'
import BadgeHeader from './ui/badge-header'
import BadgeAnimation from './ui/badge-animation'
import BadgeEarnedToast from './ui/badge-earned-toast'
import SpecialBadgeAnimation from './ui/special-badge-animation'
import { PERSONA_STAGES } from '../lib/constants'

interface PersonalityChatProps {
  onComplete: (config: AvatarPersonaConfig) => void
  onSkip: () => void
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  personaMode?: 'guidance' | 'blended' | 'persona_preview'
  isSpecial?: boolean
}

interface PersonalityExtractionResponse {
  response: string
  extractedData: Partial<AvatarPersonaConfig>
  isComplete: boolean
  personaMode?: 'guidance' | 'blended' | 'persona_preview'
  confidenceScore?: number
  transitionMessage?: string
  isFinished?: boolean
  showChipSelector?: boolean
  suggestedTraits?: PersonalityTrait[]
  reflectionCheckpoint?: boolean
}

export default function PersonalityChat({ onComplete, onSkip }: PersonalityChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isInitializing, setIsInitializing] = useState(true)
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [currentPersonaMode, setCurrentPersonaMode] = useState<'guidance' | 'blended' | 'persona_preview'>('guidance')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const [glowingMessageId, setGlowingMessageId] = useState<string | null>(null)
  const [suggestedTraits, setSuggestedTraits] = useState<PersonalityTrait[]>([])

  // Badge animation states
  const [showBadgeAnimation, setShowBadgeAnimation] = useState(false)
  const [animatingBadge, setAnimatingBadge] = useState<any>(null)
  const [showBadgeToast, setShowBadgeToast] = useState(false)
  const [toastBadge, setToastBadge] = useState<any>(null)
  const [showSpecialAnimation, setShowSpecialAnimation] = useState(false)
  const [specialAnimationType, setSpecialAnimationType] = useState<'preview_unlocked' | 'completion'>('preview_unlocked')
  const [showPersonalityUpdated, setShowPersonalityUpdated] = useState(false)

  // Add state variables for stage and stage transition
  const [currentStage, setCurrentStage] = useState(0)
  const [showStageTransition, setShowStageTransition] = useState(false)
  const [stageTransition, setStageTransition] = useState<{ from: number; to: number } | null>(null)

  // State Manager Instance
  const [stateManager] = useState(() => new PersonaChatStateManager())
  const [chatState, setChatState] = useState(() => stateManager.getState())

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const focusInput = useCallback(() => {
    if (inputRef.current && !isFinished && !chatState.reflectionActive) {
      inputRef.current.focus()
    }
  }, [isFinished, chatState.reflectionActive])

  // Memoize expensive calculations
  const memoizedChatState = useMemo(() => chatState, [
    chatState.fieldsCollected,
    chatState.currentStage,
    chatState.showCompleteButton,
    chatState.showChipSelector,
    chatState.badgeSystem.totalEarned,
    chatState.pendingBadgeAnimation
  ])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const timer = setTimeout(() => {
      focusInput()
    }, 100)
    return () => clearTimeout(timer)
  }, [messages, isFinished, chatState.reflectionActive])

  // Generate dynamic initial message
  useEffect(() => {
    if (messages.length === 0) {
      console.log('[PERSONALITY-STATE] Starting with direct avatar purpose question')

      const initialMessage = "What are you building this avatar for? I'd love to understand your main goal or purpose for creating an AI version of yourself."

      const initialChatMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: initialMessage,
        timestamp: new Date()
      }
      setMessages([initialChatMessage])
      console.log('[PERSONALITY-STATE] Initial message set successfully')

      // Update state manager with initial state - use proper initial state
      const initialState = stateManager.getState()
      setChatState(initialState)
      console.log('[PERSONALITY-STATE] State updated:', {
        stage: initialState.currentStage,
        fieldsCollected: initialState.fieldsCollected,
        showChipSelector: initialState.showChipSelector,
        showCompleteButton: initialState.showCompleteButton,
        badgeCount: initialState.badgeSystem.totalEarned
      })
      setIsInitializing(false)
    }
  }, [])

  const handleChipConfirmation = async (selectedTraits: PersonalityTrait[]) => {
    console.log('[PERSONALITY-STATE] Chip validation completed')

    // Update state manager
    const newState = stateManager.completeChipValidation()
    setChatState(newState)

    // Create a confirmation message
    const confirmationMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: `I've confirmed these traits: ${selectedTraits.map(t => t.label).join(', ')}`,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, confirmationMessage])
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/personality-extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [...messages, confirmationMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          currentConfig: newState.extractedConfig,
          confirmedTraits: selectedTraits.map(t => t.label)
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const aiResponse: PersonalityExtractionResponse = await response.json()

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse.response,
        timestamp: new Date(),
        personaMode: aiResponse.personaMode || 'guidance'
      }

      setMessages(prev => [...prev, aiMessage])

      // Update state manager with new extraction
      const updatedState = stateManager.updateFromExtraction(
        aiResponse as ExtractionResult, 
        messages.length + 2
      )
      setChatState(updatedState)

      // Handle badge animations - only for genuinely new badges
      if (updatedState.pendingBadgeAnimation && 
          updatedState.pendingBadgeAnimation !== chatState.pendingBadgeAnimation) {
        const badgeConfig = updatedState.badgeSystem.badges.find(b => b.id === updatedState.pendingBadgeAnimation)
        if (badgeConfig && !badgeConfig.animationPlayed) {
          setAnimatingBadge(badgeConfig)
          setShowBadgeAnimation(true)
          setTimeout(() => stateManager.clearPendingBadgeAnimation(), 100)
        }
      }

      // Check for stage transitions
      if (updatedState.stageJustAdvanced && updatedState.previousPersonaStage) {
        setStageTransition({ 
          from: PERSONA_STAGES.findIndex(s => s.id === updatedState.previousPersonaStage), 
          to: PERSONA_STAGES.findIndex(s => s.id === updatedState.personaStage) 
        })
        setShowStageTransition(true)
      }

      setCurrentPersonaMode(aiResponse.personaMode || 'guidance')

    } catch (error) {
      console.error('[PERSONALITY-STATE] Error in chip confirmation:', error)
      toast({
        title: 'Error',
        description: 'Failed to process trait confirmation. Please try again.',
        variant: 'destructive'
      })
    }

    setIsLoading(false)
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || isFinished || chatState.reflectionActive) return

    // Stop any active voice recording
    document.dispatchEvent(new CustomEvent('voiceInputStop'))

    console.log('[PERSONALITY-STATE] Sending message:', inputValue.trim())

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInputValue('')
    setIsLoading(true)

    // Clear any pending badge animations to prevent duplicates
    if (showBadgeAnimation) {
      setShowBadgeAnimation(false)
      setAnimatingBadge(null)
    }

    try {
      const requestBody = {
        messages: newMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        currentConfig: chatState.extractedConfig
      }

      console.log('[PERSONALITY-STATE] Making request with message count:', newMessages.length)

      const response = await fetch('/api/ai/personality-extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`Failed to get AI response: ${response.status}`)
      }

      const aiResponse: PersonalityExtractionResponse = await response.json()

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: aiResponse.response,
        timestamp: new Date(),
        personaMode: aiResponse.personaMode || 'guidance',
        isSpecial: aiResponse.personaMode === 'persona_preview'
      }

      // Use functional update to prevent race conditions
      setMessages(prev => {
        // Prevent duplicate messages
        const hasRecentDuplicate = prev.some(msg => 
          msg.role === 'assistant' && 
          msg.content === aiMessage.content &&
          Math.abs(new Date(msg.timestamp).getTime() - aiMessage.timestamp.getTime()) < 2000
        )
        if (hasRecentDuplicate) return prev
        return [...prev, aiMessage]
      })

      // Update state manager with extraction result  
      const updatedState = stateManager.updateFromExtraction(
        aiResponse as ExtractionResult,
        newMessages.length + 1,
        userMessage
      )
      setChatState(updatedState)

      console.log('[PERSONALITY-STATE] State updated:', {
        stage: updatedState.currentStage,
        fieldsCollected: updatedState.fieldsCollected,
        showChipSelector: updatedState.showCompleteButton,
        badgeCount: updatedState.badgeSystem.totalEarned
      })

      // Handle badge animations - only for genuinely new badges
      if (updatedState.pendingBadgeAnimation && 
          updatedState.pendingBadgeAnimation !== chatState.pendingBadgeAnimation) {
        const badgeConfig = updatedState.badgeSystem.badges.find(b => b.id === updatedState.pendingBadgeAnimation)
        if (badgeConfig && !badgeConfig.animationPlayed) {
          setAnimatingBadge(badgeConfig)
          setShowBadgeAnimation(true)
          // Clear pending animation to prevent duplicates
          setTimeout(() => stateManager.clearPendingBadgeAnimation(), 100)
        }
      }

      // Check for stage transitions
      if (updatedState.stageJustAdvanced && updatedState.previousPersonaStage) {
        setStageTransition({ 
          from: PERSONA_STAGES.findIndex(s => s.id === updatedState.previousPersonaStage), 
          to: PERSONA_STAGES.findIndex(s => s.id === updatedState.personaStage) 
        })
        setShowStageTransition(true)
      }

      // Check for special milestone animations
      if (updatedState.badgeSystem.canActivatePreview && !chatState.badgeSystem.canActivatePreview) {
        setSpecialAnimationType('preview_unlocked')
        setShowSpecialAnimation(true)
      } else if (updatedState.badgeSystem.canComplete && !chatState.badgeSystem.canComplete) {
        setSpecialAnimationType('completion')
        setShowSpecialAnimation(true)
      }

      // Handle UI updates based on new state
      if (updatedState.showChipSelector && aiResponse.suggestedTraits) {
        // Use AI-generated traits with enhanced categorization
        setSuggestedTraits(aiResponse.suggestedTraits.map(trait => ({
          ...trait,
          type: trait.type || 'extracted' // Default to extracted if not specified
        })))
      }

      setCurrentPersonaMode(aiResponse.personaMode || 'guidance')

      // Trigger visual effects for persona mode changes
      if (aiResponse.personaMode === 'blended' || aiResponse.personaMode === 'persona_preview') {
        setGlowingMessageId(aiMessage.id)
        setTimeout(() => setGlowingMessageId(null), 5000)
      }

      if (aiResponse.transitionMessage) {
        toast({
          title: 'Persona Preview Activated',
          description: aiResponse.transitionMessage
        })
      }

    } catch (error) {
      console.error('[PERSONALITY-STATE] Error in personality chat:', error)
      toast({
        title: 'Error',
        description: 'Failed to get AI response. Please try again.',
        variant: 'destructive'
      })
    }

    setIsLoading(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleVoiceTranscript = (transcript: string) => {
    if (transcript.trim()) {
      setInputValue((prevInputValue) => prevInputValue + transcript);
      // Auto-focus input after transcript is received
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }

  const handleComplete = () => {
    // Ensure we have a complete config before completing
    const finalConfig: AvatarPersonaConfig = {
      toneDescription: chatState.extractedConfig.toneDescription || "Friendly and approachable",
      styleTags: chatState.extractedConfig.styleTags || ["Friendly"],
      allowedTopics: chatState.extractedConfig.allowedTopics || ["General topics"],
      restrictedTopics: chatState.extractedConfig.restrictedTopics || [],
      fallbackReply: chatState.extractedConfig.fallbackReply || "I'd prefer not to discuss that topic.",
      avatarObjective: chatState.extractedConfig.avatarObjective || ["Engage with audience"],
      audienceDescription: chatState.extractedConfig.audienceDescription || "General audience"
    }

    onComplete(finalConfig)
  }

  const handleBadgeAnimationComplete = useCallback(() => {
    setShowBadgeAnimation(false)
    if (animatingBadge) {
      // Show green "Personality Updated" notification first
      setShowPersonalityUpdated(true)
      const timeoutId = setTimeout(() => setShowPersonalityUpdated(false), 3000)

      // Clean up timeout on unmount
      return () => clearTimeout(timeoutId)

      // Then show badge toast
      setToastBadge(animatingBadge)
      setShowBadgeToast(true)
    }
    setAnimatingBadge(null)

    // Clear pending animation from state manager
    stateManager.clearPendingBadgeAnimation()
    setChatState(stateManager.getState())
  }, [animatingBadge, stateManager])

  const handleBadgeToastClose = () => {
    setShowBadgeToast(false)
    setToastBadge(null)
  }

  const handleSpecialAnimationComplete = () => {
    setShowSpecialAnimation(false)
  }

  const getPersonaModeIndicator = (mode?: string) => {
    switch (mode) {
      case 'blended':
        return <Badge variant="secondary" className="mb-2">🎭 Learning Your Voice</Badge>
      case 'persona_preview':
        return <Badge variant="default" className="bg-purple-100 text-purple-800 mb-2">🎭 Persona Preview Active</Badge>
      default:
        return null
    }
  }

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    })
  }

  // Helper function to generate enhanced traits with proper categorization
  const generateTraitsFromExtractedConfig = (config: Partial<AvatarPersonaConfig>): PersonalityTrait[] => {
    const baseTraits: PersonalityTrait[] = [];

    // Extract core traits from style tags (limit to 3-4 core traits)
    if (config.styleTags) {
      config.styleTags.slice(0, 4).forEach((tag, index) => {
        baseTraits.push({ 
          id: `core-${index}`, 
          label: tag, 
          selected: true, 
          type: 'extracted' 
        });
      });
    }

    // Use conversation history to generate expanded traits
    const conversationHistory = messages
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content);

    // Generate full trait set with adjacent and antonyms
    const expandedTraits = createExpandedTraits(
      baseTraits, 
      conversationHistory, 
      { includeAdjacent: true, includeAntonyms: true }
    );

    return expandedTraits;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Badge Animations */}
      {showBadgeAnimation && animatingBadge && (
        <BadgeAnimation
          badge={animatingBadge}
          onComplete={handleBadgeAnimationComplete}
        />
      )}

      {showBadgeToast && toastBadge && (
        <BadgeEarnedToast
          badge={toastBadge}
          onClose={handleBadgeToastClose}
        />
      )}

      {showSpecialAnimation && (
        <SpecialBadgeAnimation
          type={specialAnimationType}
          onComplete={handleSpecialAnimationComplete}
        />
      )}

      {/* Green Personality Updated Notification */}
      {showPersonalityUpdated && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
        >
          <CheckCircle2 size={16} />
          <span className="text-sm font-medium">Personality Updated!</span>
        </motion.div>
      )}

      {/* Sticky Header with Progress */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm shrink-0">
        <div className="container mx-auto p-3 max-w-4xl md:p-4">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div>
              <h1 className="text-lg font-semibold flex items-center gap-2 md:text-2xl md:font-bold">
                <MessageCircle className="h-5 w-5 md:h-6 md:w-6" />
                <span className="md:hidden">AI Voice Setup</span>
                <span className="hidden md:inline">AI Voice Setup Chat</span>
              </h1>
              <p className="text-sm text-muted-foreground hidden md:block">
                Let's discover your unique communication style through conversation
              </p>
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={onSkip} 
              className="h-8 w-8 md:h-10 md:w-auto md:flex md:items-center md:gap-2 md:px-4"
            >
              <SkipForward className="h-4 w-4" />
              <span className="hidden md:inline">Skip to Form</span>
            </Button>
          </div>

          <BadgeHeader badges={chatState.badgeSystem.badges} />
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col bg-white md:container md:mx-auto md:p-6 md:max-w-4xl">
        <div className="flex-1 flex flex-col md:rounded-lg md:border md:bg-white">
          <div className="flex-1 flex flex-col p-4 md:p-6 min-h-0">
            <ScrollArea className="flex-1 pr-4 mb-4" style={{ minHeight: '300px', maxHeight: '70vh' }}>
              <div className="space-y-4 min-h-0">
                {messages.map((message) => (
                  <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'user' 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>
                      <div className={`rounded-lg px-4 py-2 transition-all duration-300 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : message.isSpecial 
                            ? `bg-gradient-to-r from-green-50 to-blue-50 text-gray-900 border border-green-200 shadow-lg ${
                                glowingMessageId === message.id ? 'animate-pulse shadow-green-200 shadow-2xl' : 'bg-green-50'
                              }`
                            : 'bg-gray-100 text-gray-900'
                      }`}>
                        {getPersonaModeIndicator(message.personaMode)}
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {formatTimestamp(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {(isLoading || isInitializing) && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-gray-100 text-gray-900 rounded-lg px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full" />
                        {isInitializing ? 'Preparing your chat...' : 'Analyzing your style...'}
                      </div>
                    </div>
                  </div>
                )}

                {chatState.showChipSelector && (

                  <PersonalityTraitCloud
                    initialTraits={generateTraitsFromExtractedConfig(chatState.extractedConfig)}
                    onConfirm={handleChipConfirmation}
                    showAntonyms={true}
                    className="max-w-full"
                  />

                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>

            <Separator className="mb-4" />

            <div className="space-y-4 pb-safe shrink-0">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    isFinished 
                      ? "Chat completed" 
                      : chatState.reflectionActive 
                        ? "Please confirm your traits above first..."
                        : "Share your thoughts about your communication style..."
                  }
                  disabled={isLoading || isFinished || chatState.reflectionActive}
                  className={`flex-1 ${isFinished || chatState.reflectionActive ? 'bg-gray-100 text-gray-500' : ''}`}
                />
                <div className="relative">
                  <VoiceInput
                    onTranscript={(text) => {
                      // Always use the accumulated text from voice input
                      setInputValue(text)
                    }}
                    disabled={isLoading || isFinished || chatState.reflectionActive}
                  />
                </div>
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!inputValue.trim() || isLoading || isFinished || chatState.reflectionActive}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* Complete Setup Button - controlled by state manager */}
              {chatState.showCompleteButton && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center"
                >
                  <Button 
                    onClick={handleComplete}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 flex items-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Continue to Setup
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}