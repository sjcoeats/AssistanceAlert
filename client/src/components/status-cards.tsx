import { Card, CardContent } from "@/components/ui/card";
import { 
  AlertCircle, CheckCircle, Clock
} from "lucide-react";

interface StatusCardsProps {
  activeCount: number;
  resolvedToday: number;
  averageResponse: string;
}

export default function StatusCards({ 
  activeCount, 
  resolvedToday, 
  averageResponse 
}: StatusCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card className="bg-white rounded-lg shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Active Requests</p>
              <h2 className="text-2xl font-bold text-dark">{activeCount}</h2>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-secondary" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white rounded-lg shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Resolved Today</p>
              <h2 className="text-2xl font-bold text-dark">{resolvedToday}</h2>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-accent" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white rounded-lg shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Average Response</p>
              <h2 className="text-2xl font-bold text-dark">{averageResponse}</h2>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
