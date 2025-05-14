import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-neutral p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold mb-2">Event Center AV Assistance</CardTitle>
          <CardDescription>
            Welcome to the AV Assistance System
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Link href="/touch-screen/1">
            <Button className="w-full bg-primary text-white font-medium py-4 px-8 rounded-lg text-lg shadow-md transition duration-300">
              Room Touch Screen
            </Button>
          </Link>
          
          <Link href="/technician-dashboard">
            <Button className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-4 px-8 rounded-lg text-lg shadow-md transition duration-300 mb-4">
              AV Technician Dashboard
            </Button>
          </Link>
          
          <Link href="/room-management">
            <Button className="w-full bg-gray-700 hover:bg-gray-800 text-white font-medium py-4 px-8 rounded-lg text-lg shadow-md transition duration-300">
              Room Management
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
