import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Send, Search, Plus, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";

export default function MessagesPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const [selectedConversation, setSelectedConversation] = useState(1);
  const [newMessage, setNewMessage] = useState("");

  const conversations = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "HR Manager",
      lastMessage: "Your expense reimbursement has been approved",
      timestamp: "2 hours ago",
      unread: 2,
      avatar: undefined as string | undefined
    },
    {
      id: 2,
      name: "Mike Chen",
      role: "Finance Director",
      lastMessage: "Bitcoin payment schedule updated for next month",
      timestamp: "1 day ago",
      unread: 0,
      avatar: undefined as string | undefined
    },
    {
      id: 3,
      name: "Support Team",
      role: "Technical Support",
      lastMessage: "Thank you for reporting the issue. We'll investigate...",
      timestamp: "3 days ago",
      unread: 1,
      avatar: undefined as string | undefined
    },
    {
      id: 4,
      name: "Alex Rodriguez",
      role: "Team Lead",
      lastMessage: "Great work on the project! Let's discuss next steps",
      timestamp: "1 week ago",
      unread: 0,
      avatar: undefined as string | undefined
    }
  ];

  const messages = [
    {
      id: 1,
      senderId: 2,
      senderName: "Sarah Johnson",
      content: "Hi! I wanted to follow up on your recent expense submission.",
      timestamp: "10:30 AM",
      isOwn: false
    },
    {
      id: 2,
      senderId: 1,
      senderName: "You",
      content: "Thanks for reaching out! Is there anything else you need from me?",
      timestamp: "10:35 AM",
      isOwn: true
    },
    {
      id: 3,
      senderId: 2,
      senderName: "Sarah Johnson",
      content: "Actually, yes. Could you provide the original receipt for the hotel stay? The current one is a bit blurry.",
      timestamp: "10:37 AM",
      isOwn: false
    },
    {
      id: 4,
      senderId: 1,
      senderName: "You",
      content: "Of course! I'll upload a clearer copy right now.",
      timestamp: "10:40 AM",
      isOwn: true
    },
    {
      id: 5,
      senderId: 2,
      senderName: "Sarah Johnson",
      content: "Perfect! Your expense reimbursement has been approved and will be processed in Bitcoin as usual.",
      timestamp: "11:15 AM",
      isOwn: false
    }
  ];

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    console.log("Sending message:", newMessage);
    setNewMessage("");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Header 
          title="Messages" 
          subtitle="Communicate with your team and support"
        />
        
        <main className="p-4 lg:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
            {/* Conversations List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-orange-500" />
                    Conversations
                  </CardTitle>
                  <Button size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input placeholder="Search conversations..." className="pl-9" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation.id)}
                      className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                        selectedConversation === conversation.id ? 'bg-orange-50 border-r-2 border-orange-500' : ''
                      }`}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={conversation.avatar || undefined} />
                        <AvatarFallback>
                          {conversation.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium truncate">{conversation.name}</h3>
                          {conversation.unread > 0 && (
                            <Badge variant="default" className="text-xs">
                              {conversation.unread}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{conversation.role}</p>
                        <p className="text-sm text-slate-600 truncate">{conversation.lastMessage}</p>
                        <p className="text-xs text-slate-400 mt-1">{conversation.timestamp}</p>
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
                      {selectedConv?.name.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{selectedConv?.name}</h3>
                    <p className="text-sm text-slate-500">{selectedConv?.role}</p>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    {!message.isOwn && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>
                          {message.senderName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`max-w-xs lg:max-w-md ${message.isOwn ? 'order-first' : ''}`}>
                      <div
                        className={`p-3 rounded-lg ${
                          message.isOwn
                            ? 'bg-orange-500 text-white'
                            : 'bg-slate-100 text-slate-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <p className={`text-xs text-slate-400 mt-1 ${message.isOwn ? 'text-right' : 'text-left'}`}>
                        {message.timestamp}
                      </p>
                    </div>
                    {message.isOwn && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
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
        </main>
        
        <Footer />
      </div>
    </div>
  );
}