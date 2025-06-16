// See CHANGELOG.md for 2025-06-12 [Changed - remove MobileHeader]
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'
import { queryClient } from './lib/queryClient'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/components/ui/theme-provider'

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

import Sidebar from '@/components/layout/Sidebar'

function AppLayout() {
  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar />
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<ThreadedMessages />} />
          <Route path="/instagram" element={<ThreadedMessages />} />
          <Route
            path="/youtube"
            element={<Navigate to="/instagram" replace />}
          />
          <Route path="/connect/instagram" element={<ConnectInstagram />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/persona" element={<AvatarSettingsPage />} />
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
