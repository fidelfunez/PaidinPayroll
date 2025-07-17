import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Clock, CheckCircle, Loader2, AlertCircle, Play, Pause, Settings, Target } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

// Mock data for demonstration
const mockOnboardingFlows = [
  {
    id: 1,
    name: "New Employee Onboarding",
    description: "Complete onboarding process for new hires",
    status: "active",
    totalTasks: 8,
    completedTasks: 6,
    participants: 3,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-15"
  },
  {
    id: 2,
    name: "Bitcoin Payroll Setup",
    description: "Configure Bitcoin payroll for employees",
    status: "completed",
    totalTasks: 5,
    completedTasks: 5,
    participants: 2,
    createdAt: "2024-01-05",
    updatedAt: "2024-01-12"
  },
  {
    id: 3,
    name: "BTCPay Integration",
    description: "Set up BTCPay Server for payments",
    status: "draft",
    totalTasks: 4,
    completedTasks: 1,
    participants: 1,
    createdAt: "2024-01-10",
    updatedAt: "2024-01-10"
  }
];

const statusColors = {
  active: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  draft: "bg-gray-100 text-gray-800",
  paused: "bg-yellow-100 text-yellow-800"
};

export default function OnboardingPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { toast } = useToast();
  const [selectedFlow, setSelectedFlow] = useState<number | null>(null);

  // Mock query - replace with real API call
  const { data: onboardingFlows = mockOnboardingFlows, isLoading } = useQuery({
    queryKey: ['onboarding-flows'],
    queryFn: () => Promise.resolve(mockOnboardingFlows),
  });

  const getStatusBadge = (status: string) => {
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getProgressPercentage = (completed: number, total: number) => {
    return total > 0 ? (completed / total) * 100 : 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16 lg:ml-16' : 'ml-16 lg:ml-64'}`}>
        <Header 
          title="Onboarding" 
          subtitle="Manage employee onboarding flows and progress"
        />
        
        <main className="p-4 lg:p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Flows</p>
                    <p className="text-2xl font-bold">{onboardingFlows.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold text-green-600">
                      {onboardingFlows.filter(f => f.status === 'active').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Play className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {onboardingFlows.filter(f => f.status === 'completed').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Participants</p>
                    <p className="text-2xl font-bold">
                      {onboardingFlows.reduce((sum, flow) => sum + flow.participants, 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-bitcoin-100 rounded-lg flex items-center justify-center">
                    <Plus className="w-6 h-6 text-bitcoin-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Create New Flow</h3>
                    <p className="text-sm text-muted-foreground">Set up a new onboarding process</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Add Participants</h3>
                    <p className="text-sm text-muted-foreground">Invite employees to flows</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Settings className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Templates</h3>
                    <p className="text-sm text-muted-foreground">Use pre-built onboarding templates</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Onboarding Flows */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Onboarding Flows</CardTitle>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Flow
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {onboardingFlows.map((flow) => (
                  <div key={flow.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-lg">{flow.name}</h3>
                          {getStatusBadge(flow.status)}
                        </div>
                        <p className="text-muted-foreground">{flow.description}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Progress</p>
                          <p className="font-semibold">
                            {flow.completedTasks}/{flow.totalTasks} tasks
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Participants</p>
                          <p className="font-semibold">{flow.participants}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Task Completion</span>
                        <span>{Math.round(getProgressPercentage(flow.completedTasks, flow.totalTasks))}%</span>
                      </div>
                      <Progress value={getProgressPercentage(flow.completedTasks, flow.totalTasks)} className="h-2" />
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Created: {new Date(flow.createdAt).toLocaleDateString()}</span>
                        <span>Updated: {new Date(flow.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Users className="w-4 h-4 mr-2" />
                          View Participants
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button size="sm">
                          <Play className="w-4 h-4 mr-2" />
                          Continue
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-3 bg-green-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Bitcoin Payroll Setup completed</p>
                    <p className="text-sm text-muted-foreground">All tasks finished • 2 participants</p>
                  </div>
                  <span className="text-sm text-muted-foreground">2 hours ago</span>
                </div>
                
                <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">New participant added to New Employee Onboarding</p>
                    <p className="text-sm text-muted-foreground">John Doe joined the flow</p>
                  </div>
                  <span className="text-sm text-muted-foreground">1 day ago</span>
                </div>
                
                <div className="flex items-center space-x-4 p-3 bg-yellow-50 rounded-lg">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">BTCPay Integration paused</p>
                    <p className="text-sm text-muted-foreground">Waiting for server configuration</p>
                  </div>
                  <span className="text-sm text-muted-foreground">3 days ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    </div>
  );
}