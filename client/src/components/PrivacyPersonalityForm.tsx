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
    // Ensure we have valid data
    const cleanedData = {
      ...data,
      toneDescription: data.toneDescription?.trim() || '',
      styleTags: Array.isArray(data.styleTags) ? data.styleTags : [],
      allowedTopics: Array.isArray(data.allowedTopics) ? data.allowedTopics.filter(Boolean) : [],
      restrictedTopics: Array.isArray(data.restrictedTopics) ? data.restrictedTopics.filter(Boolean) : [],
      fallbackReply: data.fallbackReply?.trim() || ''
    }
    
    // Additional validation
    if (!cleanedData.toneDescription) {
      form.setError('toneDescription', { message: 'Tone description is required' })
      return
    }
    
    if (cleanedData.allowedTopics.length === 0) {
      form.setError('allowedTopics', { message: 'Select at least one topic' })
      return
    }
    
    if (!cleanedData.fallbackReply) {
      form.setError('fallbackReply', { message: 'Fallback reply is required' })
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
          rules={{ required: "Tone description is required" }}
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
              validate: (v) => (v && v.length > 0) || 'Select at least one topic',
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
          rules={{ required: "Fallback reply is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fallback Response</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value || ""}
                  onValueChange={(value) => field.onChange(value)}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Sorry, I keep that private." id="polite" />
                    <label htmlFor="polite" className="text-sm cursor-pointer">Politely decline</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Let's chat about something else!" id="redirect" />
                    <label htmlFor="redirect" className="text-sm cursor-pointer">Redirect topic</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="custom" />
                    <Input
                      placeholder="Custom response"
                      value={field.value !== "Sorry, I keep that private." && field.value !== "Let's chat about something else!" ? field.value : ""}
                      onChange={(e) => {
                        const customValue = e.target.value;
                        field.onChange(customValue);
                      }}
                      onFocus={() => field.onChange("custom")}
                      className="flex-1 ml-2"
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