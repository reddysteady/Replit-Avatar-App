import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface APIKeys {
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
}

const APIKeysPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [apiKeys, setApiKeys] = useState<APIKeys>({
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
  });

  const { data, isLoading } = useQuery<{apiKeys: APIKeys}>({
    queryKey: ["/api/settings"],
  });

  useEffect(() => {
    if (data?.apiKeys) {
      setApiKeys(data.apiKeys);
    }
  }, [data]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: { apiKeys: APIKeys }) => {
      return apiRequest("POST", "/api/settings", newSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "API keys updated",
        description: "Your API keys have been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update API keys",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateSettingsMutation.mutate({ apiKeys });
  };

  if (isLoading) {
    return (
      <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h2 className="text-2xl font-bold mb-6">API Keys</h2>
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
            API Keys
          </h2>
          <p className="text-neutral-600 mb-6">
            Manage API keys and tokens for external service integrations.
          </p>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Instagram Integration</CardTitle>
                <CardDescription>
                  Configure Instagram Basic Display API and webhook settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="instagram-token">Instagram Access Token</Label>
                  <Input
                    id="instagram-token"
                    type="password"
                    value={apiKeys.instagram}
                    onChange={(e) => setApiKeys({
                      ...apiKeys,
                      instagram: e.target.value
                    })}
                    placeholder="Enter your Instagram access token"
                  />
                  <p className="text-xs text-neutral-500">Long-lived access token from Facebook Developer Console</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instagram-app-id">App ID</Label>
                    <Input
                      id="instagram-app-id"
                      value={apiKeys.instagramAppId}
                      onChange={(e) => setApiKeys({
                        ...apiKeys,
                        instagramAppId: e.target.value
                      })}
                      placeholder="Facebook App ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram-app-secret">App Secret</Label>
                    <Input
                      id="instagram-app-secret"
                      type="password"
                      value={apiKeys.instagramAppSecret}
                      onChange={(e) => setApiKeys({
                        ...apiKeys,
                        instagramAppSecret: e.target.value
                      })}
                      placeholder="Facebook App Secret"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instagram-user-id">Business Account ID</Label>
                    <Input
                      id="instagram-user-id"
                      value={apiKeys.instagramUserId}
                      onChange={(e) => setApiKeys({
                        ...apiKeys,
                        instagramUserId: e.target.value
                      })}
                      placeholder="Instagram Business Account ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram-page-id">Facebook Page ID</Label>
                    <Input
                      id="instagram-page-id"
                      value={apiKeys.instagramPageId}
                      onChange={(e) => setApiKeys({
                        ...apiKeys,
                        instagramPageId: e.target.value
                      })}
                      placeholder="Connected Facebook Page ID"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram-webhook">Webhook URL</Label>
                  <Input
                    id="instagram-webhook"
                    value={apiKeys.instagramWebhookUrl}
                    onChange={(e) => setApiKeys({
                      ...apiKeys,
                      instagramWebhookUrl: e.target.value
                    })}
                    placeholder="Your app's webhook URL for Instagram"
                  />
                  <p className="text-xs text-neutral-500">The URL that will receive webhook events from Instagram</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>OpenAI Configuration</CardTitle>
                <CardDescription>
                  API key for AI-powered response generation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="openai-key">OpenAI API Key</Label>
                  <Input
                    id="openai-key"
                    type="password"
                    value={apiKeys.openai}
                    onChange={(e) => setApiKeys({
                      ...apiKeys,
                      openai: e.target.value
                    })}
                    placeholder="sk-..."
                  />
                  <p className="text-xs text-neutral-500">
                    Get your API key from{" "}
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      OpenAI Platform
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>YouTube Integration</CardTitle>
                <CardDescription>
                  YouTube Data API for comment management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="youtube-key">YouTube Data API Key</Label>
                  <Input
                    id="youtube-key"
                    type="password"
                    value={apiKeys.youtube}
                    onChange={(e) => setApiKeys({
                      ...apiKeys,
                      youtube: e.target.value
                    })}
                    placeholder="Enter your YouTube Data API key"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Airtable Integration</CardTitle>
                <CardDescription>
                  Configure Airtable for lead and data management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="airtable-key">Airtable API Key</Label>
                  <Input
                    id="airtable-key"
                    type="password"
                    value={apiKeys.airtable}
                    onChange={(e) => setApiKeys({
                      ...apiKeys,
                      airtable: e.target.value
                    })}
                    placeholder="Enter your Airtable API key"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="airtable-base">Base ID</Label>
                    <Input
                      id="airtable-base"
                      value={apiKeys.airtableBaseId}
                      onChange={(e) => setApiKeys({
                        ...apiKeys,
                        airtableBaseId: e.target.value
                      })}
                      placeholder="Airtable Base ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="airtable-table">Table Name</Label>
                    <Input
                      id="airtable-table"
                      value={apiKeys.airtableTableName}
                      onChange={(e) => setApiKeys({
                        ...apiKeys,
                        airtableTableName: e.target.value
                      })}
                      placeholder="Table Name"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleSave}
                  disabled={updateSettingsMutation.isPending}
                >
                  Save API Keys
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
};

export default APIKeysPage;