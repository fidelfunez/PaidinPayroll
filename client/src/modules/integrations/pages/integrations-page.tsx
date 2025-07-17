import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, TestTube, Trash2, Loader2, AlertCircle, Power, PowerOff, Zap, Shield, Globe } from "lucide-react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Mock data for demonstration
const mockIntegrations = [
  {
    id: 1,
    name: "BTCPay Server",
    type: "btcpay",
    status: "connected",
    description: "Bitcoin payment processing",
    url: "https://btcpay.example.com",
    lastSync: "2024-01-15T10:30:00Z",
    invoiceCount: 45,
    totalProcessed: 12500.00,
    config: {
      url: "https://btcpay.example.com",
      apiKey: "***hidden***",
      storeId: "store123"
    }
  },
  {
    id: 2,
    name: "LNbits",
    type: "lnbits",
    status: "connected",
    description: "Lightning Network payments",
    url: "https://lnbits.example.com",
    lastSync: "2024-01-15T09:15:00Z",
    invoiceCount: 23,
    totalProcessed: 8500.00,
    config: {
      url: "https://lnbits.example.com",
      apiKey: "***hidden***"
    }
  },
  {
    id: 3,
    name: "QuickBooks",
    type: "quickbooks",
    status: "disconnected",
    description: "Accounting integration",
    url: "https://quickbooks.intuit.com",
    lastSync: null,
    invoiceCount: 0,
    totalProcessed: 0.00,
    config: null
  },
  {
    id: 4,
    name: "Slack",
    type: "slack",
    status: "error",
    description: "Team notifications",
    url: "https://slack.com",
    lastSync: "2024-01-14T16:45:00Z",
    invoiceCount: 12,
    totalProcessed: 3200.00,
    config: {
      webhookUrl: "https://hooks.slack.com/***",
      channel: "#payments"
    }
  }
];

const integrationTypes = {
  slack: { name: "Slack", icon: "💬", color: "bg-blue-100 text-blue-800" },
  quickbooks: { name: "QuickBooks", icon: "📊", color: "bg-green-100 text-green-800" },
  zapier: { name: "Zapier", icon: "⚡", color: "bg-orange-100 text-orange-800" },
  btcpay: { name: "BTCPay", icon: "₿", color: "bg-yellow-100 text-yellow-800" },
  lnbits: { name: "LNbits", icon: "⚡", color: "bg-purple-100 text-purple-800" }
};

const statusColors = {
  connected: "bg-green-100 text-green-800",
  disconnected: "bg-red-100 text-red-800",
  error: "bg-yellow-100 text-yellow-800",
  connecting: "bg-blue-100 text-blue-800"
};

export default function IntegrationsPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { toast } = useToast();
  const [selectedIntegration, setSelectedIntegration] = useState<number | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);

  // Mock query - replace with real API call
  const { data: integrations = mockIntegrations, isLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => Promise.resolve(mockIntegrations),
  });

  const toggleIntegrationMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      // Mock API call
      return Promise.resolve({ id, status: status === 'connected' ? 'disconnected' : 'connected' });
    },
    onSuccess: (data) => {
      toast({
        title: `Integration ${data.status === 'connected' ? 'connected' : 'disconnected'}`,
        description: `The integration has been ${data.status === 'connected' ? 'activated' : 'deactivated'}.`,
      });
    },
    onError: () => {
      toast({
        title: "Connection failed",
        description: "Failed to toggle the integration. Please try again.",
        variant: "destructive",
      });
    },
  });

  const testIntegrationMutation = useMutation({
    mutationFn: async (id: number) => {
      // Mock API call
      return Promise.resolve({ success: true });
    },
    onSuccess: () => {
      toast({
        title: "Test successful",
        description: "The integration is working correctly.",
      });
      setShowTestModal(false);
    },
    onError: () => {
      toast({
        title: "Test failed",
        description: "The integration test failed. Please check your configuration.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getIntegrationIcon = (type: string) => {
    return integrationTypes[type as keyof typeof integrationTypes]?.icon || "🔗";
  };

  const getIntegrationName = (type: string) => {
    return integrationTypes[type as keyof typeof integrationTypes]?.name || type;
  };

  const formatCurrency = (amount: number) => 
    `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
          title="Integrations" 
          subtitle="Manage Bitcoin payment and business integrations"
        />
        
        <main className="p-4 lg:p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Integrations</p>
                    <p className="text-2xl font-bold">{integrations.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Globe className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Connected</p>
                    <p className="text-2xl font-bold text-green-600">
                      {integrations.filter(i => i.status === 'connected').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Power className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Processed</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(integrations.reduce((sum, i) => sum + i.totalProcessed, 0))}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-bitcoin-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl font-bold text-bitcoin-600">₿</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Invoices</p>
                    <p className="text-2xl font-bold">
                      {integrations.reduce((sum, i) => sum + i.invoiceCount, 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
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
                    <span className="text-2xl">₿</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Add BTCPay</h3>
                    <p className="text-sm text-muted-foreground">Connect your BTCPay Server</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Add LNbits</h3>
                    <p className="text-sm text-muted-foreground">Connect Lightning payments</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Security Check</h3>
                    <p className="text-sm text-muted-foreground">Verify integration security</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Integrations List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Integrations</CardTitle>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Integration
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrations.map((integration) => (
                  <div key={integration.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-2xl">
                          {getIntegrationIcon(integration.type)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-3 mb-1">
                            <h3 className="font-semibold text-lg">{integration.name}</h3>
                            {getStatusBadge(integration.status)}
                          </div>
                          <p className="text-muted-foreground">{integration.description}</p>
                          <p className="text-sm text-muted-foreground">{integration.url}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Last Sync</p>
                        <p className="font-semibold">
                          {integration.lastSync 
                            ? new Date(integration.lastSync).toLocaleDateString()
                            : 'Never'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Invoices</p>
                        <p className="font-semibold">{integration.invoiceCount}</p>
                      </div>
                      <div className="text-center p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Processed</p>
                        <p className="font-semibold">{formatCurrency(integration.totalProcessed)}</p>
                      </div>
                      <div className="text-center p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Type</p>
                        <p className="font-semibold">{getIntegrationName(integration.type)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testIntegrationMutation.mutate(integration.id)}
                          disabled={testIntegrationMutation.isPending}
                        >
                          <TestTube className="w-4 h-4 mr-2" />
                          Test Connection
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant={integration.status === 'connected' ? 'destructive' : 'default'}
                          size="sm"
                          onClick={() => toggleIntegrationMutation.mutate({
                            id: integration.id,
                            status: integration.status
                          })}
                          disabled={toggleIntegrationMutation.isPending}
                        >
                          {integration.status === 'connected' ? (
                            <>
                              <PowerOff className="w-4 h-4 mr-2" />
                              Disconnect
                            </>
                          ) : (
                            <>
                              <Power className="w-4 h-4 mr-2" />
                              Connect
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Available Integrations */}
          <Card>
            <CardHeader>
              <CardTitle>Available Integrations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(integrationTypes).map(([type, config]) => {
                  const isConnected = integrations.some(i => i.type === type && i.status === 'connected');
                  return (
                    <Card key={type} className={`hover:shadow-md transition-shadow cursor-pointer ${isConnected ? 'border-green-200 bg-green-50' : ''}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${config.color}`}>
                            {config.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{config.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {isConnected ? 'Connected' : 'Not connected'}
                            </p>
                          </div>
                          <Button size="sm" variant={isConnected ? 'outline' : 'default'}>
                            {isConnected ? 'Manage' : 'Connect'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    </div>
  );
}