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
      } else {
        try {
          const errData = await response.json()
          console.error(
            'Error fetching persona config:',
            errData.message || errData,
          )
          toast({
            title: 'Error',
            description: errData.message || 'Failed to load persona',
            variant: 'destructive',
          })
        } catch (parseError) {
          console.error(
            'Error parsing persona fetch failure:',
            parseError instanceof Error ? parseError.message : parseError,
          )
        }
      }
    } catch (error) {
      console.error(
        'Error fetching persona config:',
        error instanceof Error ? error.message : error,
      )
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
          description: 'Persona configuration saved successfully!',
        })
      } else {
        try {
          const errData = await response.json()
          const message =
            errData.message || 'Failed to save persona configuration'
          toast({
            title: 'Error',
            description: message,
            variant: 'destructive',
          })
          console.error('Error saving persona config:', message)
        } catch (parseError) {
          console.error(
            'Error parsing persona save failure:',
            parseError instanceof Error ? parseError.message : parseError,
          )
          toast({
            title: 'Error',
            description: 'Failed to save persona configuration',
            variant: 'destructive',
          })
        }
      }
    } catch (error) {
      console.error(
        'Error saving persona config:',
        error instanceof Error ? error.message : error,
      )
      toast({
        title: 'Error',
        description: 'Failed to save persona configuration',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
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
              <Button
                type="button"
                onClick={() => navigator.clipboard.writeText(prompt)}
                size="sm"
              >
                Copy to clipboard
              </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </main>
  )
}
