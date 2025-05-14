import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket, sendWebSocketMessage } from "@/lib/websocket";
import { useParams, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { type Room } from "@shared/schema";

// Icons
import { 
  Monitor, Volume2, Lightbulb, Thermometer, 
  Headset, CheckCircle, ArrowLeft, AlertCircle
} from "lucide-react";
import { Link } from "wouter";

export default function TouchScreen() {
  const { roomId } = useParams();
  const [, setLocation] = useLocation();
  const id = parseInt(roomId || "1");
  const { toast } = useToast();
  const socket = useWebSocket();
  const [requestSent, setRequestSent] = useState(false);
  
  // Fetch rooms from API
  const { data: rooms = [], isLoading: isLoadingRooms } = useQuery<Room[]>({
    queryKey: ['/api/rooms'],
  });
  
  // Find current room
  const room = rooms.find(r => r.id === id) || (rooms.length > 0 ? rooms[0] : null);

  const handleRequestAssistance = async () => {
    if (!room) return;
    
    try {
      // Send to the API
      await apiRequest("POST", "/api/assistance-requests", {
        roomId: room.id,
        roomName: room.name,
        roomLocation: room.location,
        status: "waiting"
      });
      
      // Send via WebSocket for real-time notification
      sendWebSocketMessage(socket, {
        type: "requestAssistance",
        roomId: room.id,
        roomName: room.name,
        roomLocation: room.location
      });
      
      // Show success feedback
      setRequestSent(true);
      toast({
        title: "Help is on the way!",
        description: "The AV team has been notified of your request.",
        variant: "default",
      });
      
      // Reset after 5 seconds
      setTimeout(() => {
        setRequestSent(false);
      }, 5000);
    } catch (error) {
      console.error("Error requesting assistance:", error);
      toast({
        title: "Request Failed",
        description: "Unable to request assistance. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle room change
  const changeRoom = (roomId: number) => {
    setLocation(`/touch-screen/${roomId}`);
  };

  // Show loading state while fetching rooms
  if (isLoadingRooms) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center border-b pb-4">
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-6 w-32 mx-auto" />
            <Skeleton className="h-4 w-24 mx-auto mt-2" />
          </CardHeader>
          <CardContent className="pt-6">
            <Skeleton className="h-60 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Handle case when no rooms are available
  if (!room) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center border-b pb-4">
            <CardTitle className="text-2xl font-semibold text-dark">Event Center</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-secondary mb-4" />
            <p className="text-lg text-gray-700 mb-4">No rooms available</p>
            <Link href="/">
              <Button variant="default" size="lg" className="gap-2">
                <ArrowLeft size={16} /> Return Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <Link href="/" className="absolute top-4 left-4">
        <Button variant="outline" size="sm" className="gap-2">
          <ArrowLeft size={16} /> Back
        </Button>
      </Link>
      
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center border-b pb-4">
          <CardTitle className="text-2xl font-semibold text-dark">Event Center</CardTitle>
          <p className="text-lg text-gray-600">{room.name}</p>
          <p className="text-sm text-gray-500">{room.location}</p>
          
          {/* Room selection dropdown */}
          <div className="mt-4">
            <select 
              className="block w-full p-2 border border-gray-300 rounded-md text-sm"
              value={room.id}
              onChange={(e) => changeRoom(parseInt(e.target.value))}
            >
              {rooms.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} - {r.location}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          {/* Room Controls Section */}
          <div className="mb-8">
            <h2 className="text-xl font-medium mb-4">Room Controls</h2>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="flex flex-col items-center justify-center p-6 h-24">
                <Monitor className="h-8 w-8 mb-2" />
                <span>Display</span>
              </Button>
              <Button variant="outline" className="flex flex-col items-center justify-center p-6 h-24">
                <Volume2 className="h-8 w-8 mb-2" />
                <span>Audio</span>
              </Button>
              <Button variant="outline" className="flex flex-col items-center justify-center p-6 h-24">
                <Lightbulb className="h-8 w-8 mb-2" />
                <span>Lights</span>
              </Button>
              <Button variant="outline" className="flex flex-col items-center justify-center p-6 h-24">
                <Thermometer className="h-8 w-8 mb-2" />
                <span>Climate</span>
              </Button>
            </div>
          </div>
          
          {/* Assistance Button */}
          <div className="mt-8 text-center">
            <p className="text-gray-700 mb-4">Need technical assistance?</p>
            <Button
              onClick={handleRequestAssistance}
              disabled={requestSent}
              size="lg"
              className="bg-primary hover:bg-blue-700 text-white font-medium py-6 px-8 rounded-full text-lg shadow-md transition duration-300 flex items-center justify-center mx-auto h-auto"
            >
              <Headset className="mr-2 h-5 w-5" />
              Request Assistance
            </Button>
            
            {requestSent && (
              <div className="mt-4 p-4 bg-green-50 text-accent rounded-lg">
                <p className="flex items-center justify-center">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Help is on the way!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
