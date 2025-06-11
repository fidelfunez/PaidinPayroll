
import { io, Socket } from 'socket.io-client';

class SocketManager {
  private socket: Socket | null = null;
  private userId: number | null = null;

  connect(userId: number) {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    this.userId = userId;
    this.socket = io({
      auth: {
        userId: userId
      }
    });

    this.socket.on('connect', () => {
      console.log('Connected to chat server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  joinConversation(conversationId: number) {
    if (this.socket) {
      this.socket.emit('join_conversation', conversationId);
    }
  }

  sendMessage(conversationId: number, content: string, messageType: string = 'text') {
    if (this.socket) {
      this.socket.emit('send_message', {
        conversationId,
        content,
        messageType
      });
    }
  }

  markAsRead(messageId: number) {
    if (this.socket) {
      this.socket.emit('mark_read', { messageId });
    }
  }

  setTyping(conversationId: number, isTyping: boolean) {
    if (this.socket) {
      this.socket.emit('typing', { conversationId, isTyping });
    }
  }

  onNewMessage(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  onConversationUpdated(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('conversation_updated', callback);
    }
  }

  onBroadcastMessage(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('broadcast_message', callback);
    }
  }

  onUserTyping(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }

  onMessageRead(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('message_read', callback);
    }
  }

  offAllListeners() {
    if (this.socket) {
      this.socket.off();
    }
  }
}

export const socketManager = new SocketManager();
