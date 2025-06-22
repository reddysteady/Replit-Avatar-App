
import React, { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Square } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  disabled?: boolean
  className?: string
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

export default function VoiceInput({ onTranscript, disabled = false, className }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const finalTranscriptRef = useRef('')
  const isFirstTranscriptRef = useRef(true)

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setIsSupported(true)
      recognitionRef.current = new SpeechRecognition()
      
      const recognition = recognitionRef.current
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsRecording(true)
        setError(null)
        // Don't reset finalTranscriptRef - keep accumulating
        isFirstTranscriptRef.current = true
      }

      recognition.onend = () => {
        setIsRecording(false)
        setError(null)
        isFirstTranscriptRef.current = false
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        // Helper function to replace spoken punctuation with actual punctuation
        const replacePunctuation = (text: string): string => {
          return text
            .replace(/\bcomma\b/gi, ',')
            .replace(/\bperiod\b/gi, '.')
            .replace(/\bdot\b/gi, '.')
            .replace(/\bquestion mark\b/gi, '?')
            .replace(/\bexclamation mark\b/gi, '!')
            .replace(/\bexclamation point\b/gi, '!')
            .replace(/\bsemicolon\b/gi, ';')
            .replace(/\bcolon\b/gi, ':')
            .replace(/\bdash\b/gi, '-')
            .replace(/\bhyphen\b/gi, '-')
            .replace(/\bapostrophe\b/gi, "'")
            .replace(/\bquote\b/gi, '"')
            .replace(/\bquotation mark\b/gi, '"')
            .replace(/\bopen parenthesis\b/gi, '(')
            .replace(/\bclose parenthesis\b/gi, ')')
            .replace(/\bopen bracket\b/gi, '[')
            .replace(/\bclose bracket\b/gi, ']')
        }

        // Update final transcript accumulator with proper spacing and punctuation
        if (finalTranscript) {
          const processedTranscript = replacePunctuation(finalTranscript)
          
          // Add space before new content if this isn't the first transcript and we have existing content
          if (!isFirstTranscriptRef.current && finalTranscriptRef.current.length > 0) {
            finalTranscriptRef.current += ' ' + processedTranscript
          } else {
            finalTranscriptRef.current += processedTranscript
          }
          
          isFirstTranscriptRef.current = false
          onTranscript(finalTranscriptRef.current.trim())
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error)
        setError(event.error)
        setIsRecording(false)
        
        if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please allow microphone access and try again.')
        } else if (event.error === 'no-speech') {
          setError('No speech detected. Please try again.')
        } else {
          setError('Speech recognition failed. Please try again.')
        }
      }
    } else {
      setIsSupported(false)
    }

    return () => {
      if (recognitionRef.current && isRecording) {
        recognitionRef.current.stop()
      }
    }
  }, [onTranscript])

  const startRecording = async () => {
    if (!recognitionRef.current || disabled) return

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true })
      recognitionRef.current.start()
    } catch (err) {
      console.error('Error accessing microphone:', err)
      setError('Failed to access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  // Method to reset transcript (useful for external callers)
  const resetTranscript = () => {
    finalTranscriptRef.current = ''
    isFirstTranscriptRef.current = true
  }

  // Effect to handle external stop requests
  useEffect(() => {
    const handleStopRecording = () => {
      if (isRecording) {
        stopRecording()
      }
    }

    // Listen for global events that should stop recording
    document.addEventListener('voiceInputStop', handleStopRecording)
    
    return () => {
      document.removeEventListener('voiceInputStop', handleStopRecording)
    }
  }, [isRecording])

  if (!isSupported) {
    return null // Don't render if not supported
  }

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <Button
        type="button"
        variant={isRecording ? "destructive" : "outline"}
        size="icon"
        onClick={toggleRecording}
        disabled={disabled}
        className={cn(
          "transition-all duration-200",
          isRecording && "animate-pulse"
        )}
        title={isRecording ? "Stop recording" : "Start voice recording"}
      >
        {isRecording ? (
          <Square className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
      
      {error && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-red-100 text-red-800 text-xs rounded shadow-lg whitespace-nowrap z-10">
          {error}
        </div>
      )}
      
      {isRecording && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-blue-100 text-blue-800 text-xs rounded shadow-lg whitespace-nowrap z-10">
          Recording... Speak now
        </div>
      )}
    </div>
  )
}
