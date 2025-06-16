import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const ContentSourcesPage = () => {
  return (
    <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none md:pt-0 pt-16">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h2 className="text-2xl font-bold leading-7 text-neutral-900 sm:text-3xl sm:truncate mb-6">
            Content Sources
          </h2>
          <p className="text-neutral-600 mb-6">
            Manage your connected social platforms and content ingestion settings.
          </p>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Instagram Integration
                  <Badge variant="secondary">Connected</Badge>
                </CardTitle>
                <CardDescription>
                  Sync Instagram DMs and manage automated responses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="instagram-sync">Enable Instagram message sync</Label>
                  <Switch id="instagram-sync" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="instagram-auto">Auto-reply to Instagram DMs</Label>
                  <Switch id="instagram-auto" />
                </div>
                <div className="pt-4">
                  <Button variant="outline">Reconnect Instagram</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  YouTube Integration
                  <Badge variant="outline">Not Connected</Badge>
                </CardTitle>
                <CardDescription>
                  Connect YouTube to manage comments and responses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button>Connect YouTube</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sync Settings</CardTitle>
                <CardDescription>
                  Configure how often to check for new messages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-neutral-500">Last Instagram sync</Label>
                    <p className="font-medium">2 minutes ago</p>
                  </div>
                  <div>
                    <Label className="text-neutral-500">Last YouTube sync</Label>
                    <p className="font-medium">Never</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Sync Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ContentSourcesPage;