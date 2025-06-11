import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: false, limit: '5mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);
  
  // Setup Socket.io
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NODE_ENV === "development" ? "http://localhost:5000" : true,
      methods: ["GET", "POST"]
    }
  });

  // Socket.io middleware for authentication
  io.use(async (socket, next) => {
    const userId = socket.handshake.auth.userId;
    if (!userId) {
      return next(new Error("Authentication error"));
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return next(new Error("User not found"));
    }
    
    socket.userId = userId;
    socket.user = user;
    next();
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.firstName} connected`);
    
    // Join user to their own room for direct messaging
    socket.join(`user_${socket.userId}`);
    
    // Join conversation rooms
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation_${conversationId}`);
    });

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content, messageType = 'text' } = data;
        
        const message = await storage.createMessage({
          conversationId,
          senderId: socket.userId,
          content,
          messageType
        });

        const messageWithSender = await storage.getMessages(conversationId);
        const newMessage = messageWithSender[messageWithSender.length - 1];

        // Send to all participants in the conversation
        io.to(`conversation_${conversationId}`).emit('new_message', newMessage);
        
        // Send conversation update to all participants
        const conversation = await storage.getConversationById(conversationId);
        if (conversation && conversation.participants) {
          conversation.participants.forEach((participant: any) => {
            io.to(`user_${participant.id}`).emit('conversation_updated', {
              conversationId,
              lastMessage: content,
              lastMessageTime: newMessage.createdAt
            });
          });
        }
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle marking messages as read
    socket.on('mark_read', async (data) => {
      try {
        const { messageId } = data;
        await storage.markMessageAsRead(messageId, socket.userId);
        
        // Notify sender that message was read
        socket.broadcast.emit('message_read', { messageId, readBy: socket.userId });
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      const { conversationId, isTyping } = data;
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        userId: socket.userId,
        userName: `${socket.user.firstName} ${socket.user.lastName}`,
        isTyping
      });
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.user.firstName} disconnected`);
    });
  });

  // Make io available to routes
  app.set('io', io);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
