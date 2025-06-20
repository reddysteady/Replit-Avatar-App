import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { MessageCircle, Send, User, Bot, ArrowRight, SkipForward, Sparkles } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { AvatarPersonaConfig } from '@/types/AvatarPersonaConfig'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog'
import PersonalityTraitCloud, { PersonalityTrait } from './ui/personality-trait-cloud'
import { motion } from 'framer-motion'

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
  const [extractedConfig, setExtractedConfig] = useState<Partial<AvatarPersonaConfig>>({})
  const [isComplete, setIsComplete] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [currentPersonaMode, setCurrentPersonaMode] = useState<'guidance' | 'blended' | 'persona_preview'>('guidance')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const [glowingMessageId, setGlowingMessageId] = useState<string | null>(null)
  const [showChipSelector, setShowChipSelector] = useState(false)
  const [suggestedTraits, setSuggestedTraits] = useState<PersonalityTrait[]>([])
  const [reflectionActive, setReflectionActive] = useState(false)

  // New State Variables
  const [personaMode, setPersonaMode] = useState<'guidance' | 'blended' | 'persona_preview'>('guidance')
  const [showPersonaPreview, setShowPersonaPreview] = useState(false)
  const [personaPulse, setPersonaPulse] = useState(false)
  const [hasShownPersonaPulse, setHasShownPersonaPulse] = useState(false)
  const [showCompleteButton, setShowCompleteButton] = useState(false)
  const [progress, setProgress] = useState(0)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const focusInput = () => {
    if (inputRef.current && !isFinished) {
      inputRef.current.focus()
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Focus input on mount and after each message
  useEffect(() => {
    const timer = setTimeout(() => {
      focusInput()
    }, 100)
    return () => clearTimeout(timer)
  }, [messages, isFinished])

  // Generate dynamic initial message
  useEffect(() => {
    const generateInitialMessage = async () => {
      console.log('[PERSONALITY-FRONTEND] Starting initial message generation')

      try {
        const requestBody = {
          messages: [
            {
              role: 'system',
              content: 'Generate an engaging opening question to start persona discovery. Make it warm, specific, and designed to capture the creator\'s communication style and goals.'
            }
          ],
          currentConfig: {},
          initialMessage: true
        }

        console.log('[PERSONALITY-FRONTEND] Making request to /api/ai/personality-extract with:', requestBody)

        const response = await fetch('/api/ai/personality-extract', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        })

        console.log('[PERSONALITY-FRONTEND] Response status:', response.status, response.statusText)

        if (!response.ok) {
          const errorText = await response.text()
          console.error('[PERSONALITY-FRONTEND] Response not ok:', errorText)
          throw new Error(`Failed to generate initial message: ${response.status} ${response.statusText}`)
        }

        const aiResponse: PersonalityExtractionResponse = await response.json()

        console.log('[PERSONALITY-FRONTEND] AI response received:', {
          hasResponse: !!aiResponse.response,
          personaMode: aiResponse.personaMode,
          isComplete: aiResponse.isComplete,
          error: aiResponse.error
        })

        const initialMessage: ChatMessage = {
          id: '1',
          role: 'assistant',
          content: aiResponse.response || "Hi! I'm here to help set up your AI avatar's personality. Let's start with something specific - imagine your favorite follower just asked you for advice. How do you typically respond to them?",
          timestamp: new Date(),
          personaMode: 'guidance'
        }

        setMessages([initialMessage])
        console.log('[PERSONALITY-FRONTEND] Initial message set successfully')
      } catch (error) {
        console.error('[PERSONALITY-FRONTEND] Error generating initial message:', {
          message: error.message,
          stack: error.stack
        })
        // Fallback to improved static message
        const fallbackMessage: ChatMessage = {
          id: '1',
          role: 'assistant',
          content: "Hey there! I'm excited to help you create your AI avatar. Let's start with something fun - if your biggest fan asked you to describe your communication style in three words, what would they be?",
          timestamp: new Date(),
          personaMode: 'guidance'
        }
        setMessages([fallbackMessage])
        console.log('[PERSONALITY-FRONTEND] Using fallback message')
      } finally {
        setIsInitializing(false)
        console.log('[PERSONALITY-FRONTEND] Initial message generation completed')
      }
    }

    generateInitialMessage()
  }, [])

  const handleChipConfirmation = async (selectedTraits: PersonalityTrait[]) => {
    setShowChipSelector(false)
    setReflectionActive(false)

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
          currentConfig: extractedConfig,
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
      setExtractedConfig(prev => ({ ...prev, ...aiResponse.extractedData }))
      setIsComplete(aiResponse.isComplete)
      setIsFinished(aiResponse.isFinished || false)
      setCurrentPersonaMode(aiResponse.personaMode || 'guidance')

    } catch (error) {
      console.error('Error in chip confirmation:', error)
      toast({
        title: 'Error',
        description: 'Failed to process trait confirmation. Please try again.',
        variant: 'destructive'
      })
    }

    setIsLoading(false)
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || isFinished || reflectionActive) return

    console.log('[PERSONALITY-FRONTEND] Sending message:', inputValue.trim())

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const requestBody = {
        messages: [...messages, userMessage].map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        currentConfig: extractedConfig
      }

      console.log('[PERSONALITY-FRONTEND] Making request with:', {
        messageCount: requestBody.messages.length,
        hasCurrentConfig: !!requestBody.currentConfig,
        configKeys: Object.keys(requestBody.currentConfig || {})
      })

      const response = await fetch('/api/ai/personality-extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      console.log('[PERSONALITY-FRONTEND] Response received:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[PERSONALITY-FRONTEND] Response error:', errorText)
        throw new Error(`Failed to get AI response: ${response.status} ${response.statusText}`)
      }

      const aiResponse: PersonalityExtractionResponse = await response.json()

      console.log('[PERSONALITY-FRONTEND] AI response parsed:', {
        hasResponse: !!aiResponse.response,
        personaMode: aiResponse.personaMode,
        isComplete: aiResponse.isComplete,
        showChipSelector: aiResponse.showChipSelector,
        hasExtractedData: !!aiResponse.extractedData && Object.keys(aiResponse.extractedData).length > 0,
        error: aiResponse.error
      })

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse.response,
        timestamp: new Date(),
        personaMode: aiResponse.personaMode || 'guidance',
        isSpecial: aiResponse.isComplete && !aiResponse.isFinished
      }

      setMessages(prev => [...prev, aiMessage])

      // Debug log for configuration updates
      console.log('[PERSONALITY-FRONTEND] Merging config:', {
        previousConfig: extractedConfig,
        newData: aiResponse.extractedData,
        mergedConfig: { ...extractedConfig, ...aiResponse.extractedData }
      })

      setExtractedConfig(prev => ({ ...prev, ...aiResponse.extractedData }))
      setIsComplete(aiResponse.isComplete)
      setIsFinished(aiResponse.isFinished || false)
      setCurrentPersonaMode(aiResponse.personaMode || 'guidance')

      // Phase 1: Show chip selector every 3 parameters as per spec
      const mergedConfig = { ...extractedConfig, ...aiResponse.extractedData }
      const configCount = countMeaningfulFields(mergedConfig)

      console.log('[PERSONALITY-DEBUG] Config count:', configCount, 'Stage:', aiResponse.personaMode)

      if (aiResponse.showChipSelector || aiResponse.reflectionCheckpoint) {
        console.log('[PERSONALITY-FRONTEND] Showing chip selector')
        setShowChipSelector(true)
        setSuggestedTraits(aiResponse.suggestedTraits || [])
        setReflectionActive(true)
      }

      if (aiResponse.transitionMessage) {
        toast({
          title: 'Persona Preview Activated',
          description: aiResponse.transitionMessage
        })
      }

      // Trigger green pulse on first "blended" or "persona_preview" mode message
      if (aiResponse.personaMode === 'blended' || aiResponse.personaMode === 'persona_preview') {
        setGlowingMessageId(aiMessage.id);
        setTimeout(() => {
          setGlowingMessageId(null);
        }, 5000);
      }


    } catch (error) {
      console.error('[PERSONALITY-FRONTEND] Error in personality chat:', {
        message: error.message,
        stack: error.stack
      })
      toast({
        title: 'Error',
        description: 'Failed to get AI response. Please try again.',
        variant: 'destructive'
      })
    }

    setIsLoading(false)
    console.log('[PERSONALITY-FRONTEND] Message handling completed')
  }
  // Handle extraction result and update state
  const handleExtractionResult = (result: any) => {
    console.log('[PERSONALITY-DEBUG] Handling extraction result:', result)

    if (result.extractedData && Object.keys(result.extractedData).length > 0) {
      setExtractedConfig(prev => ({ ...prev, ...result.extractedData }))
    }

    // Handle chip selector - only show during reflection checkpoint
    if (result.reflectionCheckpoint && result.showChipSelector) {
      setShowChipSelector(true)
      setSuggestedTraits(result.suggestedTraits || [])
    }

    // Handle persona mode changes with simpler logic
    const newPersonaMode = result.personaMode || 'guidance'
    if (newPersonaMode !== personaMode) {
      setPersonaMode(newPersonaMode)

      if (newPersonaMode === 'persona_preview') {
        setShowPersonaPreview(true)

        // Only pulse once when first entering persona preview
        if (!hasShownPersonaPulse) {
          setPersonaPulse(true)
          setHasShownPersonaPulse(true)
          setTimeout(() => setPersonaPulse(false), 2000)
        }
      }
    }

    // Phase 1: Completion logic for 6 core parameters
    const coreParamCount = this.countCoreParameters(extractedConfig, result.extractedData)
    const messageCount = messages.length

    // Show Complete Setup button when we have 6 core parameters OR are in completion stage
    if (coreParamCount >= 6 || (coreParamCount >= 4 && newPersonaMode === 'persona_preview' && messageCount >= 8)) {
      setShowCompleteButton(true)
      setIsComplete(true)
    }

    // Update progress bar based on core parameters (out of 6)
    const newProgress = Math.min(95, (coreParamCount / 6) * 100)
    setProgress(newProgress)

    // Show pulsing box when progress reaches 100%
    if (newProgress >= 95 && !hasShownPersonaPulse) {
      setPersonaPulse(true)
      setHasShownPersonaPulse(true)
      setTimeout(() => setPersonaPulse(false), 2000)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleComplete = () => {
    // Ensure we have a complete config before completing
    const finalConfig: AvatarPersonaConfig = {
      toneDescription: extractedConfig.toneDescription || "Friendly and approachable",
      styleTags: extractedConfig.styleTags || ["Friendly"],
      allowedTopics: extractedConfig.allowedTopics || ["General topics"],
      restrictedTopics: extractedConfig.restrictedTopics || [],
      fallbackReply: extractedConfig.fallbackReply || "I'd prefer not to discuss that topic.",
      avatarObjective: extractedConfig.avatarObjective || ["Engage with audience"],
      audienceDescription: extractedConfig.audienceDescription || "General audience"
    }

    onComplete(finalConfig)
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

  const generateDefaultTraits = (config: Partial<AvatarPersonaConfig>): PersonalityTrait[] => {
    const traits: PersonalityTrait[] = []
    let idCounter = 1

    // Extract traits from tone description
    if (config.toneDescription) {
      const toneText = config.toneDescription.toLowerCase()
      const commonTraits = ['friendly', 'professional', 'casual', 'humorous', 'analytical', 'creative', 'empathetic', 'direct']

      commonTraits.forEach(trait => {
        if (toneText.includes(trait)) {
          traits.push({
            id: (idCounter++).toString(),
            label: trait.charAt(0).toUpperCase() + trait.slice(1),
            selected: true
          })
        }
      })
    }

    // Add some common unselected options if we don't have enough
    const additionalTraits = ['Supportive', 'Curious', 'Patient', 'Enthusiastic', 'Thoughtful']
    additionalTraits.forEach(trait => {
      if (!traits.some(t => t.label.toLowerCase() === trait.toLowerCase()) && traits.length < 8) {
        traits.push({
          id: (idCounter++).toString(),
          label: trait,
          selected: false
        })
      }
    })

    return traits.slice(0, 8)
  }

  const progressPercentage = Math.min((Object.keys(extractedConfig).filter(key => 
    extractedConfig[key as keyof AvatarPersonaConfig] && 
    (Array.isArray(extractedConfig[key as keyof AvatarPersonaConfig]) 
      ? (extractedConfig[key as keyof AvatarPersonaConfig] as any[]).length > 0
      : (extractedConfig[key as keyof AvatarPersonaConfig] as string).length > 0)
  ).length / 7) * 100, 100)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header with Progress */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
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

          {progressPercentage > 0 && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Personality Discovery Progress</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Skip Button - Top Right Corner */}
      <div className="md:hidden fixed top-4 right-4 z-20">
        <Button 
          variant="outline" 
          size="icon"
          onClick={onSkip} 
          className="h-8 w-8 bg-white shadow-sm"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Chat Container */}
      <div className="container mx-auto p-0 max-w-4xl md:p-6">
        <Card className="flex flex-col h-screen md:h-[calc(100vh-200px)] md:rounded-lg rounded-none border-0 md:border">
          <CardContent className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
            <ScrollArea className="flex-1 pr-4 mb-4">
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

                {showChipSelector && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4" />
                    </div>
                    <PersonalityTraitCloud
                      initialTraits={suggestedTraits}
                      onConfirm={handleChipConfirmation}
                      className="max-w-full"
                    />
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>

            <Separator className="mb-4" />

            <div className="space-y-4 pb-safe">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    isFinished 
                      ? "Chat completed" 
                      : reflectionActive 
                        ? "Please confirm your traits above first..."
                        : "Share your thoughts about your communication style..."
                  }
                  disabled={isLoading || isFinished || reflectionActive}
                  className={`flex-1 ${isFinished || reflectionActive ? 'bg-gray-100 text-gray-500' : ''}`}
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!inputValue.trim() || isLoading || isFinished || reflectionActive}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* Complete Setup Button - show when we have sufficient core data and not in active flow */}
              {Object.keys(extractedConfig).length >= 4 && 
               messages.filter(m => m.role === 'user').length >= 6 && 
               !showChipSelector && 
               !reflectionActive && 
               !isFinished && (
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
  // Helper method to count meaningful fields for Phase 1
  const countMeaningfulFields = (config: Partial<AvatarPersonaConfig>): number => {
    const coreFields = ['toneDescription', 'audienceDescription', 'avatarObjective', 'boundaries', 'fallbackReply', 'communicationPrefs']

    return coreFields.filter(field => {
      const value = config[field]
      if (!value) return false
      if (typeof value === 'string') return value.length > 3
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === 'object') return Object.keys(value).length > 0
      return true
    }).length
  }