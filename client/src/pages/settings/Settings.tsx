import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface SettingsData {
  apiKeys: {
    instagram: string;
    instagramAppId: string;
    instagramAppSecret: string;
    instagramUserId: string;
    instagramPageId: string;
    instagramWebhookUrl: string;
    youtube: string;
    openai: string;
    airtable: string;
    airtableBaseId: string;
    airtableTableName: string;
  };
  aiSettings: {
    temperature: number;
    creatorToneDescription: string;
    maxResponseLength: number;
    model: string;
    autoReplyInstagram: boolean;
    autoReplyYoutube: boolean;
  };
  notificationSettings: {
    email: string;
    notifyOnHighIntent: boolean;
    notifyOnSensitiveTopics: boolean;
  };
}

const Settings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SettingsData>({
    apiKeys: {
      instagram: "",
      instagramAppId: "",
      instagramAppSecret: "",
      instagramUserId: "",
      instagramPageId: "",
      instagramWebhookUrl: "",
      youtube: "",
      openai: "",
      airtable: "",
      airtableBaseId: "",
      airtableTableName: "Leads",
    },
    aiSettings: {
      temperature: 0.7,
      creatorToneDescription: "",
      maxResponseLength: 500,
      model: "gpt-4o",
      autoReplyInstagram: false,
      autoReplyYoutube: false,
    },
    notificationSettings: {
      email: "",
      notifyOnHighIntent: true,
      notifyOnSensitiveTopics: true,
    },
  });

  const { data, isLoading } = useQuery<SettingsData>({
    queryKey: ["/api/settings"],
  });

  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<SettingsData>) => {
      return apiRequest("POST", "/api/settings", newSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings updated",
        description: "Your settings have been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveApiKeys = () => {
    updateSettingsMutation.mutate({ apiKeys: settings.apiKeys });
  };

  const handleSaveAiSettings = () => {
    updateSettingsMutation.mutate({ aiSettings: settings.aiSettings });
  };

  const handleSaveNotificationSettings = () => {
    updateSettingsMutation.mutate({ notificationSettings: settings.notificationSettings });
  };

  if (isLoading) {
    return (
      <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h2 className="text-2xl font-bold mb-6">Settings</h2>
        <div className="animate-pulse">
          <div className="h-12 bg-neutral-200 rounded mb-6"></div>
          <div className="h-64 bg-neutral-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none md:pt-0 pt-16">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h2 className="text-2xl font-bold leading-7 text-neutral-900 sm:text-3xl sm:truncate mb-6">
            Settings
          </h2>

          <Tabs defaultValue="api-keys">
            <TabsList className="mb-4">
              <TabsTrigger value="api-keys">API Keys</TabsTrigger>
              <TabsTrigger value="ai-settings">AI Settings</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="api-keys">
              <Card>
                <CardHeader>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>
                    Enter your API keys to connect to external services.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="pb-4 border-b border-neutral-200">
                    <h3 className="text-lg font-medium mb-3">Instagram Integration</h3>
                    <div className="space-y-2">
                      <Label htmlFor="instagram-key">Instagram Access Token</Label>
                      <Input
                        id="instagram-key"
                        type="password"
                        value={settings.apiKeys.instagram}
                        onChange={(e) => setSettings({
                          ...settings,
                          apiKeys: { ...settings.apiKeys, instagram: e.target.value }
                        })}
                        placeholder="Enter your Instagram access token"
                      />
                      <p className="text-xs text-neutral-500">Long-lived access token from Facebook Developer Console</p>
                    </div>
                    <div className="space-y-2 mt-3">
                      <Label htmlFor="instagram-app-id">App ID</Label>
                      <Input
                        id="instagram-app-id"
                        value={settings.apiKeys.instagramAppId}
                        onChange={(e) => setSettings({
                          ...settings,
                          apiKeys: { ...settings.apiKeys, instagramAppId: e.target.value }
                        })}
                        placeholder="Enter your Facebook App ID"
                      />
                    </div>
                    <div className="space-y-2 mt-3">
                      <Label htmlFor="instagram-app-secret">App Secret</Label>
                      <Input
                        id="instagram-app-secret"
                        type="password"
                        value={settings.apiKeys.instagramAppSecret}
                        onChange={(e) => setSettings({
                          ...settings,
                          apiKeys: { ...settings.apiKeys, instagramAppSecret: e.target.value }
                        })}
                        placeholder="Enter your Facebook App Secret"
                      />
                    </div>
                    <div className="space-y-2 mt-3">
                      <Label htmlFor="instagram-user-id">Instagram Business Account ID</Label>
                      <Input
                        id="instagram-user-id"
                        value={settings.apiKeys.instagramUserId}
                        onChange={(e) => setSettings({
                          ...settings,
                          apiKeys: { ...settings.apiKeys, instagramUserId: e.target.value }
                        })}
                        placeholder="Enter your Instagram Business Account ID"
                      />
                    </div>
                    <div className="space-y-2 mt-3">
                      <Label htmlFor="instagram-page-id">Facebook Page ID</Label>
                      <Input
                        id="instagram-page-id"
                        value={settings.apiKeys.instagramPageId}
                        onChange={(e) => setSettings({
                          ...settings,
                          apiKeys: { ...settings.apiKeys, instagramPageId: e.target.value }
                        })}
                        placeholder="Enter your connected Facebook Page ID"
                      />
                    </div>
                    <div className="space-y-2 mt-3">
                      <Label htmlFor="instagram-webhook">Webhook URL</Label>
                      <Input
                        id="instagram-webhook"
                        value={settings.apiKeys.instagramWebhookUrl}
                        onChange={(e) => setSettings({
                          ...settings,
                          apiKeys: { ...settings.apiKeys, instagramWebhookUrl: e.target.value }
                        })}
                        placeholder="Your app's webhook URL for Instagram"
                      />
                      <p className="text-xs text-neutral-500">The URL that will receive webhook events from Instagram</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 pb-4 border-b border-neutral-200">
                    <h3 className="text-lg font-medium mb-3">YouTube Integration</h3>
                    <div className="space-y-2">
                      <Label htmlFor="youtube-key">YouTube Data API Key</Label>
                      <Input
                        id="youtube-key"
                        type="password"
                        value={settings.apiKeys.youtube}
                        onChange={(e) => setSettings({
                          ...settings,
                          apiKeys: { ...settings.apiKeys, youtube: e.target.value }
                        })}
                        placeholder="Enter your YouTube Data API key"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4 pb-4 border-b border-neutral-200">
                    <h3 className="text-lg font-medium mb-3">OpenAI</h3>
                    <div className="space-y-2">
                      <Label htmlFor="openai-key">OpenAI API Key</Label>
                      <Input
                        id="openai-key"
                        type="password"
                        value={settings.apiKeys.openai}
                        onChange={(e) => setSettings({
                          ...settings,
                          apiKeys: { ...settings.apiKeys, openai: e.target.value }
                        })}
                        placeholder="Enter your OpenAI API key"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <h3 className="text-lg font-medium mb-3">Airtable Integration</h3>
                    <div className="space-y-2">
                      <Label htmlFor="airtable-key">Airtable API Key</Label>
                      <Input
                        id="airtable-key"
                        type="password"
                        value={settings.apiKeys.airtable}
                        onChange={(e) => setSettings({
                          ...settings,
                          apiKeys: { ...settings.apiKeys, airtable: e.target.value }
                        })}
                        placeholder="Enter your Airtable API key"
                      />
                    </div>
                    <div className="space-y-2 mt-3">
                      <Label htmlFor="airtable-base">Airtable Base ID</Label>
                      <Input
                        id="airtable-base"
                        value={settings.apiKeys.airtableBaseId}
                        onChange={(e) => setSettings({
                          ...settings,
                          apiKeys: { ...settings.apiKeys, airtableBaseId: e.target.value }
                        })}
                        placeholder="Enter your Airtable Base ID"
                      />
                    </div>
                    <div className="space-y-2 mt-3">
                      <Label htmlFor="airtable-table">Airtable Table Name</Label>
                      <Input
                        id="airtable-table"
                        value={settings.apiKeys.airtableTableName}
                        onChange={(e) => setSettings({
                          ...settings,
                          apiKeys: { ...settings.apiKeys, airtableTableName: e.target.value }
                        })}
                        placeholder="Enter your Airtable Table Name"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleSaveApiKeys}
                    disabled={updateSettingsMutation.isPending}
                  >
                    Save API Keys
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="ai-settings">
              <Card>
                <CardHeader>
                  <CardTitle>AI Response Settings</CardTitle>
                  <CardDescription>
                    Configure how the AI generates responses on your behalf.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="pb-4 border-b border-neutral-200">
                    <h3 className="text-lg font-medium mb-3">Automatic Replies</h3>
                    <div className="flex items-center justify-between py-2">
                      <Label htmlFor="auto-reply-instagram">Enable AI auto-replies for Instagram DMs</Label>
                      <Switch
                        id="auto-reply-instagram"
                        checked={settings.aiSettings.autoReplyInstagram}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          aiSettings: { ...settings.aiSettings, autoReplyInstagram: checked }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <Label htmlFor="auto-reply-youtube">Enable AI auto-replies for YouTube comments</Label>
                      <Switch
                        id="auto-reply-youtube"
                        checked={settings.aiSettings.autoReplyYoutube}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          aiSettings: { ...settings.aiSettings, autoReplyYoutube: checked }
                        })}
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4 space-y-4">
                    <h3 className="text-lg font-medium mb-2">Response Generation</h3>
                    <div className="space-y-2">
                      <Label htmlFor="ai-model">AI Model</Label>
                      <Select
                        value={settings.aiSettings.model}
                        onValueChange={(value) => setSettings({
                          ...settings,
                          aiSettings: { ...settings.aiSettings, model: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select AI model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4o">GPT-4o (Recommended)</SelectItem>
                          <SelectItem value="gpt-4">GPT-4</SelectItem>
                          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="temperature">Response Creativity</Label>
                        <span className="text-sm text-neutral-500">{settings.aiSettings.temperature.toFixed(1)}</span>
                      </div>
                      <Slider
                        id="temperature"
                        min={0}
                        max={1}
                        step={0.1}
                        value={[settings.aiSettings.temperature]}
                        onValueChange={(value) => setSettings({
                          ...settings,
                          aiSettings: { ...settings.aiSettings, temperature: value[0] }
                        })}
                      />
                      <div className="flex justify-between text-xs text-neutral-500">
                        <span>Precise</span>
                        <span>Creative</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tone-description">Your Communication Style</Label>
                      <Textarea
                        id="tone-description"
                        value={settings.aiSettings.creatorToneDescription}
                        onChange={(e) => setSettings({
                          ...settings,
                          aiSettings: { ...settings.aiSettings, creatorToneDescription: e.target.value }
                        })}
                        placeholder="Describe your tone and communication style (e.g., friendly and casual, professional but approachable, etc.)"
                        rows={4}
                      />
                      <p className="text-xs text-neutral-500">The AI will use this description to match your unique communication style when responding to messages.</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="max-length">Maximum Response Length</Label>
                        <span className="text-sm text-neutral-500">{settings.aiSettings.maxResponseLength} chars</span>
                      </div>
                      <Slider
                        id="max-length"
                        min={100}
                        max={1000}
                        step={50}
                        value={[settings.aiSettings.maxResponseLength]}
                        onValueChange={(value) => setSettings({
                          ...settings,
                          aiSettings: { ...settings.aiSettings, maxResponseLength: value[0] }
                        })}
                      />
                      <div className="flex justify-between text-xs text-neutral-500">
                        <span>Brief</span>
                        <span>Detailed</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleSaveAiSettings}
                    disabled={updateSettingsMutation.isPending}
                  >
                    Save AI Settings
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>
                    Configure when and how you want to be notified.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notification-email">Email for Notifications</Label>
                    <Input
                      id="notification-email"
                      type="email"
                      value={settings.notificationSettings.email}
                      onChange={(e) => setSettings({
                        ...settings,
                        notificationSettings: { ...settings.notificationSettings, email: e.target.value }
                      })}
                      placeholder="Enter your email address"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notify-high-intent">Notify for high-intent leads</Label>
                    <Switch
                      id="notify-high-intent"
                      checked={settings.notificationSettings.notifyOnHighIntent}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        notificationSettings: { ...settings.notificationSettings, notifyOnHighIntent: checked }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notify-sensitive">Notify for sensitive topics</Label>
                    <Switch
                      id="notify-sensitive"
                      checked={settings.notificationSettings.notifyOnSensitiveTopics}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        notificationSettings: { ...settings.notificationSettings, notifyOnSensitiveTopics: checked }
                      })}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleSaveNotificationSettings}
                    disabled={updateSettingsMutation.isPending}
                  >
                    Save Notification Settings
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
};

export default Settings;
