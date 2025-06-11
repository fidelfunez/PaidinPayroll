import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Send, Search, Plus, User, Users, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { socketManager } from "@/lib/socket";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminMessagesPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [messageType, setMessageType] = useState("individual");
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");

  const { data: employees } = useQuery({
    queryKey: ['/api/employees']
  });

  // Fetch conversations for admin
  const { data: conversations = [], refetch: refetchConversations } = useQuery({
    queryKey: ['/api/conversations'],
    enabled: !!user,
  });

  // Fetch messages for selected conversation
  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: [`/api/conversations/${selectedConversation}/messages`],
    enabled: !!selectedConversation,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { conversationId: number; content: string }) => {
      return apiRequest(`/api/conversations/${data.conversationId}/messages`, {
        method: 'POST',
        body: data,
      });
    },
    onSuccess: () => {
      setNewMessage("");
      refetchMessages();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Broadcast message mutation
  const broadcastMutation = useMutation({
    mutationFn: async (data: { subject: string; content: string }) => {
      return apiRequest('/api/conversations/broadcast', {
        method: 'POST',
        body: data,
      });
    },
    onSuccess: () => {
      setBroadcastSubject("");
      setBroadcastMessage("");
      toast({
        title: "Success",
        description: "Broadcast message sent to all employees",
      });
      refetchConversations();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send broadcast message",
        variant: "destructive",
      });
    },
  });

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user) return;

    const socket = socketManager.connect(user.id);

    socketManager.onNewMessage((message) => {
      if (message.conversationId === selectedConversation) {
        refetchMessages();
      }
      refetchConversations();
    });

    socketManager.onConversationUpdated(() => {
      refetchConversations();
    });

    return () => {
      socketManager.offAllListeners();
      socketManager.disconnect();
    };
  }, [user, selectedConversation, refetchMessages, refetchConversations]);

  useEffect(() => {
    if (selectedConversation) {
      socketManager.joinConversation(selectedConversation);
    }
  }, [selectedConversation]);

  const selectedConv = conversations.find((c: any) => c.id === selectedConversation);
  const totalUnread = conversations.reduce((sum: number, conv: any) => sum + (conv.unreadCount || 0), 0);

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      content: newMessage.trim(),
    });
  };

  const sendBroadcast = () => {
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both subject and message",
        variant: "destructive",
      });
      return;
    }

    broadcastMutation.mutate({
      subject: broadcastSubject.trim(),
      content: broadcastMessage.trim(),
    });
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatLastMessageTime = (timestamp: string) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInHours = (now.getTime() - messageTime.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)} minutes ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      return `${Math.floor(diffInHours / 24)} days ago`;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'} flex flex-col`}>
        <Header 
          title="Admin Messages" 
          subtitle={`${totalUnread} unread messages from employees`}
        />
        
        <main className="flex-1 p-4 lg:p-6 overflow-hidden pb-4">
          {/* Message Type Selector */}
          <div className="mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-4">
                  <Select value={messageType} onValueChange={setMessageType}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual Messages</SelectItem>
                      <SelectItem value="broadcast">Broadcast to All</SelectItem>
                      <SelectItem value="department">Department Messages</SelectItem>
                    </SelectContent>
                  </Select>
                  {messageType === 'broadcast' && (
                    <Button>
                      <Users className="w-4 h-4 mr-2" />
                      Send Company-wide Message
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {messageType === 'individual' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-300px)] max-h-[calc(100vh-300px)]">
              {/* Employee Conversations */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-orange-500" />
                      Employee Messages
                    </CardTitle>
                    <Badge variant="outline">{totalUnread} unread</Badge>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input placeholder="Search employees..." className="pl-9" />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-1 max-h-[calc(100vh-400px)] overflow-y-auto">
                    {conversations.map((conversation: any) => (
                      <div
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation.id)}
                        className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                          selectedConversation === conversation.id ? 'bg-orange-50 border-r-2 border-orange-500' : ''
                        }`}
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={conversation.otherUser?.profilePhoto || undefined} />
                          <AvatarFallback>
                            {conversation.otherUser ? 
                              `${conversation.otherUser.firstName[0]}${conversation.otherUser.lastName[0]}` : 
                              conversation.title?.[0] || 'C'
                            }
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium truncate">
                              {conversation.type === 'broadcast' ? 
                                conversation.title : 
                                `${conversation.otherUser?.firstName} ${conversation.otherUser?.lastName}`
                              }
                            </h3>
                            <div className="flex items-center gap-2">
                              {conversation.unreadCount > 0 && (
                                <Badge variant="default" className="text-xs">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-slate-500">
                            {conversation.type === 'broadcast' ? 'Broadcast Message' : conversation.otherUser?.role}
                          </p>
                          <p className="text-sm text-slate-600 truncate">
                            {conversation.lastMessage || 'No messages yet'}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {conversation.lastMessageTime ? formatLastMessageTime(conversation.lastMessageTime) : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Message Thread */}
              <Card className="lg:col-span-2 flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>
                        {selectedConv?.employeeName.split(' ').map(n => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{selectedConv?.employeeName}</h3>
                      <p className="text-sm text-slate-500">{selectedConv?.role}</p>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 overflow-y-auto space-y-4">
                  {messages.map((message: any) => {
                    const isOwn = message.senderId === user?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isOwn && (
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={message.sender.profilePhoto || undefined} />
                            <AvatarFallback>
                              {`${message.sender.firstName[0]}${message.sender.lastName[0]}`}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-first' : ''}`}>
                          <div
                            className={`p-3 rounded-lg ${
                              isOwn
                                ? 'bg-orange-500 text-white'
                                : 'bg-slate-100 text-slate-900'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                          </div>
                          <p className={`text-xs text-slate-400 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                            {formatTimestamp(message.createdAt)}
                          </p>
                        </div>
                        {isOwn && (
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user?.profilePhoto || undefined} />
                            <AvatarFallback>
                              <User className="w-4 h-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    );
                  })}
                </CardContent>

                {/* Message Input */}
                <div className="p-4 border-t border-slate-200 flex-shrink-0">
                  <div className="flex gap-3">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 min-h-[40px] max-h-[120px]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {messageType === 'broadcast' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-orange-500" />
                  Send Company-wide Message
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Subject</label>
                  <Input 
                    placeholder="Enter message subject..."
                    value={broadcastSubject}
                    onChange={(e) => setBroadcastSubject(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <Textarea 
                    placeholder="Enter your company-wide message..."
                    className="min-h-[200px]"
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                  />
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 mb-1">Broadcast Notice</p>
                      <p className="text-blue-700">
                        This message will be sent to all {Array.isArray(employees) ? employees.length : 0} employees. 
                        They will receive both an in-app notification and an email.
                      </p>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={sendBroadcast} 
                  className="w-full"
                  disabled={!broadcastSubject.trim() || !broadcastMessage.trim() || broadcastMutation.isPending}
                >
                  {broadcastMutation.isPending ? 'Sending...' : 'Send to All Employees'}
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
        
        <Footer />
      </div>
    </div>
  );
}