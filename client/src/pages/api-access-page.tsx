import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { useBtcRate } from "@/hooks/use-btc-rate-context";
import {
  Zap,
  Key,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  ExternalLink,
  Code,
  Database,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useState } from "react";

export default function APIAccessPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { rate: btcRate } = useBtcRate();
  const [showApiKey, setShowApiKey] = useState(false);

  const apiKeys = [
    {
      id: 1,
      name: "Production API Key",
      key: "pk_live_51H...",
      created: "2024-01-10T10:30:00Z",
      lastUsed: "2024-01-15T14:22:00Z",
      status: "active"
    },
    {
      id: 2,
      name: "Development Key",
      key: "pk_test_51H...",
      created: "2024-01-08T09:15:00Z",
      lastUsed: "2024-01-12T16:45:00Z",
      status: "active"
    }
  ];

  const endpoints = [
    {
      method: "GET",
      path: "/api/employees",
      description: "List all employees"
    },
    {
      method: "POST",
      path: "/api/payroll",
      description: "Create payroll payment"
    },
    {
      method: "GET",
      path: "/api/wallet/balance",
      description: "Get wallet balance"
    },
    {
      method: "POST",
      path: "/api/wallet/send",
      description: "Send Bitcoin payment"
    }
  ];

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET": return "bg-green-100 text-green-800";
      case "POST": return "bg-blue-100 text-blue-800";
      case "PUT": return "bg-yellow-100 text-yellow-800";
      case "DELETE": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-background to-gray-50 flex">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16 lg:ml-16' : 'ml-16 lg:ml-64'}`}>
        <Header
          title="API Access"
          subtitle="Manage your API keys and access PaidIn programmatically"
        />

        <main className="p-4 lg:p-6 space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active API Keys</CardTitle>
                <Key className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{apiKeys.length}</div>
                <p className="text-xs text-muted-foreground">Keys in use</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Calls Today</CardTitle>
                <Zap className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,247</div>
                <p className="text-xs text-muted-foreground">Requests made</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rate Limit</CardTitle>
                <Clock className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">10,000</div>
                <p className="text-xs text-muted-foreground">Calls per day</p>
              </CardContent>
            </Card>
          </div>

          {/* API Keys Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>API Keys</CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Key
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiKeys.map((key) => (
                  <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Key className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{key.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <code className="font-mono">{key.key}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            {showApiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {key.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Last used: {new Date(key.lastUsed).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Shield className="h-4 w-4 mr-2" />
                        Permissions
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* API Documentation */}
          <Card>
            <CardHeader>
              <CardTitle>API Endpoints</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {endpoints.map((endpoint, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Badge className={getMethodColor(endpoint.method)}>
                      {endpoint.method}
                    </Badge>
                    <code className="flex-1 font-mono text-sm bg-slate-100 px-2 py-1 rounded">
                      {endpoint.path}
                    </code>
                    <span className="text-sm text-muted-foreground">{endpoint.description}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Full API Documentation</h4>
                    <p className="text-sm text-muted-foreground">
                      Complete reference with examples and authentication details
                    </p>
                  </div>
                  <Button variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Docs
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Start */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Start</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-medium mb-2">1. Get Your API Key</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Create an API key from the section above
                  </p>
                  <div className="bg-slate-900 text-green-400 p-3 rounded font-mono text-sm">
                    <div>curl -H "Authorization: Bearer YOUR_API_KEY" \</div>
                    <div>     https://api.paidin.io/v1/employees</div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-medium mb-2">2. Make Your First Request</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Test the API with a simple request
                  </p>
                  <div className="bg-slate-900 text-green-400 p-3 rounded font-mono text-sm">
                    <div>{"{"}</div>
                    <div>  "employees": [</div>
                    <div>    {"{"}</div>
                    <div>      "id": 1,</div>
                    <div>      "name": "John Doe",</div>
                    <div>      "email": "john@company.com"</div>
                    <div>    {"}"}</div>
                    <div>  ]</div>
                    <div>{"}"}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
