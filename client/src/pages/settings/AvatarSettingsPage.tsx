// See CHANGELOG.md for 2025-06-15 [Added]
// See CHANGELOG.md for 2025-06-16 [Fixed]
// See CHANGELOG.md for 2025-06-17 [Changed]
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, RefreshCw, Trash2, AlertCircle, MessageCircle, Settings } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import PrivacyPersonalityForm from '@/components/PrivacyPersonalityForm'
import PersonalityChat from '@/components/PersonalityChat'
import { AvatarPersonaConfig } from '@/types/AvatarPersonaConfig'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Textarea } from '@/components/ui/textarea'
import { buildSystemPrompt } from '@shared/prompt'

export default function AvatarSettingsPage() {
  const [personaConfig, setPersonaConfig] = useState<AvatarPersonaConfig | null>(null)
  const [systemPrompt, setSystemPrompt] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [setupMode, setSetupMode] = useState<'chat' | 'form'>('chat')
  const [hasCompletedChat, setHasCompletedChat] = useState(false)
  const { toast } = useToast()

  /* ────────────────────────────────
     Load existing persona on mount
  ────────────────────────────────── */
  useEffect(() => {
    fetchPersonaConfig()
  }, [])

  /* ────────────────────────────────
     Fetch persona config
  ────────────────────────────────── */
  const fetchPersonaConfig = async () => {
    try {
      const response = await fetch('/api/persona')
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched persona config:', data.personaConfig)

        if (data.personaConfig && data.personaConfig.toneDescription) {
          setPersonaConfig(data.personaConfig)
          setSystemPrompt(buildSystemPrompt(data.personaConfig))
        } else {
          // Clear UI when no valid persona exists
          setPersonaConfig(null)
          setSystemPrompt('')
        }
      } else {
        const errData = await response.json().catch(() => ({}))
        console.error(
          'Error fetching persona config:',
          errData.message || 'Unknown error',
        )
      }
    } catch (error) {
      console.error('Error fetching persona config:', error)
    }
  }

  /* ────────────────────────────────
     Save persona config
  ────────────────────────────────── */
  const handlePersonaConfig = async (config: AvatarPersonaConfig) => {
    setIsLoading(true)
    try {
      const prompt = buildSystemPrompt(config)
      setSystemPrompt(prompt)

      const response = await fetch('/api/persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personaConfig: config }),
      })

      if (response.ok) {
        const data = await response.json()
        setPersonaConfig(data.personaConfig)
        toast({
          title: 'Success',
          description: 'Persona configuration saved successfully!',
        })
      } else {
        const errData = await response.json().catch(() => ({}))
        const message =
          errData.message || 'Failed to save persona configuration'
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save persona configuration',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  /* ────────────────────────────────
     Clear AI Cache
  ────────────────────────────────── */
  const handleClearCache = async () => {
    try {
      const response = await fetch('/api/cache/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 1 }),
      })

      if (response.ok) {
        // Refresh persona after cache clear
        await fetchPersonaConfig()
        toast({
          title: 'Success',
          description: 'AI cache cleared and prompt refreshed!',
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to clear cache',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear cache',
        variant: 'destructive',
      })
    }
  }

  const handleChatComplete = (config: AvatarPersonaConfig) => {
    setPersonaConfig(config)
    setSystemPrompt(buildSystemPrompt(config))
    setHasCompletedChat(true)
    setSetupMode('form')
    toast({
      title: 'Success',
      description: 'AI Chat setup complete!',
    })
  }

  const handleSkipChat = () => {
    setSetupMode('form')
  }

  // Show chat interface first for new users
  if (setupMode === 'chat' && !hasCompletedChat && !personaConfig) {
    return (
      <PersonalityChat 
        onComplete={handleChatComplete}
        onSkip={handleSkipChat}
      />
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Persona: Voice & Boundaries</h1>
        <p className="text-muted-foreground">
          Configure how your AI avatar communicates and what topics it can discuss.
        </p>
        {hasCompletedChat && (
          <Alert className="border-green-200 bg-green-50">
            <MessageCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Great! I've captured your personality from our chat. You can now review and fine-tune the settings below.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Tabs defaultValue="setup" className="space-y-6">
        <TabsList>
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {!hasCompletedChat && personaConfig && (
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSetupMode('chat')}
              className="gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Try AI Setup Instead
            </Button>
          </div>
        )}

        <TabsContent value="setup" className="space-y-4">
          <div className="space-y-4">
            {/* Form for editing persona */}
            <PrivacyPersonalityForm
              isLoading={isLoading}
              initialConfig={personaConfig}
              onSave={handlePersonaConfig}
            />
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Prompt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {systemPrompt ? (
                <div className="relative">
                  <Textarea
                    readOnly
                    value={systemPrompt}
                    className="resize-none"
                  />
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      navigator.clipboard.writeText(systemPrompt)
                      toast({
                        title: 'Copied!',
                        description: 'System prompt copied to clipboard.',
                      })
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No prompt generated yet. Please configure your persona
                    settings.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <div className="flex justify-between">
            <div>
              <h3 className="text-lg font-semibold">Danger Zone</h3>
              <p className="text-sm text-muted-foreground">
                Careful actions here can affect your entire AI setup.
              </p>
            </div>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This will permanently clear ALL stored AI responses. Use
                wisely!
              </AlertDescription>
            </Alert>
            <Button
              variant="destructive"
              onClick={handleClearCache}
            >
              Clear AI Cache
              <Trash2 className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}