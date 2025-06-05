import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { InstagramAuth } from "@/components/InstagramAuth";
import { Link } from "wouter";

const ConnectInstagram = () => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  
  // Fetch settings to check connection status
  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (settings) {
      // Check if Instagram credentials exist
      const hasInstagramToken = settings.apiKeys?.instagram;
      setIsConnected(!!hasInstagramToken);
    }
  }, [settings]);

  return (
    <main className="flex-1 overflow-y-auto focus:outline-none">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-neutral-900">Connect Instagram</h1>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <InstagramAuth />
              
              {isConnected && (
                <div className="mt-6 p-4 bg-green-50 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Instagram Connected</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>Your Instagram account is now connected to Avatar. You can view and manage your Instagram DMs in the Messages section.</p>
                      </div>
                      <div className="mt-4">
                        <div className="-mx-2 -my-1.5 flex">
                          <Link href="/instagram">
                            <a className="bg-green-100 px-2 py-1.5 rounded-md text-sm font-medium text-green-800 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                              Go to Messages
                            </a>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ConnectInstagram;