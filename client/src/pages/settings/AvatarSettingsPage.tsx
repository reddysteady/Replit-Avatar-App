// See CHANGELOG.md for 2025-06-15 [Added]
import { useState } from 'react'
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

export default function AvatarSettingsPage() {
  const [prompt, setPrompt] = useState('')

  const handlePersonaConfig = (config: AvatarPersonaConfig) => {
    const p = buildSystemPrompt(config)
    setPrompt(p)
    // TODO persist to server
  }

  return (
    <main className="p-4">
      <h2 className="text-2xl font-bold mb-4">
        Persona: Voice &amp; Boundaries
      </h2>
      <PrivacyPersonalityForm onSave={handlePersonaConfig} />
      {prompt && (
        <Accordion type="single" collapsible className="mt-6">
          <AccordionItem value="preview">
            <AccordionTrigger>Generated Prompt</AccordionTrigger>
            <AccordionContent>
              <Textarea
                value={prompt}
                readOnly
                className="font-mono text-sm mb-2"
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
