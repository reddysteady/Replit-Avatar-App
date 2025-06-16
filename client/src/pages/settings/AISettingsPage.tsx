import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface AISettings {
  temperature: number;
  maxResponseLength: number;
  model: string;
  autoReplyInstagram: boolean;
  autoReplyYoutube: boolean;
  flexProcessing: boolean;
  responseDelay: number;
}

const AISettingsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [aiSettings, setAiSettings] = useState<AISettings>({
    temperature: 0.7,
    maxResponseLength: 500,
    model: "gpt-4o",
    autoReplyInstagram: false,
    autoReplyYoutube: false,
    flexProcessing: false,
    responseDelay: 0,
  });

  const { data, isLoading } = useQuery<{aiSettings: AISettings}>({
    queryKey: ["/api/settings"],
  });

  useEffect(() => {
    if (data?.aiSettings) {
      setAiSettings(data.aiSettings);
    }
  }, [data]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: { aiSettings: AISettings }) => {
      return apiRequest("POST", "/api/settings", newSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "AI settings updated",
        description: "Your AI response settings have been saved successfully.",
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
    updateSettingsMutation.mutate({ aiSettings });
  };

  if (isLoading) {
    return (
      <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h2 className="text-2xl font-bold mb-6">AI Settings</h2>
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
            AI Settings
          </h2>
          <p className="text-neutral-600 mb-6">
            Configure AI model settings and response behavior.
          </p>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Model Configuration</CardTitle>
                <CardDescription>
                  Choose the AI model and adjust response parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="ai-model">AI Model</Label>
                  <Select
                    value={aiSettings.model}
                    onValueChange={(value) => setAiSettings({
                      ...aiSettings,
                      model: value
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
                  <Label htmlFor="temperature">
                    Creativity Level: {aiSettings.temperature}
                  </Label>
                  <Slider
                    id="temperature"
                    min={0}
                    max={1}
                    step={0.1}
                    value={[aiSettings.temperature]}
                    onValueChange={(value) => setAiSettings({
                      ...aiSettings,
                      temperature: value[0]
                    })}
                    className="w-full"
                  />
                  <p className="text-xs text-neutral-500">
                    Lower values = more focused, Higher values = more creative
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-length">
                    Max Response Length: {aiSettings.maxResponseLength} characters
                  </Label>
                  <Slider
                    id="max-length"
                    min={100}
                    max={1000}
                    step={50}
                    value={[aiSettings.maxResponseLength]}
                    onValueChange={(value) => setAiSettings({
                      ...aiSettings,
                      maxResponseLength: value[0]
                    })}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="response-delay">
                    Response Delay: {aiSettings.responseDelay} seconds
                  </Label>
                  <Slider
                    id="response-delay"
                    min={0}
                    max={60}
                    step={5}
                    value={[aiSettings.responseDelay]}
                    onValueChange={(value) => setAiSettings({
                      ...aiSettings,
                      responseDelay: value[0]
                    })}
                    className="w-full"
                  />
                  <p className="text-xs text-neutral-500">
                    Add delay before sending AI responses to appear more natural
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Automation Settings</CardTitle>
                <CardDescription>
                  Configure automatic reply behavior
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-reply-instagram">Enable auto-replies for Instagram</Label>
                  <Switch
                    id="auto-reply-instagram"
                    checked={aiSettings.autoReplyInstagram}
                    onCheckedChange={(checked) => setAiSettings({
                      ...aiSettings,
                      autoReplyInstagram: checked
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-reply-youtube">Enable auto-replies for YouTube</Label>
                  <Switch
                    id="auto-reply-youtube"
                    checked={aiSettings.autoReplyYoutube}
                    onCheckedChange={(checked) => setAiSettings({
                      ...aiSettings,
                      autoReplyYoutube: checked
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="flex-processing">Enable flexible processing</Label>
                  <Switch
                    id="flex-processing"
                    checked={aiSettings.flexProcessing}
                    onCheckedChange={(checked) => setAiSettings({
                      ...aiSettings,
                      flexProcessing: checked
                    })}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleSave}
                  disabled={updateSettingsMutation.isPending}
                >
                  Save AI Settings
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AISettingsPage;