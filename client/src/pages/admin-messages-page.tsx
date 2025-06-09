import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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

export default function AdminMessagesPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const [selectedConversation, setSelectedConversation] = useState(1);
  const [newMessage, setNewMessage] = useState("");
  const [messageType, setMessageType] = useState("individual");

  const { data: employees } = useQuery({
    queryKey: ['/api/employees']
  });

  const conversations = [
    {
      id: 1,
      employeeName: "Sarah Johnson",
      role: "HR Manager",
      lastMessage: "Thank you for approving my expense reimbursement",
      timestamp: "1 hour ago",
      unread: 0,
      priority: "normal",
      avatar: undefined as string | undefined
    },
    {
      id: 2,
      employeeName: "Mike Chen",
      role: "Finance Director", 
      lastMessage: "Could you review my salary adjustment request?",
      timestamp: "3 hours ago",
      unread: 1,
      priority: "high",
      avatar: undefined as string | undefined
    },
    {
      id: 3,
      employeeName: "Alex Rodriguez",
      role: "Team Lead",
      lastMessage: "The new withdrawal method has been set up successfully",
      timestamp: "1 day ago",
      unread: 0,
      priority: "normal",
      avatar: undefined as string | undefined
    },
    {
      id: 4,
      employeeName: "Jennifer Davis",
      role: "Developer",
      lastMessage: "I have a question about my Bitcoin payment schedule",
      timestamp: "2 days ago",
      unread: 2,
      priority: "normal",
      avatar: undefined as string | undefined
    }
  ];

  const messages = [
    {
      id: 1,
      senderId: 2,
      senderName: "Mike Chen",
      content: "Hi, I hope you're doing well. I wanted to follow up on my salary adjustment request that I submitted last week.",
      timestamp: "2:30 PM",
      isOwn: false
    },
    {
      id: 2,
      senderId: 1,
      senderName: "You",
      content: "Hi Mike! I received your request and I'm currently reviewing it with the finance team. The promotion to Senior Developer definitely warrants a salary adjustment.",
      timestamp: "2:45 PM",
      isOwn: true
    },
    {
      id: 3,
      senderId: 2,
      senderName: "Mike Chen",
      content: "Thank you for the quick response! I really appreciate it. Do you have an estimated timeline for when this might be processed?",
      timestamp: "2:47 PM",
      isOwn: false
    },
    {
      id: 4,
      senderId: 1,
      senderName: "You",
      content: "I expect to have a decision by Friday this week. The new salary would be effective from the next payroll cycle. I'll keep you updated on the progress.",
      timestamp: "3:15 PM",
      isOwn: true
    },
    {
      id: 5,
      senderId: 2,
      senderName: "Mike Chen",
      content: "Perfect! That timeline works great for me. Thanks again for your help with this process.",
      timestamp: "3:17 PM",
      isOwn: false
    }
  ];

  const selectedConv = conversations.find(c => c.id === selectedConversation);
  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread, 0);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    console.log("Sending message:", newMessage);
    setNewMessage("");
  };

  const sendBroadcast = () => {
    console.log("Sending broadcast message to all employees");
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
                    {conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation.id)}
                        className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                          selectedConversation === conversation.id ? 'bg-orange-50 border-r-2 border-orange-500' : ''
                        }`}
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={conversation.avatar} />
                          <AvatarFallback>
                            {conversation.employeeName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium truncate">{conversation.employeeName}</h3>
                            <div className="flex items-center gap-2">
                              {conversation.priority === 'high' && (
                                <AlertCircle className="w-4 h-4 text-red-500" />
                              )}
                              {conversation.unread > 0 && (
                                <Badge variant="default" className="text-xs">
                                  {conversation.unread}
                                </Badge>
                              )}
                            </div>
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
                  <Input placeholder="Enter message subject..." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <Textarea 
                    placeholder="Enter your company-wide message..."
                    className="min-h-[200px]"
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
                <Button onClick={sendBroadcast} className="w-full">
                  Send to All Employees
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