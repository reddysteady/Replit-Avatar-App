// See CHANGELOG.md for 2025-06-15 [Added]
// See CHANGELOG.md for 2025-06-16 [Changed - deeper Tone & Style textbox]
import React from 'react'
import { useForm } from 'react-hook-form'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import Chip from '@/components/ui/chip'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Button } from '@/components/ui/button'
import { AvatarPersonaConfig } from '@/types/AvatarPersonaConfig'

interface Props {
  onSave: (config: AvatarPersonaConfig) => void
  initialConfig?: AvatarPersonaConfig | null
  isLoading?: boolean
}

const STYLE_OPTIONS = ['Friendly', 'Professional', 'Sarcastic', 'Humorous']
const ALLOWED_PRESETS = ['My pets', 'Content creation', 'Travel tips']
const RESTRICTED_PRESETS = ['Politics', 'Religion', 'Personal relationships']

export default function PrivacyPersonalityForm({
  onSave,
  initialConfig,
  isLoading,
}: Props) {
  const form = useForm<AvatarPersonaConfig>({
    defaultValues: {
      toneDescription: initialConfig?.toneDescription || '',
      styleTags: initialConfig?.styleTags || [],
      allowedTopics: initialConfig?.allowedTopics || [],
      restrictedTopics: initialConfig?.restrictedTopics || [],
      fallbackReply: initialConfig?.fallbackReply || '',
    },
  })

  // Update form when initialConfig changes
  React.useEffect(() => {
    if (initialConfig) {
      form.reset({
        toneDescription: initialConfig.toneDescription || '',
        styleTags: initialConfig.styleTags || [],
        allowedTopics: initialConfig.allowedTopics || [],
        restrictedTopics: initialConfig.restrictedTopics || [],
        fallbackReply: initialConfig.fallbackReply || '',
      })
    }
  }, [initialConfig, form])

  const submit = (data: AvatarPersonaConfig) => {
    // Ensure we have valid data
    const cleanedData = {
      ...data,
      toneDescription: data.toneDescription?.trim() || '',
      styleTags: Array.isArray(data.styleTags) ? data.styleTags : [],
      allowedTopics: Array.isArray(data.allowedTopics)
        ? data.allowedTopics.filter(Boolean)
        : [],
      restrictedTopics: Array.isArray(data.restrictedTopics)
        ? data.restrictedTopics.filter(Boolean)
        : [],
      fallbackReply: data.fallbackReply?.trim() || '',
    }

    // Additional validation
    if (!cleanedData.toneDescription) {
      form.setError('toneDescription', {
        message: 'Tone description is required',
      })
      return
    }

    if (cleanedData.allowedTopics.length === 0) {
      form.setError('allowedTopics', { message: 'Select at least one topic' })
      return
    }

    if (
      !cleanedData.fallbackReply ||
      cleanedData.fallbackReply.trim() === '' ||
      cleanedData.fallbackReply === 'custom'
    ) {
      form.setError('fallbackReply', {
        message: 'Please provide a fallback reply',
      })
      return
    }

    onSave(cleanedData)
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submit)}
        className="space-y-6 max-w-2xl"
      >
        <FormField
          control={form.control}
          name="toneDescription"
          rules={{ required: true }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tone & Style</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="How should your avatar speak?"
                  className="min-h-[240px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="styleTags"
          render={() => (
            <FormItem>
              <FormLabel>Style Tags</FormLabel>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {STYLE_OPTIONS.map((opt) => (
                  <label key={opt} className="flex items-center space-x-2">
                    <Checkbox
                      checked={form.watch('styleTags').includes(opt)}
                      onCheckedChange={(checked) => {
                        const cur = form.getValues('styleTags')
                        form.setValue(
                          'styleTags',
                          checked
                            ? [...cur, opt]
                            : cur.filter((v) => v !== opt),
                        )
                      }}
                    />
                    <span className="text-sm">{opt}</span>
                  </label>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="allowedTopics"
          rules={{
            validate: (v) => v.length > 0 || 'Select at least one topic',
          }}
          render={() => (
            <FormItem>
              <FormLabel>Allowed Topics</FormLabel>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {ALLOWED_PRESETS.map((topic) => (
                  <label key={topic} className="flex items-center space-x-2">
                    <Checkbox
                      checked={form.watch('allowedTopics').includes(topic)}
                      onCheckedChange={(c) => {
                        const cur = form.getValues('allowedTopics')
                        form.setValue(
                          'allowedTopics',
                          c ? [...cur, topic] : cur.filter((t) => t !== topic),
                        )
                      }}
                    />
                    <span className="text-sm">{topic}</span>
                  </label>
                ))}
              </div>
              <FormControl>
                <Input
                  placeholder="Add more, comma separated"
                  className="mt-2"
                  onBlur={(e) => {
                    const extras = e.target.value
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean)
                    if (extras.length > 0) {
                      form.setValue('allowedTopics', [
                        ...form.getValues('allowedTopics'),
                        ...extras,
                      ])
                      e.target.value = ''
                    }
                  }}
                />
              </FormControl>
              <div className="mt-2 flex flex-wrap gap-2">
                {form.watch('allowedTopics').map((topic) => (
                  <Chip
                    key={topic}
                    onRemove={() => {
                      const cur = form.getValues('allowedTopics')
                      form.setValue(
                        'allowedTopics',
                        cur.filter((t) => t !== topic),
                      )
                    }}
                  >
                    {topic}
                  </Chip>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="restrictedTopics"
          render={() => (
            <FormItem>
              <FormLabel>Restricted Topics</FormLabel>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {RESTRICTED_PRESETS.map((topic) => (
                  <label key={topic} className="flex items-center space-x-2">
                    <Checkbox
                      checked={form.watch('restrictedTopics').includes(topic)}
                      onCheckedChange={(c) => {
                        const cur = form.getValues('restrictedTopics')
                        form.setValue(
                          'restrictedTopics',
                          c ? [...cur, topic] : cur.filter((t) => t !== topic),
                        )
                      }}
                    />
                    <span className="text-sm">{topic}</span>
                  </label>
                ))}
              </div>
              <FormControl>
                <Input
                  placeholder="Add more, comma separated"
                  className="mt-2"
                  onBlur={(e) => {
                    const extras = e.target.value
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean)
                    if (extras.length > 0) {
                      form.setValue('restrictedTopics', [
                        ...form.getValues('restrictedTopics'),
                        ...extras,
                      ])
                      e.target.value = ''
                    }
                  }}
                />
              </FormControl>
              <div className="mt-2 flex flex-wrap gap-2">
                {form.watch('restrictedTopics').map((topic) => (
                  <Chip
                    key={topic}
                    onRemove={() => {
                      const cur = form.getValues('restrictedTopics')
                      form.setValue(
                        'restrictedTopics',
                        cur.filter((t) => t !== topic),
                      )
                    }}
                  >
                    {topic}
                  </Chip>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fallbackReply"
          rules={{ required: true }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fallback Response</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="space-y-2"
                >
                  <label className="flex items-center space-x-2">
                    <RadioGroupItem value="Sorry, I keep that private." />
                    <span className="text-sm">Politely decline</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <RadioGroupItem value="Let's chat about something else!" />
                    <span className="text-sm">Redirect topic</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" />
                    <Input
                      placeholder="Custom response"
                      value={
                        field.value === 'Sorry, I keep that private.' ||
                        field.value === "Let's chat about something else!"
                          ? ''
                          : field.value
                      }
                      onChange={(e) => {
                        const customValue = e.target.value
                        if (customValue.trim()) {
                          field.onChange(customValue)
                        } else {
                          field.onChange('custom')
                        }
                      }}
                      onFocus={() => {
                        if (
                          field.value === 'Sorry, I keep that private.' ||
                          field.value === "Let's chat about something else!"
                        ) {
                          field.onChange('')
                        }
                      }}
                    />
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="mt-2" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Preferences'}
        </Button>
      </form>
    </Form>
  )
}
