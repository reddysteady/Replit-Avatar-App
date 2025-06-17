// See CHANGELOG.md for 2025-06-15 [Added]
// See CHANGELOG.md for 2025-06-16 [Fixed]
// See CHANGELOG.md for 2025-06-17 [Changed]
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
          setCurrentConfig(data.personaConfig)
          setPrompt(buildSystemPrompt(data.personaConfig))
        } else {
          // Clear UI when no valid persona exists
          setCurrentConfig(null)
          setPrompt('')
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
      const systemPrompt = buildSystemPrompt(config)
      setPrompt(systemPrompt)

      const response = await fetch('/api/persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personaConfig: config }),
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentConfig(data.personaConfig)
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

  /* ────────────────────────────────
     UI
  ────────────────────────────────── */
  return (
    <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none md:pt-6 pt-16 p-4">
      <h2 className="text-2xl font-bold mb-6">
        Persona: Voice &amp; Boundaries
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <PrivacyPersonalityForm
            onSave={handlePersonaConfig}
            initialConfig={currentConfig}
            isLoading={isLoading}
          />
        </div>

        {prompt && (
          <div>
            <Accordion type="single" collapsible className="w-full">
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
          </div>
        )}
      </div>
    </main>
  )
}
