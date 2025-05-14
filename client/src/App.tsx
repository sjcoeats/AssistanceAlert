import { Switch, Route, Link } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import TechnicianDashboard from "@/pages/technician-dashboard";
import TouchScreen from "@/pages/touch-screen";
import RoomManagement from "@/pages/room-management";
import { useState, useEffect } from "react";
import { setupWebSocket } from "@/lib/websocket";
import { WebSocketProvider } from "@/lib/websocket";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/touch-screen/:roomId?" component={TouchScreen} />
      <Route path="/technician-dashboard" component={TechnicianDashboard} />
      <Route path="/room-management" component={RoomManagement} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = setupWebSocket();
    setSocket(ws);

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  return (
    <WebSocketProvider value={socket}>
      <TooltipProvider>
        <Toaster />
        <div className="min-h-screen bg-neutral">
          <Router />
        </div>
      </TooltipProvider>
    </WebSocketProvider>
  );
}

export default App;
