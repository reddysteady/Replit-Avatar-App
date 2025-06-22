
import { useLocation } from "react-router-dom";
import { Settings as SettingsIcon, Shield, MessageSquare, Database, Bell, Key, Globe, Wrench } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const NavItem = ({ to, icon: Icon, label, description }: { 
  to: string; 
  icon: React.ComponentType<any>; 
  label: string; 
  description: string; 
}) => (
  <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center text-sm font-medium">
        <Icon className="mr-3 h-5 w-5 text-neutral-500" />
        <a href={to} className="text-neutral-900 hover:text-blue-600">
          {label}
        </a>
      </CardTitle>
      <CardDescription className="text-xs text-neutral-600">
        {description}
      </CardDescription>
    </CardHeader>
  </Card>
);

const Settings = () => {
  const location = useLocation();
  
  // Only show the main settings page if we're exactly at /settings
  if (location.pathname !== '/settings') {
    return null;
  }

  return (
    <main className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Settings</h1>
          <p className="text-neutral-600">Manage your account and application preferences</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <NavItem
            to="/settings/sources"
            icon={Globe}
            label="Content Sources"
            description="OAuth integration and sync settings"
          />
          <NavItem
            to="/settings/persona"
            icon={SettingsIcon}
            label="Persona"
            description="Voice, boundaries, and conversation style"
          />
          <NavItem
            to="/settings/ai"
            icon={Shield}
            label="AI Settings"
            description="Model preferences and automation"
          />
          <NavItem
            to="/settings/automation"
            icon={Wrench}
            label="Automation"
            description="Message triggers and auto-responses"
          />
          <NavItem
            to="/settings/notifications"
            icon={Bell}
            label="Notifications"
            description="Email alerts and digest frequency"
          />
          <NavItem
            to="/settings/api"
            icon={Key}
            label="API Keys"
            description="Token management for connected services"
          />
          <NavItem
            to="/settings/chat-logs"
            icon={MessageSquare}
            label="Chat Logs"
            description="Review AI conversation logs for improvements"
          />
          <NavItem
            to="/settings/testing-tools"
            icon={Database}
            label="Testing Tools"
            description="Developer utilities and debugging tools"
          />
        </div>
      </div>
    </main>
  );
};

export default Settings;
