import { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Send, Search, Plus, User, Loader2, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { useConversations, useConversationMessages, useSendMessage, useCreateConversation, useMessagingWebSocket } from "@/hooks/use-messaging";
import { useQuery } from "@tanstack/react-query";

export default function AdminMessagesPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Real-time messaging hooks
  const { data: conversations, isLoading: conversationsLoading } = useConversations();
  const { data: messages, isLoading: messagesLoading } = useConversationMessages(selectedConversation);
  const sendMessageMutation = useSendMessage();
  const createConversationMutation = useCreateConversation();
  const { isConnected, joinConversation } = useMessagingWebSocket();
  
  // Get employees list to start new conversations
  const { data: employees } = useQuery({
    queryKey: ["/api/employees"]
  });

  // Join conversation when selected
  useEffect(() => {
    if (selectedConversation && isConnected) {
      joinConversation(selectedConversation);
    }
  }, [selectedConversation, isConnected, joinConversation]);

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (conversations && conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0].id);
    }
  }, [conversations, selectedConversation]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const selectedConv = conversations?.find(c => c.id === selectedConversation);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    try {
      await sendMessageMutation.mutateAsync({
        conversationId: selectedConversation,
        content: newMessage.trim()
      });
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const createNewConversation = async () => {
    if (!selectedEmployee) return;
    
    try {
      const newConv = await createConversationMutation.mutateAsync([parseInt(selectedEmployee)]);
      setSelectedConversation(newConv.id);
      setShowNewConversation(false);
      setSelectedEmployee("");
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getOtherParticipant = (conversation: any) => {
    if (!user || !conversation.participants) return null;
    return conversation.participants.find((p: any) => p.id !== user.id);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Filter employees who don't already have conversations
  const employeesList = employees as any[] || [];
  const availableEmployees = employeesList.filter((employee: any) => 
    !conversations?.some(conv => 
      conv.participants?.some((p: any) => p.id === employee.id)
    )
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'} flex flex-col`}>
        <Header 
          title="Team Messages" 
          subtitle="Communicate with employees and manage conversations"
        />
        
        <main className="flex-1 p-4 lg:p-6 pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
            {/* Conversations List */}
            <Card className="lg:col-span-1 flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-orange-500" />
                    All Conversations
                    {!isConnected && (
                      <div className="w-2 h-2 bg-red-500 rounded-full" title="Disconnected" />
                    )}
                  </CardTitle>
                  <Dialog open={showNewConversation} onOpenChange={setShowNewConversation}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Start New Conversation</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Select Employee</label>
                          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose an employee..." />
                            </SelectTrigger>
                            <SelectContent>
                              {availableEmployees.map((employee: any) => (
                                <SelectItem key={employee.id} value={employee.id.toString()}>
                                  {employee.firstName} {employee.lastName} - {employee.role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={createNewConversation}
                            disabled={!selectedEmployee || createConversationMutation.isPending}
                            className="bg-orange-500 hover:bg-orange-600"
                          >
                            {createConversationMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : null}
                            Start Conversation
                          </Button>
                          <Button variant="outline" onClick={() => setShowNewConversation(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input placeholder="Search conversations..." className="pl-9" />
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                {conversationsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                  </div>
                ) : conversations && conversations.length > 0 ? (
                  <div className="space-y-2">
                    {conversations.map((conversation) => {
                      const otherParticipant = getOtherParticipant(conversation);
                      return (
                        <div
                          key={conversation.id}
                          onClick={() => setSelectedConversation(conversation.id)}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedConversation === conversation.id
                              ? 'bg-orange-50 border-orange-200 border'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback>
                                {otherParticipant ? `${otherParticipant.firstName[0]}${otherParticipant.lastName[0]}` : 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm truncate">
                                  {otherParticipant ? `${otherParticipant.firstName} ${otherParticipant.lastName}` : 'Unknown'}
                                </h4>
                                {conversation.unreadCount > 0 && (
                                  <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                                    {conversation.unreadCount}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-slate-500">{otherParticipant?.role || 'Unknown'}</p>
                              <p className="text-sm text-slate-600 truncate">
                                {conversation.lastMessage?.content || 'No messages yet'}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                {conversation.lastMessage ? formatTimestamp(conversation.lastMessage.timestamp) : ''}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                    <Users className="w-12 h-12 mb-4 text-slate-300" />
                    <p className="text-sm">No conversations yet</p>
                    <p className="text-xs text-slate-400 mt-1">Start a conversation with an employee</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Message Thread */}
            <Card className="lg:col-span-2 flex flex-col">
              {selectedConv ? (
                <>
                  <CardHeader className="flex-shrink-0 border-b">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>
                          {(() => {
                            const otherParticipant = getOtherParticipant(selectedConv);
                            return otherParticipant ? `${otherParticipant.firstName[0]}${otherParticipant.lastName[0]}` : 'U';
                          })()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">
                          {(() => {
                            const otherParticipant = getOtherParticipant(selectedConv);
                            return otherParticipant ? `${otherParticipant.firstName} ${otherParticipant.lastName}` : 'Unknown';
                          })()}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {(() => {
                            const otherParticipant = getOtherParticipant(selectedConv);
                            return otherParticipant?.role || 'Unknown';
                          })()}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{maxHeight: 'calc(100% - 140px)'}}>
                    {messagesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                      </div>
                    ) : messages && messages.length > 0 ? (
                      messages.map((message) => {
                        const isOwn = message.senderId === user?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex gap-3 ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            {!isOwn && (
                              <Avatar className="w-8 h-8">
                                <AvatarFallback>
                                  {message.sender ? `${message.sender.firstName[0]}${message.sender.lastName[0]}` : 'U'}
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
                                {formatTimestamp(message.timestamp)}
                              </p>
                            </div>
                            {isOwn && (
                              <Avatar className="w-8 h-8">
                                <AvatarFallback>
                                  <User className="w-4 h-4" />
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                        <MessageSquare className="w-12 h-12 mb-4 text-slate-300" />
                        <p className="text-sm">No messages in this conversation</p>
                        <p className="text-xs text-slate-400 mt-1">Send the first message to get started</p>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="flex-shrink-0 p-4 border-t bg-white">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 min-h-[44px] max-h-32 resize-none"
                        rows={1}
                      />
                      <Button 
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4"
                      >
                        {sendMessageMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                    <p className="text-sm">Choose a conversation from the list or start a new one</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}