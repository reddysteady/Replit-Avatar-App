// See CHANGELOG.md for 2025-06-15 [Added]
// See CHANGELOG.md for 2025-06-16 [Fixed]
import { useState, useEffect } from 'react'
import PrivacyPersonalityForm from '@/components/PrivacyPersonalityForm'
import { buildSystemPrompt } from '@shared/prompt'
import { AvatarPersonaConfig } from '@/types/AvatarPersonaConfig'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export default function AvatarSettingsPage() {
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentConfig, setCurrentConfig] =
    useState<AvatarPersonaConfig | null>(null)
  const { toast } = useToast()

  // Load existing persona configuration on mount
  useEffect(() => {
    fetchPersonaConfig()
  }, [])

  const fetchPersonaConfig = async () => {
    try {
      const response = await fetch('/api/persona')
      if (response.ok) {
        const data = await response.json()
        if (data.personaConfig) {
          setCurrentConfig(data.personaConfig)
          const generatedPrompt = buildSystemPrompt(data.personaConfig)
          setPrompt(generatedPrompt)
        }
      }
    } catch (error) {
      console.error('Error fetching persona config:', error)
    }
  }

  const handlePersonaConfig = async (config: AvatarPersonaConfig) => {
    setIsLoading(true)
    try {
      const systemPrompt = buildSystemPrompt(config)
      setPrompt(systemPrompt)

      const response = await fetch('/api/persona', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personaConfig: config,
          systemPrompt: systemPrompt,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentConfig(data.personaConfig)
        toast({
          title: 'Success',
          description: 'Persona configuration saved and cache cleared!',
        })
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: `Failed to save: ${error.message}`,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error saving persona config:', error)
      toast({
        title: 'Error',
        description: 'Failed to save persona configuration',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearCache = async () => {
    try {
      const response = await fetch('/api/cache/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: 1 }),
      })

      if (response.ok) {
        // Refresh the prompt display after clearing cache
        if (currentConfig) {
          const refreshedPrompt = buildSystemPrompt(currentConfig)
          setPrompt(refreshedPrompt)
        }
        
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

  return (
    <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none md:pt-0 pt-16 p-4">
      <h2 className="text-2xl font-bold mb-4">
        Persona: Voice &amp; Boundaries
      </h2>
      <PrivacyPersonalityForm
        onSave={handlePersonaConfig}
        initialConfig={currentConfig}
        isLoading={isLoading}
      />
      {prompt && (
        <Accordion type="single" collapsible className="mt-6">
          <AccordionItem value="preview">
            <AccordionTrigger>Generated Prompt</AccordionTrigger>
            <AccordionContent>
              <Textarea
                value={prompt}
                readOnly
                className="font-mono text-sm mb-2 max-h-60 overflow-y-auto"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(prompt)}
                  size="sm"
                >
                  Copy to clipboard
                </Button>
                <Button
                  type="button"
                  onClick={handleClearCache}
                  size="sm"
                  variant="outline"
                >
                  Clear AI Cache
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </main>
  )
}
