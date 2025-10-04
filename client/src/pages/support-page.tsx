import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { useBtcRate } from "@/hooks/use-btc-rate-context";
import { useToast } from "@/hooks/use-toast";
import {
  MessageCircle,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  Send,
  Headphones,
  FileText,
  Video,
  Calendar,
  MapPin,
  Globe,
  BookOpen,
  HelpCircle,
  FileQuestion
} from "lucide-react";
import { useState } from "react";

export default function SupportPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { rate: btcRate } = useBtcRate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    subject: "",
    category: "",
    priority: "medium",
    message: "",
    email: user?.email || ""
  });

  const supportChannels = [
    {
      id: "chat",
      title: "Live Chat",
      description: "Get instant help from our support team",
      icon: MessageCircle,
      availability: "Available now",
      responseTime: "Instant",
      color: "bg-blue-500",
      available: true
    },
    {
      id: "email",
      title: "Email Support",
      description: "Send us a detailed message and we'll respond quickly",
      icon: Mail,
      availability: "24/7",
      responseTime: "Within 2 hours",
      color: "bg-green-500",
      available: true
    },
    {
      id: "phone",
      title: "Phone Support",
      description: "Speak directly with our support team",
      icon: Phone,
      availability: "Mon-Fri 9AM-6PM EST",
      responseTime: "Immediate",
      color: "bg-orange-500",
      available: true
    },
    {
      id: "video",
      title: "Video Call",
      description: "Schedule a screen sharing session",
      icon: Video,
      availability: "By appointment",
      responseTime: "Same day",
      color: "bg-purple-500",
      available: true
    }
  ];

  const categories = [
    "Account & Billing",
    "Bitcoin & Payments",
    "Payroll & Employees",
    "Technical Issues",
    "Feature Request",
    "Security & Compliance",
    "Onboarding & Setup",
    "Other"
  ];

  const priorities = [
    { value: "low", label: "Low", description: "General questions" },
    { value: "medium", label: "Medium", description: "Standard support" },
    { value: "high", label: "High", description: "Urgent issues" },
    { value: "critical", label: "Critical", description: "System down" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Support ticket created",
        description: "We'll get back to you within 2 hours during business hours."
      });

      // Reset form
      setFormData({
        subject: "",
        category: "",
        priority: "medium",
        message: "",
        email: user?.email || ""
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create support ticket. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16 lg:ml-16' : 'ml-16 lg:ml-64'}`}>
        <Header
          title="Support"
          subtitle="Get help from our support team"
        />

        <main className="p-4 lg:p-6 space-y-6">
          {/* Support Channels */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {supportChannels.map((channel) => {
              const Icon = channel.icon;
              return (
                <Card key={channel.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 ${channel.color} rounded-lg flex items-center justify-center`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{channel.title}</h3>
                        <p className="text-xs text-muted-foreground">{channel.availability}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{channel.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {channel.responseTime}
                      </span>
                      <Button size="sm" variant="outline" disabled={!channel.available}>
                        {channel.available ? "Start" : "Unavailable"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send us a Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange("subject", e.target.value)}
                    placeholder="Brief description of your issue"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          <div>
                            <div className="font-medium">{priority.label}</div>
                            <div className="text-xs text-muted-foreground">{priority.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => handleInputChange("message", e.target.value)}
                    placeholder="Please provide as much detail as possible about your issue..."
                    rows={6}
                    required
                  />
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Headphones className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">support@paidin.io</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Business Hours</p>
                    <p className="text-sm text-muted-foreground">Mon-Fri 9AM-6PM EST</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">Remote Support</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Bitcoin Education
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Getting Started Guide
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileQuestion className="h-4 w-4 mr-2" />
                  FAQ
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Globe className="h-4 w-4 mr-2" />
                  Documentation
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">All systems operational</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Last updated: {new Date().toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
