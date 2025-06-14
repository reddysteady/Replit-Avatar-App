// See CHANGELOG.md for 2025-06-12 [Changed - remove MobileHeader]
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";

import NotFound from "@/pages/not-found";
import Instagram from "@/pages/instagram/Instagram";
import ThreadedMessages from "@/pages/messages/ThreadedMessages";
import ConnectInstagram from "@/pages/connect/ConnectInstagram";
import Settings from "@/pages/settings/Settings";
import Analytics from "@/pages/analytics/Analytics";
import Automation from "@/pages/automation/Automation";
import Testing from "@/pages/testing/Testing";
import Privacy from "@/pages/privacy/Privacy";

import Sidebar from "@/components/layout/Sidebar";

function Router() {
  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar />
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <Switch>
          <Route path="/" component={ThreadedMessages} />
          <Route path="/instagram" component={ThreadedMessages} />
          <Route path="/youtube">
            <Redirect to="/instagram" />
          </Route>
          <Route path="/connect/instagram" component={ConnectInstagram} />
          <Route path="/settings" component={Settings} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/automation" component={Automation} />
          <Route path="/testing" component={Testing} />
          <Route path="/privacy" component={Privacy} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
