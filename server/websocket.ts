import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { parse } from 'url';
import { storage } from './storage';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: number;
  isAlive?: boolean;
}

export class MessagingWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<number, AuthenticatedWebSocket[]> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/messages'
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    this.setupHeartbeat();
  }

  private handleConnection(ws: AuthenticatedWebSocket, request: any) {
    const { query } = parse(request.url, true);
    const userId = parseInt(query.userId as string);

    if (!userId || isNaN(userId)) {
      ws.close(1008, 'Authentication required');
      return;
    }

    ws.userId = userId;
    ws.isAlive = true;

    // Add client to user's connections
    if (!this.clients.has(userId)) {
      this.clients.set(userId, []);
    }
    this.clients.get(userId)!.push(ws);

    console.log(`User ${userId} connected to messaging WebSocket`);

    ws.on('message', (data) => this.handleMessage(ws, data));
    ws.on('close', () => this.handleDisconnection(ws));
    ws.on('pong', () => { ws.isAlive = true; });

    // Send initial data
    this.sendUserConversations(userId);
  }

  private async handleMessage(ws: AuthenticatedWebSocket, data: any) {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'send_message':
          await this.handleSendMessage(ws, message.payload);
          break;
        case 'mark_read':
          await this.handleMarkRead(ws, message.payload);
          break;
        case 'join_conversation':
          await this.handleJoinConversation(ws, message.payload);
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        payload: { message: 'Invalid message format' }
      }));
    }
  }

  private async handleSendMessage(ws: AuthenticatedWebSocket, payload: any) {
    const { conversationId, content } = payload;
    
    if (!ws.userId || !conversationId || !content) {
      return;
    }

    try {
      // Create the message
      const newMessage = await storage.createMessage({
        conversationId,
        senderId: ws.userId,
        content: content.trim()
      });

      // Get conversation to find participants
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return;
      }

      // Broadcast to all participants
      for (const participantId of conversation.participantIds) {
        this.sendToUser(participantId, {
          type: 'new_message',
          payload: {
            message: newMessage,
            conversationId
          }
        });
      }

      // Update conversations list for all participants
      for (const participantId of conversation.participantIds) {
        this.sendUserConversations(participantId);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        payload: { message: 'Failed to send message' }
      }));
    }
  }

  private async handleMarkRead(ws: AuthenticatedWebSocket, payload: any) {
    const { messageId } = payload;
    
    if (!ws.userId || !messageId) {
      return;
    }

    try {
      await storage.markMessageAsRead(messageId, ws.userId);
      
      ws.send(JSON.stringify({
        type: 'message_read',
        payload: { messageId }
      }));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  private async handleJoinConversation(ws: AuthenticatedWebSocket, payload: any) {
    const { conversationId } = payload;
    
    if (!ws.userId || !conversationId) {
      return;
    }

    try {
      const messages = await storage.getConversationMessages(conversationId, 50, 0);
      
      ws.send(JSON.stringify({
        type: 'conversation_messages',
        payload: {
          conversationId,
          messages: messages.reverse() // Reverse to get chronological order
        }
      }));
    } catch (error) {
      console.error('Error joining conversation:', error);
    }
  }

  private handleDisconnection(ws: AuthenticatedWebSocket) {
    if (ws.userId) {
      const userConnections = this.clients.get(ws.userId);
      if (userConnections) {
        const index = userConnections.indexOf(ws);
        if (index > -1) {
          userConnections.splice(index, 1);
        }
        
        if (userConnections.length === 0) {
          this.clients.delete(ws.userId);
        }
      }
      
      console.log(`User ${ws.userId} disconnected from messaging WebSocket`);
    }
  }

  private async sendUserConversations(userId: number) {
    try {
      const conversations = await storage.getUserConversations(userId);
      const conversationsWithDetails = await Promise.all(
        conversations.map(async (conv) => {
          const lastMessage = conv.lastMessageId 
            ? await storage.getConversationMessages(conv.id, 1, 0)
            : [];
          
          return {
            ...conv,
            lastMessage: lastMessage[0] || null,
            unreadCount: await this.getUnreadCount(conv.id, userId)
          };
        })
      );

      this.sendToUser(userId, {
        type: 'conversations_update',
        payload: { conversations: conversationsWithDetails }
      });
    } catch (error) {
      console.error('Error sending user conversations:', error);
    }
  }

  private async getUnreadCount(conversationId: number, userId: number): Promise<number> {
    const messages = await storage.getConversationMessages(conversationId);
    return messages.filter(msg => 
      !msg.readBy.includes(userId) && msg.senderId !== userId
    ).length;
  }

  private sendToUser(userId: number, data: any) {
    const userConnections = this.clients.get(userId);
    if (userConnections) {
      const message = JSON.stringify(data);
      userConnections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }
  }

  private setupHeartbeat() {
    setInterval(() => {
      this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds
  }

  // Public method to send notifications from HTTP endpoints
  public notifyUser(userId: number, data: any) {
    this.sendToUser(userId, data);
  }

  // Public method to broadcast to conversation participants
  public notifyConversation(participantIds: number[], data: any) {
    participantIds.forEach(userId => {
      this.sendToUser(userId, data);
    });
  }
}

export let messagingWS: MessagingWebSocketServer;

export function initializeMessagingWebSocket(server: Server) {
  messagingWS = new MessagingWebSocketServer(server);
  return messagingWS;
}