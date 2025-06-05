import React from "react";
import { CheckCircle, XCircle } from "lucide-react";

interface StatusInfoProps {
  status: "connected" | "disconnected" | "pending" | "error";
  message: string;
}

const StatusInfo: React.FC<StatusInfoProps> = ({ status, message }) => {
  const getStatusColor = () => {
    switch (status) {
      case "connected":
        return "text-green-500";
      case "disconnected":
        return "text-red-500";
      case "pending":
        return "text-amber-500";
      case "error":
        return "text-red-600";
      default:
        return "text-neutral-500";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-5 w-5" />;
      case "disconnected":
      case "error":
        return <XCircle className="h-5 w-5" />;
      case "pending":
        return (
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent" />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center">
      <span className={`mr-2 ${getStatusColor()}`}>
        {getStatusIcon()}
      </span>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

export default StatusInfo;