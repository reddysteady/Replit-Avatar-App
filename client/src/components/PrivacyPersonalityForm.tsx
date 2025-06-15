// See docs/stage_1_persona.md - collects persona config
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { AvatarPersonaConfig } from '@/types/AvatarPersonaConfig'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'

interface Props {
  defaultValues?: AvatarPersonaConfig
  onSave: (config: AvatarPersonaConfig) => void
}

const emptyConfig: AvatarPersonaConfig = {
  toneDescription: '',
  styleTags: [],
  allowedTopics: [],
  restrictedTopics: [],
  fallbackReply: '',
}

export default function PrivacyPersonalityForm({
  defaultValues,
  onSave,
}: Props) {
  const form = useForm<AvatarPersonaConfig>({
    defaultValues: defaultValues ?? emptyConfig,
  })
  const [saving, setSaving] = useState(false)

  const submit = form.handleSubmit((values) => {
    setSaving(true)
    // comma separated fields -> arrays
    const config: AvatarPersonaConfig = {
      ...values,
      styleTags: values.styleTags
        .toString()
        .split(/\s*,\s*/)
        .filter(Boolean),
      allowedTopics: values.allowedTopics
        .toString()
        .split(/\s*,\s*/)
        .filter(Boolean),
      restrictedTopics: values.restrictedTopics
        .toString()
        .split(/\s*,\s*/)
        .filter(Boolean),
    }
    onSave(config)
    setSaving(false)
  })

  return (
    <Form {...form}>
      <form onSubmit={submit} className="space-y-4">
        <FormField
          control={form.control}
          name="toneDescription"
          rules={{ required: true }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tone &amp; Style</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Describe how your avatar should speak"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="styleTags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Style Tags (comma separated)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Friendly, Sarcastic" />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="allowedTopics"
          rules={{ required: true }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Allowed Topics (comma separated)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Pets, hobbies" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="restrictedTopics"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Restricted Topics (comma separated)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Home address" />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fallbackReply"
          rules={{ required: true }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fallback Reply</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Sorry, I keep that private" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={saving}>
          Save Preferences
        </Button>
      </form>
    </Form>
  )
}
