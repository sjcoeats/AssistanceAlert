import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, MoreVertical, AlertCircle, Clock } from "lucide-react";
import { type AssistanceRequest } from "@shared/schema";
import { useWebSocket, sendWebSocketMessage } from "@/lib/websocket";
import { useToast } from "@/hooks/use-toast";

interface RequestTableProps {
  requests: AssistanceRequest[];
  isLoading: boolean;
  status: "active" | "resolved";
}

export default function RequestTable({ requests, isLoading, status }: RequestTableProps) {
  const queryClient = useQueryClient();
  const socket = useWebSocket();
  const { toast } = useToast();
  const [pendingAction, setPendingAction] = useState<number | null>(null);

  const formatTime = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleRespondToRequest = async (requestId: number) => {
    try {
      setPendingAction(requestId);
      await apiRequest("PATCH", `/api/assistance-requests/${requestId}`, {
        status: "in-progress"
      });
      
      // Send via WebSocket for real-time notification
      sendWebSocketMessage(socket, {
        type: "updateRequestStatus",
        requestId,
        status: "in-progress"
      });
      
      // Refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/assistance-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      
      toast({
        title: "Status Updated",
        description: "Request status changed to In Progress",
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating request status:", error);
      toast({
        title: "Update Failed",
        description: "Unable to update the request status",
        variant: "destructive",
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleMarkAsResolved = async (requestId: number) => {
    try {
      setPendingAction(requestId);
      await apiRequest("PATCH", `/api/assistance-requests/${requestId}`, {
        status: "resolved",
        resolvedBy: "AV Technician" // In a real app, this would be the logged-in user
      });
      
      // Send via WebSocket for real-time notification
      sendWebSocketMessage(socket, {
        type: "updateRequestStatus",
        requestId,
        status: "resolved",
        updatedBy: "AV Technician"
      });
      
      // Refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/assistance-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      
      toast({
        title: "Request Resolved",
        description: "The assistance request has been marked as resolved",
        variant: "success",
      });
    } catch (error) {
      console.error("Error resolving request:", error);
      toast({
        title: "Operation Failed",
        description: "Unable to mark the request as resolved",
        variant: "destructive",
      });
    } finally {
      setPendingAction(null);
    }
  };

  const renderStatusBadge = (status: string) => {
    if (status === "waiting") {
      return (
        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-secondary">
          Waiting
        </span>
      );
    } else if (status === "in-progress") {
      return (
        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-primary">
          In Progress
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-accent">
          Resolved
        </span>
      );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-48" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-lg shadow overflow-hidden">
      <CardHeader className="px-6 py-4 border-b border-gray-200">
        <CardTitle className="text-lg font-medium text-dark">
          {status === "active" ? "Active Assistance Requests" : "Resolved Requests"}
        </CardTitle>
      </CardHeader>
      <div className="overflow-x-auto">
        {requests.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <AlertCircle className="mx-auto h-8 w-8 mb-2 text-gray-400" />
            <p>No {status === "active" ? "active" : "resolved"} requests found</p>
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Requested</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                {status === "active" && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {requests.map((request) => (
                <tr 
                  key={request.id} 
                  className={request.status === "waiting" ? "bg-red-50" : ""}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 ${
                        request.status === "waiting" 
                          ? "bg-red-100" 
                          : request.status === "in-progress" 
                            ? "bg-amber-100" 
                            : "bg-green-100"
                      } rounded-full flex items-center justify-center mr-3`}>
                        <Clock className={`h-4 w-4 ${
                          request.status === "waiting" 
                            ? "text-secondary" 
                            : request.status === "in-progress" 
                              ? "text-warning" 
                              : "text-accent"
                        }`} />
                      </div>
                      <div>
                        <div className="font-medium text-dark">{request.roomName}</div>
                        <div className="text-sm text-gray-500">{request.roomLocation}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-dark">{formatTime(request.requestedAt)}</div>
                    {request.status === "waiting" && (
                      <div className="text-sm text-secondary">New!</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderStatusBadge(request.status)}
                  </td>
                  {status === "active" && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.status === "waiting" ? (
                        <Button
                          onClick={() => handleRespondToRequest(request.id)}
                          disabled={pendingAction === request.id}
                          className="bg-primary text-white px-3 py-1 rounded-md mr-2 hover:bg-blue-700 transition duration-200"
                        >
                          Respond
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleMarkAsResolved(request.id)}
                          disabled={pendingAction === request.id}
                          className="bg-accent text-white px-3 py-1 rounded-md mr-2 hover:bg-green-600 transition duration-200"
                        >
                          Mark Resolved
                        </Button>
                      )}
                      <Button variant="ghost" className="text-gray-500 hover:text-gray-700">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="px-6 py-4 border-t border-gray-200 text-center text-sm text-gray-500">
        Displaying {requests.length} {status === "active" ? "active" : "resolved"} requests
      </div>
    </Card>
  );
}
