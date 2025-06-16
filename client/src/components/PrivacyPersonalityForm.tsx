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
    onSave(data)
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
        <div>
          <p className="text-sm font-medium mb-2">Style Tags</p>
          <div className="grid grid-cols-2 gap-2">
            {STYLE_OPTIONS.map((opt) => (
              <label key={opt} className="flex items-center space-x-2">
                <Checkbox
                  checked={form.watch('styleTags').includes(opt)}
                  onCheckedChange={(checked) => {
                    const cur = form.getValues('styleTags')
                    form.setValue(
                      'styleTags',
                      checked ? [...cur, opt] : cur.filter((v) => v !== opt),
                    )
                  }}
                />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
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
          <FormField
            control={form.control}
            name="allowedTopics"
            rules={{
              validate: (v) => v.length > 0 || 'Select at least one topic',
            }}
            render={() => (
              <FormItem className="mt-2">
                <FormControl>
                  <Input
                    placeholder="Add more, comma separated"
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
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div>
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
          <FormField
            control={form.control}
            name="restrictedTopics"
            render={() => (
              <FormItem className="mt-2">
                <FormControl>
                  <Input
                    placeholder="Add more, comma separated"
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
              </FormItem>
            )}
          />
        </div>
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
                  <label className="flex items-center space-x-2">
                    <RadioGroupItem value={field.value} />
                    <Input
                      className="ml-2"
                      placeholder="Custom response"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </label>
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