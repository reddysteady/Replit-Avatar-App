// See CHANGELOG.md for 2025-06-17 [Changed - back button]
import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'

interface MobileHeaderProps {
  conversationData?: {
    participantName?: string
    participantAvatar?: string
    platform?: string
  }
  onBack?: () => void
  onDeleteThread?: () => void
  lastConversationRoute?: string
}

const MobileHeader = ({ conversationData, onBack, onDeleteThread, lastConversationRoute }: MobileHeaderProps) => {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [customMessage, setCustomMessage] = useState('')
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const path = location.pathname
  const isConversationView = ['/', '/instagram', '/youtube'].includes(path)
  const showBack = onBack || (
    typeof window !== 'undefined' &&
    window.history.length > 1 &&
    !isConversationView
  ) || (isConversationView && conversationData)

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
    const active = activePaths.includes(path)
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

  const showThreadActions = isConversationView

  const handleSendCustomMessage = async () => {
    if (!customMessage.trim()) return

    try {
      // Get the currently active thread from conversation data
      if (!conversationData) {
        toast({
          title: 'No conversation selected',
          description: 'Please select a conversation first',
          variant: 'destructive'
        })
        return
      }

      // Find the active thread ID from the current route
      const pathParts = location.pathname.split('/')
      let threadId = null
      
      // Check if we're on a conversation route with a thread ID
      if (pathParts.includes('conversation')) {
        const conversationIndex = pathParts.indexOf('conversation')
        if (conversationIndex < pathParts.length - 1) {
          threadId = pathParts[conversationIndex + 1]
        }
      } else if (pathParts.length > 1 && !isNaN(Number(pathParts[pathParts.length - 1]))) {
        // Fallback: check if the last segment is a number
        threadId = pathParts[pathParts.length - 1]
      }

      if (!threadId || isNaN(Number(threadId))) {
        toast({
          title: 'Invalid conversation',
          description: 'Could not determine active conversation. Please make sure you are viewing a conversation.',
          variant: 'destructive'
        })
        return
      }

      const response = await fetch(`/api/test/generate-for-user/${threadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: customMessage })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      toast({
        title: 'Message sent',
        description: 'Custom message has been generated'
      })

      setCustomMessage('')
      setIsSheetOpen(false)

      // Invalidate queries to refresh the conversation
      queryClient.invalidateQueries({ queryKey: ['/api/threads'] })
      queryClient.invalidateQueries({ queryKey: ['thread-messages', Number(threadId)] })

    } catch (error) {
      console.error('Error sending custom message:', error)
      toast({
        title: 'Error',
        description: 'Failed to send custom message',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteThread = () => {
    if (onDeleteThread) {
      onDeleteThread()
    }
    setIsSheetOpen(false)
  }

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      // If we're on a conversation screen, go back to threads list
      if (isConversationView) {
        navigate('/')
      } else {
        // If we're on any other page, go back to the last conversation route if we have one and conversation data
        // Otherwise go to threads list
        if (conversationData && lastConversationRoute) {
          navigate(lastConversationRoute)
        } else {
          navigate('/')
        }
      }
    }
  }

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-neutral-200 z-10">
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

        {showThreadActions && (
          <div className="mt-4">
            <Separator className="my-3" />
            <div className="px-4">
              <div className="text-xs text-neutral-500 uppercase tracking-wider mb-3">
                Thread Actions
              </div>

              {/* Delete Thread */}
              <button 
                onClick={handleDeleteThread}
                className="flex items-center w-full px-0 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md -mx-2 px-2"
              >
                <Trash2 className="h-4 w-4 mr-3" />
                Delete Thread
              </button>

              {/* Generate Custom Message */}
              <div className="mt-3">
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
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default MobileHeader