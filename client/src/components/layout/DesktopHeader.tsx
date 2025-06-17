
// See CHANGELOG.md for 2025-06-17 [Added]
import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import {
  Menu,
  MessageSquare,
  BarChart2,
  Settings,
  FlaskConical,
  Lock,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Trash2,
  MessageCircle,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface DesktopHeaderProps {
  conversationData?: {
    participantName?: string
    participantAvatar?: string
    platform?: string
    threadId?: number
  }
  showBack?: boolean
  handleBack?: () => void
  onDeleteThread?: () => void
}

const DesktopHeader = ({
  conversationData,
  showBack,
  handleBack,
  onDeleteThread,
}: DesktopHeaderProps) => {
  const location = useLocation()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [customMessage, setCustomMessage] = useState('')
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const currentPath = location.pathname
  const isConversationView = ['/', '/instagram', '/youtube'].includes(currentPath)

  const NavItem = ({
    to,
    children,
    icon,
    activePaths,
    className,
  }: {
    to: string
    children: React.ReactNode
    icon?: React.ReactNode
    activePaths: string[]
    className?: string
  }) => {
    const active = activePaths.includes(currentPath)
    return (
      <Link
        to={to}
        onClick={() => setIsSheetOpen(false)}
        className={cn(
          'flex items-center px-4 py-2 text-base font-medium',
          active ? 'text-blue-500' : 'text-neutral-700 hover:text-neutral-900',
          className,
        )}
      >
        {icon && (
          <span
            className={cn(
              'mr-3 h-5 w-5',
              active ? 'text-[#FF7300]' : 'text-neutral-500',
            )}
          >
            {icon}
          </span>
        )}
        {children}
      </Link>
    )
  }

  const handleSendCustomMessage = async () => {
    if (!customMessage.trim() || !conversationData?.threadId) {
      toast({
        title: 'Invalid input',
        description: 'Please enter a message and ensure a conversation is selected',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch(`/api/test/generate-for-user/${conversationData.threadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: customMessage }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      toast({
        title: 'Message sent',
        description: 'Custom message has been generated',
      })

      setCustomMessage('')
      setIsSheetOpen(false)

      // Invalidate queries to refresh the conversation
      queryClient.invalidateQueries({ queryKey: ['/api/threads'] })
      queryClient.invalidateQueries({
        queryKey: ['thread-messages', Number(conversationData.threadId)],
      })
    } catch (error) {
      console.error('Error sending custom message:', error)
      toast({
        title: 'Error',
        description: 'Failed to send custom message',
        variant: 'destructive',
      })
    }
  }

  const handleGenerateBatch = async () => {
    try {
      const response = await fetch('/api/test/generate-batch', { 
        method: 'POST' 
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate batch')
      }

      toast({ 
        title: 'Batch generated', 
        description: '10 messages created' 
      })
      
      setIsSheetOpen(false)
      queryClient.invalidateQueries({ queryKey: ['/api/threads'] })
    } catch (error) {
      console.error('Batch error:', error)
      toast({
        title: 'Error',
        description: 'Batch generation failed',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteThread = () => {
    if (onDeleteThread) {
      onDeleteThread()
    }
    setIsSheetOpen(false)
  }

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <div className="hidden md:block fixed top-0 left-0 right-0 bg-white border-b border-neutral-200 z-10">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center flex-1 min-w-0">
            {showBack && (
              <button
                aria-label="Back"
                onClick={handleBack}
                className="mr-3 p-2 rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 focus:outline-none"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
            )}

            {conversationData ? (
              <div className="flex items-center min-w-0 flex-1">
                {conversationData.participantAvatar && (
                  <img
                    src={conversationData.participantAvatar}
                    alt={conversationData.participantName}
                    className="h-8 w-8 rounded-full mr-3"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center">
                    <h1 className="text-lg font-semibold text-neutral-900 truncate mr-2">
                      {conversationData.participantName || 'Conversation'}
                    </h1>
                    {conversationData.platform && (
                      <span className="px-2 py-0.5 text-xs rounded bg-gray-200 text-gray-700 capitalize">
                        {conversationData.platform}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <h1 className="text-lg font-semibold text-neutral-900">Avatar</h1>
            )}
          </div>

          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="p-2 rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 focus:outline-none"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
        </div>
      </div>
      <SheetContent side="right" className="w-80 pt-8 overflow-y-auto">
        <nav className="space-y-1">
          <NavItem
            to="/"
            icon={<MessageSquare className="h-5 w-5" />}
            activePaths={['/', '/instagram', '/youtube']}
          >
            Conversations
          </NavItem>
          <NavItem
            to="/analytics"
            icon={<BarChart2 className="h-5 w-5" />}
            activePaths={['/analytics']}
          >
            Insights
          </NavItem>

          {/* Collapsible Settings Section */}
          <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2 text-base font-medium text-neutral-700 hover:text-neutral-900">
              <div className="flex items-center">
                <Settings className="mr-3 h-5 w-5 text-neutral-500" />
                Settings
              </div>
              {settingsOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1">
              <NavItem
                to="/settings/sources"
                activePaths={['/settings/sources']}
                className="pl-8"
              >
                Content Sources
              </NavItem>
              <NavItem
                to="/settings/persona"
                activePaths={['/settings/persona']}
                className="pl-8"
              >
                Persona
              </NavItem>
              <NavItem
                to="/settings/ai"
                activePaths={['/settings/ai']}
                className="pl-8"
              >
                AI Settings
              </NavItem>
              <NavItem
                to="/settings/automation"
                activePaths={['/settings/automation']}
                className="pl-8"
              >
                Automation
              </NavItem>
              <NavItem
                to="/settings/notifications"
                activePaths={['/settings/notifications']}
                className="pl-8"
              >
                Notifications
              </NavItem>
              <NavItem
                to="/settings/api"
                activePaths={['/settings/api']}
                className="pl-8"
              >
                API Keys
              </NavItem>
            </CollapsibleContent>
          </Collapsible>

          <NavItem
            to="/settings/testing-tools"
            icon={<FlaskConical className="h-5 w-5" />}
            activePaths={['/settings/testing-tools']}
          >
            Testing Tools
          </NavItem>
          <NavItem
            to="/settings/privacy"
            icon={<Lock className="h-5 w-5" />}
            activePaths={['/settings/privacy']}
          >
            Privacy Policy
          </NavItem>
        </nav>

        {isConversationView && (
          <div className="mt-4">
            <Separator className="my-3" />
            <div className="px-4">
              <div className="text-xs text-neutral-500 uppercase tracking-wider mb-3">
                Thread Actions
              </div>

              {/* Delete Thread */}
              {onDeleteThread && (
                <button
                  onClick={handleDeleteThread}
                  className="flex items-center w-full px-0 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md -mx-2 px-2 mb-3"
                >
                  <Trash2 className="h-4 w-4 mr-3" />
                  Delete Thread
                </button>
              )}

              {/* Generate Custom Message */}
              <div className="mb-4">
                <div className="flex items-center py-2 text-sm text-neutral-600">
                  <MessageCircle className="h-4 w-4 mr-3" />
                  Generate Custom Message
                </div>
                <div className="ml-7 mt-2">
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
              </div>

              {/* Generate Batch Messages */}
              <div>
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
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default DesktopHeader
