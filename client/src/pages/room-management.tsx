import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Plus, Edit, Trash } from "lucide-react";
import { type Room } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function RoomManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newRoom, setNewRoom] = useState({ name: "", location: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all rooms
  const { data: rooms = [], isLoading } = useQuery<Room[]>({
    queryKey: ['/api/rooms'],
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewRoom(prev => ({ ...prev, [name]: value }));
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!newRoom.name.trim() || !newRoom.location.trim()) {
      toast({
        title: "Validation Error",
        description: "Room name and location are required",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Send request to create a new room
      await apiRequest("POST", "/api/rooms", newRoom);
      
      // Reset form and refresh data
      setNewRoom({ name: "", location: "" });
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      
      toast({
        title: "Room Added",
        description: `${newRoom.name} has been successfully added`,
        variant: "default"
      });
    } catch (error) {
      console.error("Error adding room:", error);
      toast({
        title: "Failed to Add Room",
        description: "There was an error adding the room. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral px-4 py-8">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Room Management</h1>
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft size={16} /> Back to Home
            </Button>
          </Link>
        </div>
        
        {/* Add New Room */}
        <Card className="mb-8 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">Add New Room</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddRoom} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Room Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={newRoom.name}
                    onChange={handleInputChange}
                    placeholder="Conference Room A"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    value={newRoom.location}
                    onChange={handleInputChange}
                    placeholder="Main Building, Floor 1"
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="mt-4 bg-primary text-white"
                disabled={isSubmitting}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Room
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Room List */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">Room List</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No rooms available. Add your first room above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        API POST String
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rooms.map((room) => (
                      <tr key={room.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {room.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {room.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {room.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            room.status === "available" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {room.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-mono bg-gray-50 rounded">
                          {JSON.stringify({
                            roomId: room.id,
                            roomName: room.name,
                            roomLocation: room.location
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}