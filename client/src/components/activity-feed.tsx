import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle, MessageSquare, Bell
} from "lucide-react";

interface Activity {
  id: number;
  type: string;
  roomName: string;
  message: string;
  timestamp: string;
  technician?: string;
}

interface ActivityFeedProps {
  activities: Activity[];
  isLoading: boolean;
}

export default function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
    if (diffMinutes < 24 * 60) return `${Math.floor(diffMinutes / 60)} ${Math.floor(diffMinutes / 60) === 1 ? 'hour' : 'hours'} ago`;
    
    return date.toLocaleDateString();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-accent" />;
      case "responded":
        return <MessageSquare className="h-4 w-4 text-primary" />;
      case "requested":
        return <Bell className="h-4 w-4 text-secondary" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityBgColor = (type: string) => {
    switch (type) {
      case "resolved":
        return "bg-green-100";
      case "responded":
        return "bg-blue-100";
      case "requested":
        return "bg-red-100";
      default:
        return "bg-gray-100";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-lg shadow overflow-hidden">
      <CardHeader className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <CardTitle className="text-lg font-medium text-dark">Recent Activity</CardTitle>
        <button className="text-primary text-sm font-medium">View All</button>
      </CardHeader>
      <CardContent className="p-6">
        {activities.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No recent activity to display
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {activities.map((activity) => (
              <li key={activity.id} className="py-3 flex items-start">
                <div className={`w-8 h-8 ${getActivityBgColor(activity.type)} rounded-full flex items-center justify-center mr-3 mt-1`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div>
                  <p className="text-dark">{activity.message}</p>
                  <p className="text-sm text-gray-500">
                    {formatTime(activity.timestamp)}
                    {activity.technician && ` by ${activity.technician}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
