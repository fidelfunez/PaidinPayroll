import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { useBtcRate } from "@/hooks/use-btc-rate-context";
import {
  Layers,
  Plus,
  Settings,
  CheckCircle,
  X,
  ExternalLink,
  Zap,
  Database,
  Mail,
  Calendar,
  FileText,
  CreditCard,
  Shield,
  Globe,
  Clock
} from "lucide-react";
import { useState } from "react";

export default function IntegrationsPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { rate: btcRate } = useBtcRate();
  const [activeTab, setActiveTab] = useState("available");

  const availableIntegrations = [
    {
      id: "quickbooks",
      name: "QuickBooks",
      description: "Sync payroll and expense data with QuickBooks accounting software",
      category: "Accounting",
      icon: FileText,
      color: "bg-blue-500",
      status: "available",
      features: ["Payroll sync", "Expense tracking", "Tax reporting"]
    },
    {
      id: "xero",
      name: "Xero",
      description: "Connect with Xero for comprehensive accounting and financial management",
      category: "Accounting",
      icon: FileText,
      color: "bg-green-500",
      status: "available",
      features: ["Real-time sync", "Multi-currency", "Reporting"]
    },
    {
      id: "slack",
      name: "Slack",
      description: "Get payroll notifications and updates directly in your Slack workspace",
      category: "Communication",
      icon: Mail,
      color: "bg-purple-500",
      status: "available",
      features: ["Payroll alerts", "Team notifications", "Status updates"]
    },
    {
      id: "google-calendar",
      name: "Google Calendar",
      description: "Sync payroll schedules and important dates with Google Calendar",
      category: "Productivity",
      icon: Calendar,
      color: "bg-red-500",
      status: "available",
      features: ["Payroll reminders", "Deadline tracking", "Event sync"]
    },
    {
      id: "stripe",
      name: "Stripe",
      description: "Accept traditional payments alongside Bitcoin for comprehensive payment processing",
      category: "Payments",
      icon: CreditCard,
      color: "bg-indigo-500",
      status: "available",
      features: ["Card payments", "ACH transfers", "International payments"]
    },
    {
      id: "zapier",
      name: "Zapier",
      description: "Connect PaidIn with 5000+ apps through Zapier automation platform",
      category: "Automation",
      icon: Zap,
      color: "bg-orange-500",
      status: "available",
      features: ["Workflow automation", "Data sync", "Custom triggers"]
    }
  ];

  const activeIntegrations = [
    {
      id: "quickbooks",
      name: "QuickBooks",
      description: "Connected and syncing payroll data",
      icon: FileText,
      color: "bg-blue-500",
      status: "connected",
      lastSync: "2024-01-15T10:30:00Z",
      syncStatus: "success"
    }
  ];

  const categories = [
    { id: "all", name: "All Categories", count: availableIntegrations.length },
    { id: "accounting", name: "Accounting", count: availableIntegrations.filter(i => i.category === "Accounting").length },
    { id: "communication", name: "Communication", count: availableIntegrations.filter(i => i.category === "Communication").length },
    { id: "productivity", name: "Productivity", count: availableIntegrations.filter(i => i.category === "Productivity").length },
    { id: "payments", name: "Payments", count: availableIntegrations.filter(i => i.category === "Payments").length },
    { id: "automation", name: "Automation", count: availableIntegrations.filter(i => i.category === "Automation").length }
  ];

  const tabs = [
    { id: "available", label: "Available", count: availableIntegrations.length },
    { id: "active", label: "Active", count: activeIntegrations.length },
    { id: "settings", label: "Settings" }
  ];

  const handleConnect = (integrationId: string) => {
    // Simulate connection process
    console.log(`Connecting to ${integrationId}...`);
  };

  const handleDisconnect = (integrationId: string) => {
    // Simulate disconnection process
    console.log(`Disconnecting from ${integrationId}...`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-background to-gray-50 flex">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16 lg:ml-16' : 'ml-16 lg:ml-64'}`}>
        <Header
          title="Integrations"
          subtitle="Connect PaidIn with your favorite tools and services"
        />

        <main className="p-4 lg:p-6 space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Integrations</CardTitle>
                <Layers className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeIntegrations.length}</div>
                <p className="text-xs text-muted-foreground">Connected services</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available</CardTitle>
                <Plus className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{availableIntegrations.length}</div>
                <p className="text-xs text-muted-foreground">Ready to connect</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2 min ago</div>
                <p className="text-xs text-muted-foreground">QuickBooks</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Integration Management</CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Integration
                </Button>
              </div>
              <div className="flex space-x-1 border-b">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-orange-500 text-orange-600"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                    {tab.count !== undefined && (
                      <Badge variant="secondary" className="ml-2">
                        {tab.count}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {activeTab === "available" && (
                <div className="space-y-6">
                  {/* Categories */}
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Badge
                        key={category.id}
                        variant="outline"
                        className="cursor-pointer hover:bg-slate-100"
                      >
                        {category.name} ({category.count})
                      </Badge>
                    ))}
                  </div>

                  {/* Available Integrations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableIntegrations.map((integration) => {
                      const Icon = integration.icon;
                      return (
                        <Card key={integration.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`w-10 h-10 ${integration.color} rounded-lg flex items-center justify-center`}>
                                <Icon className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <h3 className="font-semibold">{integration.name}</h3>
                                <p className="text-xs text-muted-foreground">{integration.category}</p>
                              </div>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-4">{integration.description}</p>
                            
                            <div className="space-y-2 mb-4">
                              {integration.features.map((feature, index) => (
                                <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                  <span>{feature}</span>
                                </div>
                              ))}
                            </div>

                            <Button 
                              className="w-full" 
                              onClick={() => handleConnect(integration.id)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Connect
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === "active" && (
                <div className="space-y-4">
                  {activeIntegrations.length === 0 ? (
                    <div className="text-center py-8">
                      <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Active Integrations</h3>
                      <p className="text-muted-foreground mb-4">
                        Connect your first integration to get started
                      </p>
                      <Button onClick={() => setActiveTab("available")}>
                        <Plus className="h-4 w-4 mr-2" />
                        Browse Integrations
                      </Button>
                    </div>
                  ) : (
                    activeIntegrations.map((integration) => {
                      const Icon = integration.icon;
                      return (
                        <Card key={integration.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 ${integration.color} rounded-lg flex items-center justify-center`}>
                                  <Icon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <h3 className="font-semibold">{integration.name}</h3>
                                  <p className="text-sm text-muted-foreground">{integration.description}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge className="bg-green-100 text-green-800">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Connected
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      Last sync: {new Date(integration.lastSync).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm">
                                  <Settings className="h-4 w-4 mr-2" />
                                  Settings
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleDisconnect(integration.id)}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Disconnect
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === "settings" && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Integration Settings</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Auto-sync</h4>
                          <p className="text-sm text-muted-foreground">
                            Automatically sync data with connected integrations
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Sync Frequency</h4>
                          <p className="text-sm text-muted-foreground">
                            How often to sync data with integrations
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Error Notifications</h4>
                          <p className="text-sm text-muted-foreground">
                            Get notified when integration syncs fail
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-medium mb-2">API Access</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Access PaidIn data programmatically through our REST API
                    </p>
                    <Button variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View API Documentation
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
