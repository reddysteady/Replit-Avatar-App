// See CHANGELOG.md for 2025-06-17 [Added]
import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Menu, MessageCircle } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'

interface DesktopHeaderProps {
  conversationData?: {
    participantName?: string
    participantAvatar?: string
    platform?: string
    threadId?: number
  }
}

const DesktopHeader = ({ conversationData }: DesktopHeaderProps) => {
  const location = useLocation()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [customMessage, setCustomMessage] = useState('')

  const isConversationView = ['/', '/instagram', '/youtube'].includes(
    location.pathname,
  )

  const handleSendCustomMessage = async () => {
    if (!customMessage.trim() || !conversationData?.threadId) return
    try {
      const res = await fetch(
        `/api/test/generate-for-user/${conversationData.threadId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: customMessage }),
        },
      )
      if (!res.ok) throw new Error('Failed to send message')
      toast({
        title: 'Message sent',
        description: 'Custom message has been generated',
      })
      setCustomMessage('')
      setIsSheetOpen(false)
      queryClient.invalidateQueries({ queryKey: ['/api/threads'] })
      queryClient.invalidateQueries({
        queryKey: ['thread-messages', Number(conversationData.threadId)],
      })
    } catch (err) {
      console.error('Error sending custom message:', err)
      toast({
        title: 'Error',
        description: 'Failed to send custom message',
        variant: 'destructive',
      })
    }
  }

  const handleGenerateBatch = async () => {
    try {
      const res = await fetch('/api/test/generate-batch', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to generate batch')
      toast({ title: 'Batch generated', description: '10 messages created' })
      setIsSheetOpen(false)
      queryClient.invalidateQueries({ queryKey: ['/api/threads'] })
    } catch (err) {
      console.error('Batch error:', err)
      toast({
        title: 'Error',
        description: 'Batch generation failed',
        variant: 'destructive',
      })
    }
  }

  if (!isConversationView) {
    return (
      <div className="hidden md:block fixed top-0 left-0 right-0 bg-white border-b border-neutral-200 z-10">
        <div className="flex items-center h-16 px-4">
          <h1 className="text-lg font-semibold text-neutral-900">Avatar</h1>
        </div>
      </div>
    )
  }

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <div className="hidden md:block fixed top-0 left-0 right-0 bg-white border-b border-neutral-200 z-10">
        <div className="flex items-center h-16 px-4">
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="p-2 rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 focus:outline-none"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          {conversationData && (
            <div className="flex items-center ml-3 truncate">
              {conversationData.participantAvatar && (
                <img
                  src={conversationData.participantAvatar}
                  alt={conversationData.participantName}
                  className="h-8 w-8 rounded-full mr-3"
                />
              )}
              <h1 className="text-lg font-semibold text-neutral-900 truncate mr-2">
                {conversationData.participantName || 'Conversation'}
              </h1>
              {conversationData.platform && (
                <span className="px-2 py-0.5 text-xs rounded bg-gray-200 text-gray-700 capitalize">
                  {conversationData.platform}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      <SheetContent side="left" className="w-80 pt-8">
        <div className="px-4">
          <div className="text-xs text-neutral-500 uppercase tracking-wider mb-3">
            Thread Actions
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center text-sm text-neutral-600 mb-2">
                <MessageCircle className="h-4 w-4 mr-3" />
                Generate Custom Message
              </div>
              <Input
                placeholder="Custom message"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="mb-2 text-sm"
              />
              <Button
                onClick={handleSendCustomMessage}
                size="sm"
                className="w-full"
                disabled={!customMessage.trim()}
              >
                Generate
              </Button>
            </div>
            <Separator />
            <Button
              onClick={handleGenerateBatch}
              size="sm"
              variant="outline"
              className="w-full"
            >
              Generate Batch Messages
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default DesktopHeader
