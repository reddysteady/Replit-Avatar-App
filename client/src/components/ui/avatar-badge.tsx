import { cn } from "@/lib/utils";

type StatusColor = "success" | "warning" | "error";

interface AvatarBadgeProps {
  status: StatusColor;
  text: string;
  className?: string;
}

const AvatarBadge = ({ status, text, className }: AvatarBadgeProps) => {
  const statusColors = {
    success: "bg-success",
    warning: "bg-warning",
    error: "bg-error",
  };

  return (
    <span 
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white",
        statusColors[status],
        className
      )}
    >
      {text}
    </span>
  );
};

export default AvatarBadge;
