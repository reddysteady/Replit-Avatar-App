// See CHANGELOG.md for 2025-06-17 [Added]
import React, { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshCw, Link2 } from 'lucide-react'
import type { MessageThread } from '@shared/schema'

type ToolsDrawerProps = {
  open: boolean
  onClose: () => void
  onGenerateBatch: () => void
  threads: MessageThread[]
  customThreadId: string
  setCustomThreadId: (id: string) => void
  customMessage: string
  setCustomMessage: (msg: string) => void
  onSendCustom: () => void
  canSend?: boolean
  onReloadDb: () => void
  onClearCache: () => void
  onSetupWebhook: () => void
}

const ToolsDrawer = ({
  open,
  onClose,
  onGenerateBatch,
  threads,
  customThreadId,
  setCustomThreadId,
  customMessage,
  setCustomMessage,
  onSendCustom,
  canSend = true,
  onReloadDb,
  onClearCache,
  onSetupWebhook,
}: ToolsDrawerProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
      }
      document.addEventListener('keydown', handleKey)
      return () => document.removeEventListener('keydown', handleKey)
    }
  }, [open, onClose])

  useEffect(() => {
    const trap = (e: FocusEvent) => {
      if (open && inputRef.current && !inputRef.current.closest('.tools-drawer')?.contains(e.target as Node)) {
        e.stopPropagation()
        inputRef.current?.focus()
      }
    }
    if (open) {
      document.addEventListener('focusin', trap)
      return () => document.removeEventListener('focusin', trap)
    }
  }, [open])

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="tools-drawer fixed top-0 right-0 z-50 w-2/5 max-w-sm min-w-[240px] h-full bg-white shadow-2xl rounded-l-lg py-4 px-4 flex flex-col space-y-2">
        <div className="text-xs text-gray-500 font-semibold uppercase mb-1 mt-2 px-1">Tools</div>
        <Button className="w-full mb-2 bg-gray-900 text-white hover:bg-gray-800 border-gray-900" onClick={() => { onGenerateBatch(); onClose() }}>
          Generate Batch Messages
        </Button>
        <Select onValueChange={setCustomThreadId} value={customThreadId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Generate For Thread" />
          </SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            {threads.map((thread) => (
              <SelectItem key={thread.id} value={String(thread.id)}>
                {thread.participantName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          ref={inputRef}
          className="mt-2"
          placeholder="Custom message"
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
        />
        <Button className="w-full mt-2" disabled={!canSend} onClick={() => { onSendCustom(); onClose() }}>
          Send Custom Message
        </Button>
        <Button variant="outline" className="w-full mt-2" onClick={() => { onReloadDb(); onClose() }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reload - database
        </Button>
        <Button variant="outline" className="w-full mt-2" onClick={() => { onClearCache(); onClose() }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reload - frontend cache
        </Button>
        <Button variant="outline" className="w-full mt-2" onClick={() => { onSetupWebhook(); onClose() }}>
          <Link2 className="h-4 w-4 mr-2" />
          Setup Webhook
        </Button>
      </div>
    </>
  )
}

export default ToolsDrawer

