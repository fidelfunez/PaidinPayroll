import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Clock, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { onboardingApi, type OnboardingFlow, type OnboardingProgress } from "@/lib/api/onboarding-api";

export default function OnboardingPage() {
  const { user } = useAuth();
  const { isSidebarOpen, toggleSidebar } = useSidebar();

  // Fetch onboarding flows
  const {
    data: flows = [],
    isLoading: flowsLoading,
    error: flowsError
  } = useQuery({
    queryKey: ['onboarding-flows'],
    queryFn: onboardingApi.getOnboardingFlows,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch onboarding progress
  const {
    data: progress = [],
    isLoading: progressLoading,
    error: progressError
  } = useQuery({
    queryKey: ['onboarding-progress'],
    queryFn: onboardingApi.getOnboardingProgress,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const isLoading = flowsLoading || progressLoading;
  const error = flowsError || progressError;

  // Calculate stats
  const stats = {
    totalFlows: flows.length,
    activeProgress: progress.filter(p => p.progress < 100).length,
    completedToday: progress.filter(p => 
      p.progress === 100 && 
      new Date(p.startDate).toDateString() === new Date().toDateString()
    ).length,
    averageProgress: progress.length > 0 
      ? Math.round(progress.reduce((sum, p) => sum + p.progress, 0) / progress.length)
      : 0
  };

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onMenuClick={toggleSidebar} />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-red-800">Error Loading Onboarding Data</h3>
                      <p className="text-red-600">Failed to load onboarding information. Please try again.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Onboarding</h1>
                <p className="text-gray-600">Manage employee onboarding flows and progress</p>
              </div>
              <Link to="/onboarding/create">
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Flow
                </Button>
              </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalFlows}</div>
                  <div className="text-sm text-gray-600">Total Flows</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-yellow-600">{stats.activeProgress}</div>
                  <div className="text-sm text-gray-600">Active Onboarding</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">{stats.completedToday}</div>
                  <div className="text-sm text-gray-600">Completed Today</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-purple-600">{stats.averageProgress}%</div>
                  <div className="text-sm text-gray-600">Avg Progress</div>
                </CardContent>
              </Card>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading onboarding data...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Onboarding Flows */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Onboarding Flows</CardTitle>
                      <Link to="/onboarding/create">
                        <Button size="sm">Create New</Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {flows.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">No onboarding flows created yet</p>
                        <Link to="/onboarding/create">
                          <Button>Create Your First Flow</Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {flows.map((flow) => (
                          <div key={flow.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-medium text-gray-900">{flow.name}</h3>
                                <p className="text-sm text-gray-500">{flow.description}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline">{flow.department}</Badge>
                                  <span className="text-sm text-gray-500">
                                    {flow.tasks.length} tasks
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Link to={`/onboarding/${flow.id}/edit`}>
                                  <Button variant="outline" size="sm">
                                    Edit
                                  </Button>
                                </Link>
                                <Link to={`/onboarding/progress?flowId=${flow.id}`}>
                                  <Button variant="outline" size="sm">
                                    View Progress
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Active Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle>Active Onboarding</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {progress.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No active onboarding progress</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {progress.slice(0, 5).map((item) => (
                          <div key={item.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-medium text-gray-900">{item.employeeName}</h3>
                                <p className="text-sm text-gray-500">
                                  Started {new Date(item.startDate).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-semibold text-blue-600">
                                  {item.progress}%
                                </div>
                                <div className="text-sm text-gray-500">
                                  {item.tasks.filter(t => t.status === 'completed').length} / {item.tasks.length} tasks
                                </div>
                              </div>
                            </div>
                            <div className="mt-3">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${item.progress}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="mt-3">
                              <Link to={`/onboarding/progress/${item.id}`}>
                                <Button variant="outline" size="sm">
                                  View Details
                                </Button>
                              </Link>
                            </div>
                          </div>
                        ))}
                        {progress.length > 5 && (
                          <div className="text-center">
                            <Link to="/onboarding/progress">
                              <Button variant="outline" size="sm">
                                View All ({progress.length})
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}