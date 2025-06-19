
// See CHANGELOG.md for 2025-06-15 [Added]
// See CHANGELOG.md for 2025-06-16 [Changed - deeper Tone & Style textbox]
// Persona logic reference: docs/stage_1_persona.md
// See CHANGELOG.md for 2025-06-16 [Changed - presets now stored in state]
// See CHANGELOG.md for 2025-06-17 [Changed - chip based UI]
// See CHANGELOG.md for 2025-06-16 [Changed - removable style/topic chips]

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
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AvatarPersonaConfig } from '@/types/AvatarPersonaConfig'

interface Props {
  onSave: (config: AvatarPersonaConfig) => void
  initialConfig?: AvatarPersonaConfig | null
  isLoading?: boolean
}

/**
 * Topic chip state for allowed/restricted selection.
 * - neutral: not categorized
 * - allowed: user explicitly allows topic
 * - restricted: user explicitly restricts topic
 */
interface TopicItem {
  label: string
  state: 'neutral' | 'allowed' | 'restricted'
}

const INITIAL_STYLE_OPTIONS = [
  'Friendly',
  'Professional',
  'Sarcastic',
  'Humorous',
]
const INITIAL_ALLOWED_PRESETS = ['My pets', 'Content creation', 'Travel tips']
const INITIAL_RESTRICTED_PRESETS = [
  'Politics',
  'Religion',
  'Personal relationships',
]

export default function PrivacyPersonalityForm({
  onSave,
  initialConfig,
  isLoading,
}: Props) {
  const [styleOptions, setStyleOptions] = React.useState<string[]>(
    INITIAL_STYLE_OPTIONS,
  )
  const [topics, setTopics] = React.useState<TopicItem[]>([
    ...INITIAL_ALLOWED_PRESETS.map((t) => ({
      label: t,
      state: 'allowed' as const,
    })),
    ...INITIAL_RESTRICTED_PRESETS.map((t) => ({
      label: t,
      state: 'restricted' as const,
    })),
  ])
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
      setStyleOptions((prev) =>
        Array.from(new Set([...prev, ...(initialConfig.styleTags || [])])),
      )
      setTopics((prev) => {
        const map = new Map(prev.map((t) => [t.label, t]))
        ;(initialConfig.allowedTopics || []).forEach((l) => {
          map.set(l, { label: l, state: 'allowed' })
        })
        ;(initialConfig.restrictedTopics || []).forEach((l) => {
          map.set(l, { label: l, state: 'restricted' })
        })
        return Array.from(map.values())
      })
      form.reset({
        toneDescription: initialConfig.toneDescription || '',
        styleTags: initialConfig.styleTags || [],
        allowedTopics: initialConfig.allowedTopics || [],
        restrictedTopics: initialConfig.restrictedTopics || [],
        fallbackReply: initialConfig.fallbackReply || '',
      })
    } else {
      // Reset to empty defaults when persona is cleared
      setTopics([
        ...INITIAL_ALLOWED_PRESETS.map((t) => ({
          label: t,
          state: 'allowed' as const,
        })),
        ...INITIAL_RESTRICTED_PRESETS.map((t) => ({
          label: t,
          state: 'restricted' as const,
        })),
      ])
      form.reset({
        toneDescription: '',
        styleTags: [],
        allowedTopics: [],
        restrictedTopics: [],
        fallbackReply: '',
      })
    }
  }, [initialConfig, form])

  const submit = (data: AvatarPersonaConfig) => {
    // Derive topics arrays from topic chips
    const allowedTopics = topics
      .filter((t) => t.state === 'allowed')
      .map((t) => t.label)
    const restrictedTopics = topics
      .filter((t) => t.state === 'restricted')
      .map((t) => t.label)

    // Ensure we have valid data
    const cleanedData = {
      ...data,
      toneDescription: data.toneDescription?.trim() || '',
      styleTags: Array.isArray(data.styleTags) ? data.styleTags : [],
      allowedTopics,
      restrictedTopics,
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

  const isCustomFallback = (value: string) => {
    return value !== 'Sorry, I keep that private.' && value !== "Let's chat about something else!"
  }

  return (
    <TooltipProvider>
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
                <FormLabel className="flex items-center gap-2">
                  Tone & Style
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Describe how your avatar should communicate. Include personality traits, 
                        communication style, and emotional tone. This forms the foundation of how 
                        your AI will respond to messages.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="How should your avatar speak?"
                    className="resize-none overflow-y-auto"
                    style={{
                      minHeight: '80px',
                      maxHeight: '240px',
                      height: Math.min(240, Math.max(80, (field.value?.split('\n').length || 1) * 24 + 32))
                    }}
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
                <FormLabel className="flex items-center gap-2">
                  Style Tags
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Quick descriptors that define your communication style. Click to select/deselect. 
                        Type in the input field and press Enter to add new tags. Click × to remove tags.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </FormLabel>
                <div className="flex flex-wrap gap-2 mt-2">
                  {styleOptions.map((opt) => {
                    const selected = form.watch('styleTags').includes(opt)
                    return (
                      <Badge
                        key={opt}
                        variant={selected ? 'default' : 'outline'}
                        onClick={() => {
                          const cur = form.getValues('styleTags')
                          form.setValue(
                            'styleTags',
                            selected
                              ? cur.filter((v) => v !== opt)
                              : [...cur, opt],
                          )
                        }}
                        className={cn(
                          'cursor-pointer flex items-center h-8 px-3 text-sm',
                          selected && 'bg-[#3A8DFF]',
                        )}
                      >
                        {opt}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setStyleOptions((prev) =>
                              prev.filter((v) => v !== opt),
                            )
                            form.setValue(
                              'styleTags',
                              form
                                .getValues('styleTags')
                                .filter((v) => v !== opt),
                            )
                          }}
                          className="ml-2 text-xs hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    )
                  })}
                  <Input
                    placeholder="Add tag"
                    className="h-8 w-32 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const value = e.currentTarget.value.trim()
                        if (value) {
                          setStyleOptions((prev) =>
                            Array.from(new Set([...prev, value])),
                          )
                          form.setValue('styleTags', [
                            ...form.getValues('styleTags'),
                            value,
                          ])
                          e.currentTarget.value = ''
                        }
                      }
                    }}
                  />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="allowedTopics"
            rules={{
              validate: () =>
                topics.some((t) => t.state !== 'neutral') ||
                'Select at least one topic',
            }}
            render={() => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Topics
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Manage what your avatar can discuss. Click chips to cycle: 
                        <br />• Gray = Neutral (no preference)
                        <br />• Green = Allowed topics 
                        <br />• Red = Restricted topics
                        <br />Type and press Enter to add new topics. Click × to remove.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </FormLabel>
                <div className="flex flex-wrap gap-2 mt-2">
                  {topics.map((topic, idx) => (
                    <Badge
                      key={topic.label}
                      variant={
                        topic.state === 'allowed'
                          ? 'secondary'
                          : topic.state === 'restricted'
                            ? 'destructive'
                            : 'outline'
                      }
                      onClick={() => {
                        setTopics((prev) => {
                          const next = [...prev]
                          const current = next[idx]
                          const nextState =
                            current.state === 'neutral'
                              ? 'allowed'
                              : current.state === 'allowed'
                                ? 'restricted'
                                : 'neutral'
                          next[idx] = { ...current, state: nextState }
                          return next
                        })
                      }}
                      className={cn(
                        'cursor-pointer select-none flex items-center h-8 px-3 text-sm',
                        {
                          'border-green-600 text-green-600 bg-green-50 hover:bg-green-100':
                            topic.state === 'allowed',
                          'border-red-600 text-red-600 bg-red-50 hover:bg-red-100':
                            topic.state === 'restricted',
                        },
                      )}
                    >
                      {topic.label}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setTopics((prev) =>
                            prev.filter((t) => t.label !== topic.label),
                          )
                        }}
                        className="ml-2 text-xs hover:text-red-500"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                  <Input
                    placeholder="Add topics"
                    className="h-8 w-36 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const values = e.currentTarget.value
                          .split(',')
                          .map((t) => t.trim())
                          .filter(Boolean)
                        if (values.length > 0) {
                          setTopics((prev) => {
                            const map = new Map(prev.map((t) => [t.label, t]))
                            values.forEach((v) => {
                              if (!map.has(v)) {
                                map.set(v, { label: v, state: 'neutral' })
                              }
                            })
                            return Array.from(map.values())
                          })
                          e.currentTarget.value = ''
                        }
                      }
                    }}
                  />
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
                <FormLabel className="flex items-center gap-2">
                  Fallback Response
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Choose how your avatar responds when asked about restricted topics. 
                        Select a preset option or create a custom response that matches your style.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    value={isCustomFallback(field.value) ? 'custom' : field.value}
                    onValueChange={(value) => {
                      if (value === 'custom') {
                        field.onChange('')
                      } else {
                        field.onChange(value)
                      }
                    }}
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
                          isCustomFallback(field.value) ? field.value : ''
                        }
                        onChange={(e) => {
                          const customValue = e.target.value
                          field.onChange(customValue)
                        }}
                        onFocus={() => {
                          if (!isCustomFallback(field.value)) {
                            field.onChange('')
                          }
                        }}
                        className="text-sm"
                      />
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="mt-6" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Preferences'}
          </Button>
          
          {/* Success instruction after save */}
          <p className="text-sm text-muted-foreground mt-2">
            After saving, you can test your AI avatar by going to the Messages page and starting a conversation.
          </p>
        </form>
      </Form>
    </TooltipProvider>
  )
}
