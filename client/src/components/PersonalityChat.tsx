import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Send, Bot, User } from 'lucide-react'
import { AvatarPersonaConfig } from '@/types/AvatarPersonaConfig'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  extractedData?: Partial<AvatarPersonaConfig>
  timestamp: Date
}

interface PersonalityChatProps {
  onComplete: (config: AvatarPersonaConfig) => void
  onSkip: () => void
}

export default function PersonalityChat({ onComplete, onSkip }: PersonalityChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hi! I'm here to help you set up your AI avatar's personality. Let's have a quick chat to understand how you want your avatar to communicate. To start, what's your overall vibe when you talk to your audience? Are you more casual and fun, or professional and informative?",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [extractedConfig, setExtractedConfig] = useState<Partial<AvatarPersonaConfig>>({})
  const [completedFields, setCompletedFields] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const requiredFields = [
    'toneDescription',
    'styleTags', 
    'allowedTopics',
    'restrictedTopics',
    'fallbackReply',
    'avatarObjective',
    'audienceDescription'
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/personality-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          currentConfig: extractedConfig
        })
      })

      if (!response.ok) throw new Error('Failed to process message')

      const data = await response.json()

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        extractedData: data.extractedData,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

      // Update extracted config
      if (data.extractedData) {
        setExtractedConfig(prev => ({ ...prev, ...data.extractedData }))

        // Track completed fields
        const newCompleted = new Set(completedFields)
        Object.keys(data.extractedData).forEach(key => {
          if (data.extractedData[key] && data.extractedData[key].length > 0) {
            newCompleted.add(key)
          }
        })
        setCompletedFields(newCompleted)
      }

    } catch (error) {
      console.error('Error processing message:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I had trouble processing that. Could you try rephrasing?",
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = () => {
    // Ensure all required fields have reasonable defaults
    const completeConfig: AvatarPersonaConfig = {
      toneDescription: extractedConfig.toneDescription || 'Friendly and approachable',
      styleTags: extractedConfig.styleTags || ['Friendly'],
      allowedTopics: extractedConfig.allowedTopics || ['General conversation'],
      restrictedTopics: extractedConfig.restrictedTopics || ['Personal information'],
      fallbackReply: extractedConfig.fallbackReply || "I'd prefer to keep that private!",
      avatarObjective: extractedConfig.avatarObjective || ['Build Community'],
      audienceDescription: extractedConfig.audienceDescription || 'General audience'
    }
    onComplete(completeConfig)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const progress = (completedFields.size / requiredFields.length) * 100

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">AI Personality Setup</h1>
        <p className="text-muted-foreground">
          Let's chat to understand your avatar's personality and communication style
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {completedFields.size} of {requiredFields.length} areas covered
        </p>
      </div>

      {/* Extracted Data Preview */}
      {Object.keys(extractedConfig).length > 0 && (
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">What I've learned so far:</h3>
            <div className="space-y-2">
              {extractedConfig.toneDescription && (
                <div>
                  <span className="font-medium">Tone:</span> {extractedConfig.toneDescription}
                </div>
              )}
              {extractedConfig.styleTags && extractedConfig.styleTags.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Style:</span>
                  {extractedConfig.styleTags.map(tag => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              )}
              {extractedConfig.allowedTopics && extractedConfig.allowedTopics.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Topics:</span>
                  {extractedConfig.allowedTopics.slice(0, 3).map(topic => (
                    <Badge key={topic} variant="outline" className="border-green-300 text-green-700">{topic}</Badge>
                  ))}
                  {extractedConfig.allowedTopics.length > 3 && (
                    <span className="text-sm text-muted-foreground">+{extractedConfig.allowedTopics.length - 3} more</span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Messages */}
      <Card className="h-96 overflow-hidden">
        <CardContent className="p-0 h-full">
          <div className="h-full overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className="flex-shrink-0">
                    {message.role === 'user' ? (
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div
                    className={`rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
      </Card>

      {/* Input Area */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your response..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button 
          onClick={sendMessage} 
          disabled={!input.trim() || isLoading}
          size="icon"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onSkip}>
          Skip & Fill Manually
        </Button>
        <Button 
          onClick={handleComplete}
          disabled={completedFields.size < 3} // Require at least 3 fields
          className="bg-blue-600 hover:bg-blue-700"
        >
          Continue with Setup ({completedFields.size}/{requiredFields.length})
        </Button>
      </div>
    </div>
  )
}