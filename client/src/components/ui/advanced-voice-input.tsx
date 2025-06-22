
import React from 'react'
import { Mic, MicOff, Square, Volume2 } from 'lucide-react'
import { Button } from './button'
import { Badge } from './badge'
import { cn } from '@/lib/utils'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'

interface AdvancedVoiceInputProps {
  onTranscript: (text: string) => void
  onFinalTranscript?: (text: string) => void
  disabled?: boolean
  className?: string
  showTranscript?: boolean
  placeholder?: string
  continuous?: boolean
}

export default function AdvancedVoiceInput({
  onTranscript,
  onFinalTranscript,
  disabled = false,
  className,
  showTranscript = false,
  placeholder = "Click the microphone and start speaking...",
  continuous = false
}: AdvancedVoiceInputProps) {
  const {
    isListening,
    transcript,
    finalTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition({
    continuous,
    interimResults: true
  })

  React.useEffect(() => {
    if (transcript) {
      onTranscript(transcript)
    }
  }, [transcript, onTranscript])

  React.useEffect(() => {
    if (finalTranscript && onFinalTranscript) {
      onFinalTranscript(finalTranscript)
    }
  }, [finalTranscript, onFinalTranscript])

  const handleToggle = () => {
    if (isListening) {
      stopListening()
    } else {
      resetTranscript()
      startListening()
    }
  }

  if (!isSupported) {
    return null
  }

  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      <div className="flex items-center gap-2">
        <div className="relative">
          <Button
            type="button"
            variant={isListening ? "destructive" : "outline"}
            size="icon"
            onClick={handleToggle}
            disabled={disabled}
            className={cn(
              "transition-all duration-200",
              isListening && "animate-pulse"
            )}
            title={isListening ? "Stop recording" : "Start voice recording"}
          >
            {isListening ? (
              <Square className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
          
          {error && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-red-100 text-red-800 text-xs rounded shadow-lg whitespace-nowrap z-10 max-w-xs">
              {error}
            </div>
          )}
        </div>

        {isListening && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Volume2 className="h-3 w-3" />
            Listening...
          </Badge>
        )}
      </div>

      {showTranscript && (
        <div className="min-h-[40px] p-3 border rounded-md bg-gray-50">
          {transcript ? (
            <p className="text-sm">
              {transcript}
              {isListening && <span className="animate-pulse">|</span>}
            </p>
          ) : (
            <p className="text-sm text-gray-500 italic">
              {placeholder}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
