import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const Testing = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { refetch: refetchInstagramMessages } = useQuery({
    queryKey: ['/api/instagram/messages'],
    enabled: false,
  });
  
  return (
    <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none md:pt-0 pt-16">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-neutral-900 sm:text-3xl sm:truncate">
                Testing Tools
              </h2>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-neutral-900">
                Refresh Options
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-neutral-500">
                Tools for refreshing data at different levels
              </p>
            </div>
            <div className="border-t border-neutral-200 px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="border border-neutral-200 rounded-lg p-4">
                  <h4 className="text-md font-medium mb-2">Database Refresh</h4>
                  <p className="text-sm text-neutral-500 mb-4">
                    Refresh data directly from the database without calling external APIs
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      toast({
                        title: "Refreshing Database",
                        description: "Refreshing messages from database..."
                      });
                      
                      // Refetch Instagram messages
                      refetchInstagramMessages();
                    }}
                    className="flex items-center w-full justify-center"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reload - database
                  </Button>
                </div>
                
                <div className="border border-neutral-200 rounded-lg p-4">
                  <h4 className="text-md font-medium mb-2">Frontend Cache Refresh</h4>
                  <p className="text-sm text-neutral-500 mb-4">
                    Clear the frontend cache and refresh data without calling APIs
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      toast({
                        title: "Refreshing Cache",
                        description: "Clearing frontend cache and refreshing data..."
                      });
                      
                      // Invalidate and refetch all queries
                      queryClient.invalidateQueries();
                    }}
                    className="flex items-center w-full justify-center"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reload - frontend cache
                  </Button>
                </div>
                
                <div className="border border-neutral-200 rounded-lg p-4">
                  <h4 className="text-md font-medium mb-2">Webhook Testing</h4>
                  <p className="text-sm text-neutral-500 mb-4">
                    Configure and test Instagram webhook for real-time updates
                  </p>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const setupWebhook = async () => {
                        try {
                          const response = await fetch('/api/instagram/setup-webhook', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' }
                          });
                          const data = await response.json();
                          
                          if (response.ok) {
                            toast({
                              title: "Webhook Setup",
                              description: "Instagram webhook successfully configured",
                            });
                          } else {
                            toast({
                              title: "Webhook Setup Failed",
                              description: data.message || "Failed to set up Instagram webhook",
                              variant: "destructive",
                            });
                          }
                        } catch (error) {
                          toast({
                            title: "Webhook Setup Error",
                            description: "An error occurred while setting up webhook",
                            variant: "destructive",
                          });
                        }
                      };
                      
                      setupWebhook();
                    }}
                    className="flex items-center w-full justify-center"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Setup Webhook
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Testing;