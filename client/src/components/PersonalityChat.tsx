import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { MessageCircle, Send, Sparkles, User, Bot, ArrowRight, SkipForward } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { AvatarPersonaConfig } from '@/types/AvatarPersonaConfig'

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
}

interface PersonalityExtractionResponse {
  response: string
  extractedData: Partial<AvatarPersonaConfig>
  isComplete: boolean
  personaMode?: 'guidance' | 'blended' | 'persona_preview'
  confidenceScore?: number
  transitionMessage?: string
}

export default function PersonalityChat({ onComplete, onSkip }: PersonalityChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isInitializing, setIsInitializing] = useState(true)
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [extractedConfig, setExtractedConfig] = useState<Partial<AvatarPersonaConfig>>({})
  const [isComplete, setIsComplete] = useState(false)
  const [currentPersonaMode, setCurrentPersonaMode] = useState<'guidance' | 'blended' | 'persona_preview'>('guidance')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Generate dynamic initial message
  useEffect(() => {
    const generateInitialMessage = async () => {
      try {
        const response = await fetch('/api/ai/personality-extract', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content: 'Generate an engaging opening question to start persona discovery. Make it warm, specific, and designed to capture the creator\'s communication style and goals.'
              }
            ],
            currentConfig: {},
            initialMessage: true
          })
        })

        if (!response.ok) {
          throw new Error('Failed to generate initial message')
        }

        const aiResponse: PersonalityExtractionResponse = await response.json()

        const initialMessage: ChatMessage = {
          id: '1',
          role: 'assistant',
          content: aiResponse.response || "Hi! I'm here to help set up your AI avatar's personality. Let's start with something specific - imagine your favorite follower just asked you for advice. How do you typically respond to them?",
          timestamp: new Date(),
          personaMode: 'guidance'
        }

        setMessages([initialMessage])
      } catch (error) {
        console.error('Error generating initial message:', error)
        // Fallback to improved static message
        const fallbackMessage: ChatMessage = {
          id: '1',
          role: 'assistant',
          content: "Hey there! I'm excited to help you create your AI avatar. Let's start with something fun - if your biggest fan asked you to describe your communication style in three words, what would they be?",
          timestamp: new Date(),
          personaMode: 'guidance'
        }
        setMessages([fallbackMessage])
      } finally {
        setIsInitializing(false)
      }
    }

    generateInitialMessage()
  }, [])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

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
      const response = await fetch('/api/ai/personality-extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          currentConfig: extractedConfig
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
      setCurrentPersonaMode(aiResponse.personaMode || 'guidance')

      if (aiResponse.transitionMessage) {
        toast({
          title: 'Persona Preview Activated',
          description: aiResponse.transitionMessage
        })
      }

    } catch (error) {
      console.error('Error in personality chat:', error)
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
        return <Badge variant="default" className="mb-2 bg-purple-100 text-purple-800">🎭 Persona Preview Active</Badge>
      default:
        return null
    }
  }

  const progressPercentage = Math.min((Object.keys(extractedConfig).filter(key => 
    extractedConfig[key as keyof AvatarPersonaConfig] && 
    (Array.isArray(extractedConfig[key as keyof AvatarPersonaConfig]) 
      ? (extractedConfig[key as keyof AvatarPersonaConfig] as any[]).length > 0
      : (extractedConfig[key as keyof AvatarPersonaConfig] as string).length > 0)
  ).length / 7) * 100, 100)

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="h-[80vh] flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                AI Voice Setup Chat
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Let's discover your unique communication style through conversation
              </p>
            </div>
            <Button variant="outline" onClick={onSkip} className="flex items-center gap-2">
              <SkipForward className="h-4 w-4" />
              Skip to Form
            </Button>
          </div>
          
          {progressPercentage > 0 && (
            <div className="mt-4">
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
        </CardHeader>

        <CardContent className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
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
                    <div className={`rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      {getPersonaModeIndicator(message.personaMode)}
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {message.timestamp.toLocaleTimeString()}
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
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          <Separator className="my-4" />

          <div className="space-y-4">
            {isComplete && (
              <Alert className="border-green-200 bg-green-50">
                <Sparkles className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Perfect! I've captured your personality. Ready to finalize your AI avatar setup?
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Share your thoughts about your communication style..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={!inputValue.trim() || isLoading}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {isComplete && (
              <div className="flex gap-2">
                <Button onClick={handleComplete} className="flex-1 flex items-center gap-2">
                  Complete Setup
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => setIsComplete(false)}>
                  Keep Chatting
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}