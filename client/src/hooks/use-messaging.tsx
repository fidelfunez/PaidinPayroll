import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useEffect, useRef, useState } from "react";

interface Conversation {
  id: number;
  participantIds: number[];
  lastMessageId?: number;
  createdAt: string;
  updatedAt: string;
  participants: Array<{
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  }>;
  lastMessage?: {
    id: number;
    conversationId: number;
    senderId: number;
    content: string;
    timestamp: string;
    readBy: number[];
    sender?: {
      id: number;
      username: string;
      firstName: string;
      lastName: string;
    };
  };
  unreadCount: number;
}

interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  timestamp: string;
  readBy: number[];
  sender?: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
  };
}

export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
  });
}

export function useConversationMessages(conversationId: number | null, enabled = true) {
  return useQuery<Message[]>({
    queryKey: ["/api/conversations", conversationId, "messages"],
    enabled: enabled && conversationId !== null,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (participantIds: number[]) => {
      const response = await apiRequest("POST", "/api/conversations", { participantIds });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: number; content: string }) => {
      const response = await apiRequest("POST", `/api/conversations/${conversationId}/messages`, { content });
      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", variables.conversationId, "messages"] });
    },
  });
}

export function useMarkMessageRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (messageId: number) => {
      const response = await apiRequest("PATCH", `/api/messages/${messageId}/read`, undefined);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });
}

export function useMessagingWebSocket() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/messages?userId=${user.id}`;

    const connect = () => {
      try {
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
        };

        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        wsRef.current.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          setIsConnected(false);
          
          // Reconnect after 3 seconds unless it was a normal close
          if (event.code !== 1000) {
            setTimeout(connect, 3000);
          }
        };

        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
        };
      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        setTimeout(connect, 3000);
      }
    };

    const handleWebSocketMessage = (data: any) => {
      switch (data.type) {
        case 'conversations_update':
          queryClient.setQueryData(["/api/conversations"], data.payload.conversations);
          break;
        
        case 'new_message':
          const { message, conversationId } = data.payload;
          
          // Update conversations list
          queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
          
          // Update messages for the specific conversation
          queryClient.setQueryData(
            ["/api/conversations", conversationId, "messages"],
            (oldMessages: Message[] | undefined) => {
              if (!oldMessages) return [message];
              return [...oldMessages, message];
            }
          );
          break;
        
        case 'conversation_messages':
          const { conversationId: convId, messages } = data.payload;
          queryClient.setQueryData(["/api/conversations", convId, "messages"], messages);
          break;
        
        case 'message_read':
          // Could update read status in local cache
          queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
          break;
        
        case 'error':
          console.error('WebSocket error:', data.payload.message);
          break;
      }
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
      }
    };
  }, [user, queryClient]);

  const sendWebSocketMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  const joinConversation = (conversationId: number) => {
    sendWebSocketMessage({
      type: 'join_conversation',
      payload: { conversationId }
    });
  };

  return {
    isConnected,
    sendWebSocketMessage,
    joinConversation
  };
}