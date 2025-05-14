import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/lib/websocket";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { type AssistanceRequest, type NotificationMessage } from "@shared/schema";
import AlertNotification from "@/components/alert-notification";
import StatusCards from "@/components/status-cards";
import RequestTable from "@/components/request-table";
import ActivityFeed from "@/components/activity-feed";
import { useSound } from "@/hooks/use-sound";
import { notificationSoundBase64 } from "@/sounds/notification";

export default function TechnicianDashboard() {
  const queryClient = useQueryClient();
  const socket = useWebSocket();
  const { 
    play: playNotificationSound, 
    stop: stopNotificationSound,
    isMuted, 
    toggleMute 
  } = useSound(notificationSoundBase64);
  
  const [newAlert, setNewAlert] = useState<NotificationMessage | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  
  // Get assistance requests from the API
  const { data: activeRequests = [], isLoading: isLoadingActive } = useQuery<AssistanceRequest[]>({
    queryKey: ['/api/assistance-requests', 'active'],
  });
  
  const { data: resolvedRequests = [], isLoading: isLoadingResolved } = useQuery<AssistanceRequest[]>({
    queryKey: ['/api/assistance-requests', 'resolved'],
  });
  
  const { data: activities = [], isLoading: isLoadingActivities } = useQuery<any[]>({
    queryKey: ['/api/activities'],
  });

  // Setup WebSocket message handling
  useEffect(() => {
    if (!socket) return;
    
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === "notification" && message.status === "waiting") {
          // Show alert for new assistance request
          setNewAlert(message);
          playNotificationSound();
          
          // Refresh the requests data
          queryClient.invalidateQueries({ queryKey: ['/api/assistance-requests'] });
          queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
    
    socket.addEventListener("message", handleMessage);
    
    return () => {
      socket.removeEventListener("message", handleMessage);
    };
  }, [socket, queryClient, playNotificationSound]);
  
  const dismissAlert = () => {
    setNewAlert(null);
    stopNotificationSound();
  };
  
  // Calculate statistics
  const activeCount = activeRequests.length;
  const resolvedToday = resolvedRequests.filter(
    req => new Date(req.resolvedAt!).toDateString() === new Date().toDateString()
  ).length;
  
  const calculateAverageResponse = () => {
    if (resolvedRequests.length === 0) return "N/A";
    
    const responseTimes = resolvedRequests
      .filter(req => req.respondedAt && req.requestedAt)
      .map(req => {
        const requested = new Date(req.requestedAt).getTime();
        const responded = new Date(req.respondedAt!).getTime();
        return (responded - requested) / (1000 * 60); // minutes
      });
    
    if (responseTimes.length === 0) return "N/A";
    
    const avgTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    return avgTime.toFixed(1) + " min";
  };

  return (
    <div className="min-h-screen bg-neutral">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-dark">AV Support Dashboard</h1>
            <p className="text-gray-600">Monitor assistance requests from event rooms</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft size={16} /> Back to Home
              </Button>
            </Link>
            
            <div className="flex items-center">
              <span className="bg-accent text-white px-3 py-1 rounded-full text-sm mr-2">Online</span>
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-600">AV</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Alert Section */}
        {newAlert && (
          <AlertNotification
            alert={newAlert}
            onDismiss={dismissAlert}
            isMuted={isMuted}
            onToggleMute={toggleMute}
          />
        )}
        
        {/* Status Summary */}
        <StatusCards
          activeCount={activeCount}
          resolvedToday={resolvedToday}
          averageResponse={calculateAverageResponse()}
        />
        
        {/* Tabs */}
        <Tabs
          defaultValue="active"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full mt-8"
        >
          <TabsList className="mb-6 border-b border-gray-200 w-full justify-start">
            <TabsTrigger
              value="active"
              className="px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              Active Requests
            </TabsTrigger>
            <TabsTrigger
              value="resolved"
              className="px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              Resolved
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="space-y-8">
            <RequestTable 
              requests={activeRequests} 
              isLoading={isLoadingActive} 
              status="active"
            />
            <ActivityFeed activities={activities} isLoading={isLoadingActivities} />
          </TabsContent>
          
          <TabsContent value="resolved" className="space-y-8">
            <RequestTable 
              requests={resolvedRequests} 
              isLoading={isLoadingResolved} 
              status="resolved"
            />
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-medium mb-4">Notification Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sound Alerts</p>
                    <p className="text-sm text-gray-500">Play sound when new assistance is requested</p>
                  </div>
                  <Button 
                    variant={isMuted ? "outline" : "default"}
                    onClick={toggleMute}
                  >
                    {isMuted ? "Enable Sound" : "Mute Sound"}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
