import { 
  type User, type InsertUser, 
  type Room, type InsertRoom,
  type AssistanceRequest, type InsertAssistanceRequest,
  type Activity, type InsertActivity
} from "@shared/schema";
import { dbStorage } from "./database-storage";

// Define a common Activity interface for both database and in-memory storage
export interface IActivityInput {
  type: string;
  roomName: string;
  message: string;
  timestamp?: string;
  technician?: string;
  roomId?: number | null;
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Rooms
  getRooms(): Promise<Room[]>;
  getRoom(id: number): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  
  // Assistance Requests
  getAssistanceRequests(status?: string): Promise<AssistanceRequest[]>;
  getActiveAssistanceRequests(): Promise<AssistanceRequest[]>;
  getResolvedAssistanceRequests(): Promise<AssistanceRequest[]>;
  getAssistanceRequest(id: number): Promise<AssistanceRequest | undefined>;
  createAssistanceRequest(request: InsertAssistanceRequest): Promise<AssistanceRequest>;
  updateAssistanceRequestStatus(id: number, status: string, resolvedBy?: string): Promise<AssistanceRequest | undefined>;
  
  // Activities
  getActivities(): Promise<Activity[]>;
  createActivity(activity: IActivityInput): Promise<Activity>;
}

// We're now using the database storage implementation instead of in-memory storage
export const storage = dbStorage;
