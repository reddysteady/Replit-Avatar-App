import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Instagram, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function InstagramAuth() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [authState, setAuthState] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  // Get current Instagram settings
  const { data: settings } = useQuery({
    queryKey: ['/api/settings'],
  });
  
  // Check if already connected
  const isConnected = settings?.apiKeys?.instagram && 
                     settings?.apiKeys?.instagramAppId && 
                     settings?.apiKeys?.instagramUserId;
  
  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: any) => {
      return apiRequest("POST", "/api/settings", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      setAuthState('connected');
      toast({
        title: "Success",
        description: "Instagram account connected successfully",
      });
    },
    onError: (error) => {
      setAuthState('disconnected');
      toast({
        title: "Connection failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Setup webhook mutation
  const setupWebhookMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/instagram/setup-webhook", {});
    },
    onSuccess: (data) => {
      toast({
        title: "Webhook configured",
        description: "Instagram notifications set up successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Webhook setup failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle Instagram authentication
  const handleConnectInstagram = () => {
    // Use real Instagram authentication with your App ID
    const instagramAuthUrl = 'https://api.instagram.com/oauth/authorize';
    const instagramAppId = '1709713779604323'; // Your real App ID
    const redirectUri = `${window.location.origin}/api/instagram/callback`;
    
    // Open Instagram OAuth authentication window
    const authWindow = window.open(
      `${instagramAuthUrl}?client_id=${instagramAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user_profile,instagram_graph_user_media,instagram_graph_user_profile&response_type=code`,
      'instagram-auth',
      'width=600,height=700'
    );
    
    setAuthState('connecting');
    
    // The authentication will be completed by the server callback
    // When the user authorizes the app in the popup window, Instagram will
    // redirect to our callback URL, which will handle token exchange
    
    toast({
      title: "Instagram Authentication",
      description: "Please complete the authorization in the popup window.",
    });
  };
  
  // Handle webhook setup
  const handleSetupWebhook = () => {
    setupWebhookMutation.mutate();
  };
  
  // Set up window message listener for the popup authentication window
  useState(() => {
    // Function to handle messages from the auth popup window
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === "INSTAGRAM_AUTH_SUCCESS") {
        // Refresh settings to show the updated connection status
        queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
        setAuthState('connected');
        
        toast({
          title: "Success",
          description: "Instagram account connected successfully",
        });
      }
    };
    
    // Add the event listener
    window.addEventListener("message", handleAuthMessage);
    
    // Clean up the event listener when component unmounts
    return () => {
      window.removeEventListener("message", handleAuthMessage);
    };
  }, []);
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Instagram className="h-6 w-6" />
          <span>Instagram Connection</span>
        </CardTitle>
        <CardDescription>
          Connect your Instagram business account to receive DMs
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Connected</AlertTitle>
            <AlertDescription className="text-green-700">
              Your Instagram account is connected. You can receive messages from Instagram DMs.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Not Connected</AlertTitle>
            <AlertDescription>
              Connect your Instagram business account to receive and respond to DMs automatically.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instagram-token">Access Token</Label>
            <Input 
              id="instagram-token" 
              placeholder="Instagram access token" 
              value={settings?.apiKeys?.instagram || ''} 
              disabled
              type="password"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="instagram-user-id">Instagram User ID</Label>
            <Input 
              id="instagram-user-id" 
              placeholder="Instagram user ID" 
              value={settings?.apiKeys?.instagramUserId || ''} 
              disabled
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button 
          className="w-full" 
          onClick={handleConnectInstagram}
          disabled={authState === 'connecting' || isConnected}
        >
          {isConnected ? 'Already Connected' : (authState === 'connecting' ? 'Connecting...' : 'Connect Instagram')}
        </Button>
        
        <Button 
          className="w-full" 
          variant="outline" 
          onClick={handleSetupWebhook}
          disabled={!isConnected || setupWebhookMutation.isPending}
        >
          {setupWebhookMutation.isPending ? 'Setting up...' : 'Setup Webhook for Notifications'}
        </Button>
      </CardFooter>
    </Card>
  );
}