import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { queryClient } from './lib/queryClient'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/components/ui/theme-provider'
import { useIsMobile } from '@/hooks/use-mobile'
import MobileHeader from '@/components/layout/MobileHeader'

import NotFound from '@/pages/not-found'
import Instagram from '@/pages/instagram/Instagram'
import ThreadedMessages from '@/pages/messages/ThreadedMessages'
import ConnectInstagram from '@/pages/connect/ConnectInstagram'
import Settings from '@/pages/settings/Settings'
import Analytics from '@/pages/analytics/Analytics'
import Automation from '@/pages/automation/Automation'
import Testing from '@/pages/testing/Testing'
import Privacy from '@/pages/privacy/Privacy'
import AvatarSettingsPage from '@/pages/settings/AvatarSettingsPage'
import ContentSourcesPage from '@/pages/settings/ContentSourcesPage'
import AISettingsPage from '@/pages/settings/AISettingsPage'
import AutomationPage from '@/pages/settings/AutomationPage'
import NotificationSettings from '@/pages/settings/NotificationSettings'
import APIKeysPage from '@/pages/settings/APIKeysPage'

import Sidebar from '@/components/layout/Sidebar'

function AppLayout() {
  const isMobile = useIsMobile()
  const location = useLocation();
  const [conversationData, setConversationData] = useState(null);

  // Determine if we're on a conversation route and have active conversation
  const isConversationRoute = ['/', '/instagram', '/youtube'].includes(location.pathname)
  const shouldShowConversationData = isConversationRoute && conversationData

  return (
    <div className="h-screen flex overflow-hidden">
      {isMobile && (
        <MobileHeader conversationData={shouldShowConversationData ? conversationData : null} key={location.pathname} />
      )}
      <Sidebar />
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<ThreadedMessages onConversationDataChange={setConversationData} />} />
          <Route path="/instagram" element={<ThreadedMessages onConversationDataChange={setConversationData} />} />
          <Route
            path="/youtube"
            element={<Navigate to="/instagram" replace />}
          />
          <Route path="/connect/instagram" element={<ConnectInstagram />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/sources" element={<ContentSourcesPage />} />
          <Route path="/settings/persona" element={<AvatarSettingsPage />} />
          <Route path="/settings/ai" element={<AISettingsPage />} />
          <Route path="/settings/automation" element={<AutomationPage />} />
          <Route
            path="/settings/notifications"
            element={<NotificationSettings />}
          />
          <Route path="/settings/api" element={<APIKeysPage />} />
          <Route path="/settings/testing-tools" element={<Testing />} />
          <Route path="/settings/privacy" element={<Privacy />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/automation" element={<Automation />} />
          <Route path="/testing" element={<Testing />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router>
            <AppLayout />
          </Router>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App