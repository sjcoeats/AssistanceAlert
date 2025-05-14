import { Button } from "@/components/ui/button";
import { AlertCircle, Volume2, VolumeX, X } from "lucide-react";
import { type NotificationMessage } from "@shared/schema";
import { cn } from "@/lib/utils";

interface AlertNotificationProps {
  alert: NotificationMessage;
  onDismiss: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export default function AlertNotification({ 
  alert, 
  onDismiss, 
  isMuted, 
  onToggleMute 
}: AlertNotificationProps) {
  return (
    <div 
      className={cn(
        "mb-6 p-4 bg-secondary text-white rounded-lg animate-pulse",
        "transition-opacity duration-500 ease-in-out"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <AlertCircle className="mr-2 h-6 w-6" />
          <div>
            <h3 className="font-bold text-lg">New Assistance Request!</h3>
            <p>{alert.roomName} needs help</p>
            <p className="text-sm text-white/80">{alert.roomLocation}</p>
          </div>
        </div>
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            onClick={onToggleMute} 
            className="mr-2 p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30"
          >
            {isMuted ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </Button>
          <Button 
            variant="ghost" 
            onClick={onDismiss} 
            className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
