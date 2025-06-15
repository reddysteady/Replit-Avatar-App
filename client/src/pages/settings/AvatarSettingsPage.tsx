// Renders persona form and shows prompt preview - see docs/stage_1_persona.md
import { useState } from 'react'
import PrivacyPersonalityForm from '@/components/PrivacyPersonalityForm'
import { AvatarPersonaConfig } from '@/types/AvatarPersonaConfig'
import { buildSystemPrompt } from '@/lib/prompt'

export default function AvatarSettingsPage() {
  const [prompt, setPrompt] = useState('')

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Persona: Voice &amp; Boundaries</h2>
      <PrivacyPersonalityForm
        onSave={(cfg: AvatarPersonaConfig) => {
          const built = buildSystemPrompt(cfg)
          setPrompt(built)
        }}
      />
      {prompt && (
        <details className="border p-4 rounded-md">
          <summary className="cursor-pointer">Generated Prompt</summary>
          <pre className="whitespace-pre-wrap mt-2 text-sm">{prompt}</pre>
        </details>
      )}
    </div>
  )
}
