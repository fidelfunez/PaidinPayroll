import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, TestTube, Trash2, Loader2, AlertCircle, Power, PowerOff } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { integrationsApi, type Integration } from "@/lib/api/integrations-api";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const integrationTypes = {
  slack: { name: "Slack", icon: "", color: "bg-blue-100 text-blue-800" },
  quickbooks: { name: "QuickBooks", icon: "", color: "bg-green-100 text-green-800" },
  zapier: { name: "Zapier", icon: "⚡", color: "bg-orange-100 text-orange-800" },
  btcpay: { name: "BTCPay", icon: "₿", color: "bg-yellow-100 text-yellow-800" },
  lnbits: { name: "LNbits", icon: "⚡", color: "bg-purple-100 text-purple-800" }
};

const statusColors = {
  connected: "bg-green-100 text-green-800",
  disconnected: "bg-red-100 text-red-800",
  error: "bg-yellow-100 text-yellow-800"
};

export default function IntegrationsPage() {
  const { user } = useAuth();
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testingIntegration, setTestingIntegration] = useState<string | null>(null);

  // Fetch integrations with React Query
  const {
    data: integrations = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['integrations'],
    queryFn: integrationsApi.getIntegrations,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Toggle integration mutation
  const toggleIntegrationMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      integrationsApi.toggleIntegration(id, isActive),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast({
        title: data.isActive ? "Integration activated" : "Integration deactivated",
        description: `${data.name} has been ${data.isActive ? 'activated' : 'deactivated'} successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to toggle integration. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Test integration mutation
  const testIntegrationMutation = useMutation({
    mutationFn: integrationsApi.testIntegration,
    onSuccess: (data) => {
      toast({
        title: data.success ? "Test successful" : "Test failed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: (error) => {
      toast({
        title: "Test failed",
        description: error.message || "Failed to test integration. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete integration mutation
  const deleteIntegrationMutation = useMutation({
    mutationFn: integrationsApi.deleteIntegration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast({
        title: "Integration deleted",
        description: "The integration has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete integration. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleToggleIntegration = async (integration: Integration) => {
    toggleIntegrationMutation.mutate({
      id: integration.id,
      isActive: !integration.isActive
    });
  };

  const handleTestIntegration = async (integrationId: number) => {
    setTestingIntegration(integrationId.toString());
    testIntegrationMutation.mutate(integrationId, {
      onSettled: () => {
        setTestingIntegration(null);
      }
    });
  };

  const handleDeleteIntegration = async (integrationId: number) => {
    if (!confirm('Are you sure you want to delete this integration?')) return;
    deleteIntegrationMutation.mutate(integrationId);
  };

  // Calculate stats
  const stats = {
    active: integrations.filter(integration => integration.isActive).length,
    inactive: integrations.filter(integration => !integration.isActive).length,
    total: integrations.length,
    last24hSyncs: integrations.filter(integration => 
      integration.lastSync && 
      new Date(integration.lastSync) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length
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
                      <h3 className="text-lg font-semibold text-red-800">Error Loading Integrations</h3>
                      <p className="text-red-600">Failed to load integrations. Please try again.</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => refetch()} 
                    className="mt-4"
                    variant="outline"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      "Retry"
                    )}
                  </Button>
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
                <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
                <p className="text-gray-600">Connect your favorite tools and services</p>
              </div>
              <Link to="/create-integration">
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Integration
                </Button>
              </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                  <div className="text-sm text-gray-600">Active Integrations</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
                  <div className="text-sm text-gray-600">Inactive</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-sm text-gray-600">Total Integrations</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-yellow-600">{stats.last24hSyncs}</div>
                  <div className="text-sm text-gray-600">Last 24h Syncs</div>
                </CardContent>
              </Card>
            </div>

            {/* Integrations Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading integrations...</span>
              </div>
            ) : integrations.length === 0 ? (
              <div className="text-center py-8">
                <div className="mb-4">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Plus className="h-8 w-8 text-gray-400" />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No integrations yet</h3>
                <p className="text-gray-500 mb-4">Connect your first integration to get started</p>
                <Link to="/create-integration">
                  <Button>Add Your First Integration</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {integrations.map((integration) => (
                  <Card key={integration.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${integrationTypes[integration.type].color}`}>
                            <span className="text-lg">{integrationTypes[integration.type].icon}</span>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{integration.name}</h3>
                            <p className="text-sm text-gray-500">{integrationTypes[integration.type].name}</p>
                          </div>
                        </div>
                        <Badge className={statusColors[integration.status]}>
                          {integration.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Status:</span>
                          <span className={integration.isActive ? "text-green-600" : "text-gray-500"}>
                            {integration.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        {integration.lastSync && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Last sync:</span>
                            <span className="text-gray-900">
                              {new Date(integration.lastSync).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleIntegration(integration)}
                            disabled={toggleIntegrationMutation.isPending}
                            className="flex-1"
                          >
                            {toggleIntegrationMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : integration.isActive ? (
                              <>
                                <PowerOff className="h-4 w-4 mr-1" />
                                Disable
                              </>
                            ) : (
                              <>
                                <Power className="h-4 w-4 mr-1" />
                                Enable
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestIntegration(integration.id)}
                            disabled={testingIntegration === integration.id.toString()}
                          >
                            {testingIntegration === integration.id.toString() ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <TestTube className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteIntegration(integration.id)}
                            disabled={deleteIntegrationMutation.isPending}
                          >
                            {deleteIntegrationMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}