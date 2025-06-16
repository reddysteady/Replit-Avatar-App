import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface NotificationSettings {
  email: string;
  notifyOnHighIntent: boolean;
  notifyOnSensitiveTopics: boolean;
  emailDigestFrequency: string;
  inAppNotifications: boolean;
  soundNotifications: boolean;
}

const NotificationSettingsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<NotificationSettings>({
    email: "",
    notifyOnHighIntent: true,
    notifyOnSensitiveTopics: true,
    emailDigestFrequency: "daily",
    inAppNotifications: true,
    soundNotifications: false,
  });

  const { data, isLoading } = useQuery<{notificationSettings: NotificationSettings}>({
    queryKey: ["/api/settings"],
  });

  useEffect(() => {
    if (data?.notificationSettings) {
      setSettings({
        ...data.notificationSettings,
        emailDigestFrequency: data.notificationSettings.emailDigestFrequency || "daily",
        inAppNotifications: data.notificationSettings.inAppNotifications ?? true,
        soundNotifications: data.notificationSettings.soundNotifications ?? false,
      });
    }
  }, [data]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: { notificationSettings: NotificationSettings }) => {
      return apiRequest("POST", "/api/settings", newSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Notification settings updated",
        description: "Your notification preferences have been saved successfully.",
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

  const handleSave = () => {
    updateSettingsMutation.mutate({ notificationSettings: settings });
  };

  if (isLoading) {
    return (
      <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h2 className="text-2xl font-bold mb-6">Notification Settings</h2>
        <div className="animate-pulse">
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
            Notification Settings
          </h2>
          <p className="text-neutral-600 mb-6">
            Configure how and when you receive notifications about messages and activities.
          </p>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>
                  Configure email alerts and digest settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notification-email">Notification Email</Label>
                  <Input
                    id="notification-email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({
                      ...settings,
                      email: e.target.value
                    })}
                    placeholder="Enter your email address"
                  />
                  <p className="text-xs text-neutral-500">
                    Email address where notifications will be sent
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="digest-frequency">Email Digest Frequency</Label>
                  <Select
                    value={settings.emailDigestFrequency}
                    onValueChange={(value) => setSettings({
                      ...settings,
                      emailDigestFrequency: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alert Triggers</CardTitle>
                <CardDescription>
                  Choose what events should trigger notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="high-intent">High-intent messages</Label>
                    <p className="text-sm text-neutral-500">
                      Get notified when AI detects messages with high purchase intent
                    </p>
                  </div>
                  <Switch
                    id="high-intent"
                    checked={settings.notifyOnHighIntent}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      notifyOnHighIntent: checked
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sensitive-topics">Sensitive topics</Label>
                    <p className="text-sm text-neutral-500">
                      Get alerted when sensitive or complex topics are detected
                    </p>
                  </div>
                  <Switch
                    id="sensitive-topics"
                    checked={settings.notifyOnSensitiveTopics}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      notifyOnSensitiveTopics: checked
                    })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>In-App Notifications</CardTitle>
                <CardDescription>
                  Configure notifications within the application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="in-app">Enable in-app notifications</Label>
                  <Switch
                    id="in-app"
                    checked={settings.inAppNotifications}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      inAppNotifications: checked
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sound">Enable sound notifications</Label>
                  <Switch
                    id="sound"
                    checked={settings.soundNotifications}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      soundNotifications: checked
                    })}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleSave}
                  disabled={updateSettingsMutation.isPending}
                >
                  Save Notification Settings
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
};

export default NotificationSettingsPage;