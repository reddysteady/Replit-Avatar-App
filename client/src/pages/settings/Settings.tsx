
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Settings as SettingsIcon, 
  Bot, 
  MessageSquare, 
  Shield, 
  Bell, 
  Key, 
  TestTube, 
  UserCog,
  Database,
  Zap
} from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();

  const settingsItems = [
    {
      title: 'AI Settings',
      description: 'Configure AI behavior and responses',
      icon: Bot,
      path: '/settings/ai',
      color: 'text-blue-600'
    },
    {
      title: 'Persona Configuration',
      description: 'Set up your avatar personality and traits',
      icon: UserCog,
      path: '/settings/persona',
      color: 'text-purple-600'
    },
    {
      title: 'Chat Logs',
      description: 'Review AI conversation logs for improvements',
      icon: MessageSquare,
      path: '/settings/chat-logs',
      color: 'text-green-600'
    },
    {
      title: 'Content Sources',
      description: 'Manage your content and data sources',
      icon: Database,
      path: '/settings/sources',
      color: 'text-orange-600'
    },
    {
      title: 'Automation',
      description: 'Configure automated responses and workflows',
      icon: Zap,
      path: '/settings/automation',
      color: 'text-yellow-600'
    },
    {
      title: 'API Keys',
      description: 'Manage your API keys and integrations',
      icon: Key,
      path: '/settings/api',
      color: 'text-red-600'
    },
    {
      title: 'Notifications',
      description: 'Configure notification preferences',
      icon: Bell,
      path: '/settings/notifications',
      color: 'text-indigo-600'
    },
    {
      title: 'Testing Tools',
      description: 'Access development and testing utilities',
      icon: TestTube,
      path: '/settings/testing-tools',
      color: 'text-cyan-600'
    },
    {
      title: 'Privacy & Security',
      description: 'Data handling and security settings',
      icon: Shield,
      path: '/settings/privacy',
      color: 'text-gray-600'
    }
  ];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="h-8 w-8 text-gray-700" />
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        </div>
        <p className="text-gray-600">
          Manage your account preferences and configure your AI assistant
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingsItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Card 
              key={item.path}
              className="hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => navigate(item.path)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <IconComponent className={`h-5 w-5 ${item.color} group-hover:scale-110 transition-transform`} />
                  <CardTitle className="text-lg font-semibold group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Settings;
