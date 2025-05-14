import { 
  type User, type InsertUser, 
  type Room, type InsertRoom,
  type AssistanceRequest, type InsertAssistanceRequest,
  type Activity, type InsertActivity,
  users, rooms, assistanceRequests, activities
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, or, and } from "drizzle-orm";
import { IStorage, IActivityInput } from "./storage";

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }
  
  // Room methods
  async getRooms(): Promise<Room[]> {
    return await db.select().from(rooms);
  }
  
  async getRoom(id: number): Promise<Room | undefined> {
    const result = await db.select().from(rooms).where(eq(rooms.id, id));
    return result[0];
  }
  
  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const result = await db.insert(rooms).values(insertRoom).returning();
    return result[0];
  }
  
  // Assistance Request methods
  async getAssistanceRequests(status?: string): Promise<AssistanceRequest[]> {
    if (status) {
      return await db.select().from(assistanceRequests).where(eq(assistanceRequests.status, status));
    }
    return await db.select().from(assistanceRequests);
  }
  
  async getActiveAssistanceRequests(): Promise<AssistanceRequest[]> {
    return await db.select().from(assistanceRequests).where(
      or(
        eq(assistanceRequests.status, "waiting"),
        eq(assistanceRequests.status, "in-progress")
      )
    );
  }
  
  async getResolvedAssistanceRequests(): Promise<AssistanceRequest[]> {
    return await db.select().from(assistanceRequests).where(eq(assistanceRequests.status, "resolved"));
  }
  
  async getAssistanceRequest(id: number): Promise<AssistanceRequest | undefined> {
    const result = await db.select().from(assistanceRequests).where(eq(assistanceRequests.id, id));
    return result[0];
  }
  
  async createAssistanceRequest(insertRequest: InsertAssistanceRequest): Promise<AssistanceRequest> {
    const result = await db.insert(assistanceRequests).values(insertRequest).returning();
    return result[0];
  }
  
  async updateAssistanceRequestStatus(id: number, status: string, resolvedBy?: string): Promise<AssistanceRequest | undefined> {
    const now = new Date();
    const updateData: Partial<AssistanceRequest> = { status };
    
    if (status === "in-progress") {
      updateData.respondedAt = now;
    } else if (status === "resolved") {
      updateData.resolvedAt = now;
      updateData.resolvedBy = resolvedBy || null;
    }
    
    const result = await db
      .update(assistanceRequests)
      .set(updateData)
      .where(eq(assistanceRequests.id, id))
      .returning();
      
    return result[0];
  }
  
  // Activities
  async getActivities(): Promise<Activity[]> {
    const dbActivities = await db
      .select()
      .from(activities)
      .orderBy(desc(activities.timestamp))
      .limit(50);
    
    // Convert timestamp to string format for compatibility with the interface
    return dbActivities.map(activity => {
      // Type assertion to convert Date to string in the timestamp property
      const result = {
        ...activity,
        timestamp: activity.timestamp.toISOString()
      };
      return result as unknown as Activity;
    });
  }
  
  async createActivity(activity: IActivityInput): Promise<Activity> {
    // Find the roomId if not provided but roomName is
    let roomId = activity.roomId || null;
    
    if (!roomId && activity.roomName) {
      const room = await db
        .select()
        .from(rooms)
        .where(eq(rooms.name, activity.roomName))
        .limit(1);
        
      if (room.length > 0) {
        roomId = room[0].id;
      }
    }
    
    const insertData: InsertActivity = {
      type: activity.type,
      roomName: activity.roomName,
      message: activity.message,
      roomId: roomId,
      technician: activity.technician || null
    };
    
    const result = await db.insert(activities).values(insertData).returning();
    
    // Convert timestamp to string format for compatibility with the interface
    const resultWithStringTimestamp = {
      ...result[0],
      timestamp: result[0].timestamp.toISOString()
    };
    
    return resultWithStringTimestamp as unknown as Activity;
  }
}

export const dbStorage = new DatabaseStorage();