import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Settings } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AutoRepliesToggleProps {
  source: 'instagram' | 'youtube';
}

const AutoRepliesToggle: React.FC<AutoRepliesToggleProps> = ({ source }) => {
  const [enabled, setEnabled] = useState(false);
  const { toast } = useToast();

  // Fetch current toggle state from settings
  const { data: settings } = useQuery<Settings>({
    queryKey: ['/api/settings'],
  });

  // Set initial toggle state based on settings
  useEffect(() => {
    if (settings) {
      // Check the appropriate toggle state based on source
      if (source === 'instagram') {
        setEnabled(settings.aiAutoRepliesInstagram ?? false);
      } else if (source === 'youtube') {
        setEnabled(settings.aiAutoRepliesYoutube ?? false);
      }
    }
  }, [settings, source]);

  // Mutation to update toggle state
  const { mutate: updateToggle } = useMutation({
    mutationFn: (enabled: boolean) => 
      apiRequest('POST', '/api/settings/ai-auto-replies', { enabled, source }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: `AI auto-replies ${enabled ? 'enabled' : 'disabled'}`,
        description: `Auto-replies for ${source} messages are now ${enabled ? 'on' : 'off'}.`,
      });
    },
    onError: (error) => {
      // Revert toggle state on error
      setEnabled(!enabled);
      toast({
        title: "Failed to update setting",
        description: "An error occurred when updating auto-replies setting.",
        variant: "destructive",
      });
    },
  });

  // Handle toggle change
  const handleToggleChange = (isChecked: boolean) => {
    console.log("Setting toggle state to:", isChecked);
    setEnabled(isChecked);
    updateToggle(isChecked);
  };

  return (
    <div className="flex items-center space-x-3">
      <span className="text-sm font-medium text-black">
        AI Auto-Replies:
      </span>
      <Switch 
        checked={enabled}
        onCheckedChange={handleToggleChange}
      />
    </div>
  );
};

export default AutoRepliesToggle;