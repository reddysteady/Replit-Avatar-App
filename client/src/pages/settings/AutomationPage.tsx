import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const AutomationPage = () => {
  return (
    <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none md:pt-0 pt-16">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h2 className="text-2xl font-bold leading-7 text-neutral-900 sm:text-3xl sm:truncate mb-6">
            Automation
          </h2>
          <p className="text-neutral-600 mb-6">
            Set up automated responses and message triggers using our rule builder.
          </p>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Automation Rules
                  <Button>Create New Rule</Button>
                </CardTitle>
                <CardDescription>
                  Configure automatic responses based on message content and triggers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-neutral-500 mb-4">No automation rules configured yet</p>
                  <Button variant="outline">
                    Create Your First Rule
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common automation patterns you can enable
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Welcome Messages</h4>
                    <p className="text-sm text-neutral-500">Auto-reply to first-time message senders</p>
                  </div>
                  <Badge variant="outline">Coming Soon</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Business Hours</h4>
                    <p className="text-sm text-neutral-500">Different responses based on time of day</p>
                  </div>
                  <Badge variant="outline">Coming Soon</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Keyword Triggers</h4>
                    <p className="text-sm text-neutral-500">Auto-respond to specific keywords or phrases</p>
                  </div>
                  <Badge variant="outline">Coming Soon</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AutomationPage;