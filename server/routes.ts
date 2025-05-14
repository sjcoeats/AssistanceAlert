import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { storage } from "./storage";
import { 
  insertAssistanceRequestSchema,
  updateRequestStatusSchema,
  notificationSchema,
  requestAssistanceSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Create WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Track connected clients
  const clients = new Set<WebSocket>();
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    clients.add(ws);
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
        
        // Handle different message types
        if (data.type === 'requestAssistance') {
          // Validate with schema
          const validatedData = requestAssistanceSchema.parse(data);
          
          // Create a new assistance request in storage
          const request = await storage.createAssistanceRequest({
            roomId: validatedData.roomId,
            roomName: validatedData.roomName,
            roomLocation: validatedData.roomLocation,
            status: 'waiting'
          });
          
          // Create an activity log
          await storage.createActivity({
            type: 'requested',
            roomName: validatedData.roomName,
            message: `New request from ${validatedData.roomName}`
          });
          
          // Broadcast notification to all connected clients
          const notification = {
            type: 'notification',
            requestId: request.id,
            roomName: request.roomName,
            roomLocation: request.roomLocation,
            status: request.status,
            timestamp: Date.now()
          };
          
          broadcastMessage(notification);
        } 
        else if (data.type === 'updateRequestStatus') {
          // Validate with schema
          const validatedData = updateRequestStatusSchema.parse(data);
          
          // Update the request in storage
          const request = await storage.updateAssistanceRequestStatus(
            validatedData.requestId,
            validatedData.status,
            validatedData.updatedBy
          );
          
          if (request) {
            // Create an activity log
            let activityType = validatedData.status === 'in-progress' ? 'responded' : 'resolved';
            let activityMessage = validatedData.status === 'in-progress' 
              ? `${validatedData.updatedBy || 'A technician'} responded to ${request.roomName} request`
              : `Request from ${request.roomName} was resolved`;
              
            await storage.createActivity({
              type: activityType,
              roomName: request.roomName,
              message: activityMessage,
              technician: validatedData.updatedBy
            });
            
            // Broadcast update to all connected clients
            const notification = {
              type: 'notification',
              requestId: request.id,
              roomName: request.roomName,
              roomLocation: request.roomLocation,
              status: request.status,
              timestamp: Date.now()
            };
            
            broadcastMessage(notification);
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws);
    });
  });
  
  // Function to broadcast message to all connected clients
  function broadcastMessage(message: any) {
    const messageString = JSON.stringify(message);
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageString);
      }
    });
  }
  
  // API routes
  // GET all active assistance requests
  app.get('/api/assistance-requests/active', async (req, res) => {
    try {
      const requests = await storage.getActiveAssistanceRequests();
      res.json(requests);
    } catch (error) {
      console.error('Error fetching active requests:', error);
      res.status(500).json({ message: 'Failed to fetch active requests' });
    }
  });
  
  // GET resolved assistance requests
  app.get('/api/assistance-requests/resolved', async (req, res) => {
    try {
      const requests = await storage.getResolvedAssistanceRequests();
      res.json(requests);
    } catch (error) {
      console.error('Error fetching resolved requests:', error);
      res.status(500).json({ message: 'Failed to fetch resolved requests' });
    }
  });
  
  // GET all assistance requests (with optional status filter)
  app.get('/api/assistance-requests', async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const requests = await storage.getAssistanceRequests(status);
      res.json(requests);
    } catch (error) {
      console.error('Error fetching requests:', error);
      res.status(500).json({ message: 'Failed to fetch requests' });
    }
  });
  
  // GET a specific assistance request
  app.get('/api/assistance-requests/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const request = await storage.getAssistanceRequest(id);
      
      if (!request) {
        return res.status(404).json({ message: 'Request not found' });
      }
      
      res.json(request);
    } catch (error) {
      console.error('Error fetching request:', error);
      res.status(500).json({ message: 'Failed to fetch request' });
    }
  });
  
  // POST a new assistance request
  app.post('/api/assistance-requests', async (req, res) => {
    try {
      // Validate request body
      const data = insertAssistanceRequestSchema.parse(req.body);
      
      // Create request in storage
      const request = await storage.createAssistanceRequest(data);
      
      // Create an activity log
      await storage.createActivity({
        type: 'requested',
        roomName: data.roomName,
        message: `New request from ${data.roomName}`
      });
      
      res.status(201).json(request);
    } catch (error) {
      console.error('Error creating request:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create request' });
    }
  });
  
  // PATCH update an assistance request status
  app.patch('/api/assistance-requests/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, resolvedBy } = req.body;
      
      if (!['waiting', 'in-progress', 'resolved'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
      
      const request = await storage.updateAssistanceRequestStatus(id, status, resolvedBy);
      
      if (!request) {
        return res.status(404).json({ message: 'Request not found' });
      }
      
      res.json(request);
    } catch (error) {
      console.error('Error updating request:', error);
      res.status(500).json({ message: 'Failed to update request' });
    }
  });
  
  // GET activity logs
  app.get('/api/activities', async (req, res) => {
    try {
      const activities = await storage.getActivities();
      res.json(activities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      res.status(500).json({ message: 'Failed to fetch activities' });
    }
  });
  
  // GET room data
  app.get('/api/rooms', async (req, res) => {
    try {
      const rooms = await storage.getRooms();
      res.json(rooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      res.status(500).json({ message: 'Failed to fetch rooms' });
    }
  });
  
  // GET a specific room
  app.get('/api/rooms/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const room = await storage.getRoom(id);
      
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      
      res.json(room);
    } catch (error) {
      console.error('Error fetching room:', error);
      res.status(500).json({ message: 'Failed to fetch room' });
    }
  });
  
  // POST create a new room
  app.post('/api/rooms', async (req, res) => {
    try {
      // Validate request body
      if (!req.body.name || !req.body.location) {
        return res.status(400).json({ message: 'Room name and location are required' });
      }
      
      const room = await storage.createRoom({
        name: req.body.name,
        location: req.body.location,
        status: req.body.status || 'available'
      });
      
      console.log('Created new room:', room);
      res.status(201).json(room);
    } catch (error) {
      console.error('Error creating room:', error);
      res.status(500).json({ message: 'Failed to create room' });
    }
  });

  return httpServer;
}
