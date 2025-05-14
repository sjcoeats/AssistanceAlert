import { createContext, useContext } from "react";
import { 
  type RequestAssistanceMessage,
  type UpdateRequestStatusMessage,
  type NotificationMessage
} from "@shared/schema";

export type WebSocketMessage = 
  | RequestAssistanceMessage
  | UpdateRequestStatusMessage
  | NotificationMessage;

export const WebSocketContext = createContext<WebSocket | null>(null);

export const WebSocketProvider = WebSocketContext.Provider;

export function useWebSocket() {
  return useContext(WebSocketContext);
}

export function setupWebSocket(): WebSocket {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  const socket = new WebSocket(wsUrl);
  
  socket.onopen = () => {
    console.log("WebSocket connection established");
  };
  
  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
  
  socket.onclose = (event) => {
    console.log("WebSocket connection closed:", event.code, event.reason);
    // Try to reconnect after a delay
    setTimeout(() => {
      setupWebSocket();
    }, 5000);
  };
  
  return socket;
}

export function sendWebSocketMessage(socket: WebSocket | null, message: WebSocketMessage) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error("WebSocket is not connected");
    return false;
  }
  
  socket.send(JSON.stringify(message));
  return true;
}
