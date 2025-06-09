import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, ExternalLink, Key, Zap } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";

export default function ApiDocumentationPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();

  const endpoints = [
    {
      method: "GET",
      path: "/api/user",
      description: "Get current user information",
      auth: true
    },
    {
      method: "GET",
      path: "/api/dashboard/stats",
      description: "Get dashboard statistics",
      auth: true
    },
    {
      method: "GET",
      path: "/api/payroll",
      description: "Get payroll payments",
      auth: true
    },
    {
      method: "POST",
      path: "/api/payroll",
      description: "Create new payroll payment",
      auth: true
    },
    {
      method: "GET",
      path: "/api/expenses",
      description: "Get expense reimbursements",
      auth: true
    },
    {
      method: "POST",
      path: "/api/expenses",
      description: "Submit expense reimbursement",
      auth: true
    },
    {
      method: "GET",
      path: "/api/btc-rate",
      description: "Get current Bitcoin rate",
      auth: true
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <Header 
          title="API Documentation" 
          subtitle="Integrate with the Bitcoin payroll platform"
        />
        
        <main className="p-4 lg:p-6 space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Code className="w-6 h-6 text-orange-500" />
                API Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">
                The PaidIn API allows you to programmatically manage Bitcoin payroll operations, 
                access financial data, and integrate with your existing systems.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Zap className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                  <h3 className="font-medium">RESTful API</h3>
                  <p className="text-sm text-slate-600">Standard HTTP methods</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Key className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                  <h3 className="font-medium">Secure Authentication</h3>
                  <p className="text-sm text-slate-600">Session-based auth</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Code className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                  <h3 className="font-medium">JSON Responses</h3>
                  <p className="text-sm text-slate-600">Structured data format</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="endpoints" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
              <TabsTrigger value="authentication">Authentication</TabsTrigger>
              <TabsTrigger value="examples">Examples</TabsTrigger>
            </TabsList>

            <TabsContent value="endpoints" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Available Endpoints</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {endpoints.map((endpoint, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center gap-3">
                          <Badge variant={endpoint.method === 'GET' ? 'secondary' : 'default'}>
                            {endpoint.method}
                          </Badge>
                          <code className="text-sm bg-slate-100 px-2 py-1 rounded">
                            {endpoint.path}
                          </code>
                          {endpoint.auth && <Badge variant="outline">Auth Required</Badge>}
                        </div>
                        <p className="text-sm text-slate-600">{endpoint.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="authentication" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Authentication</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Session-based Authentication</h3>
                    <p className="text-slate-600 mb-4">
                      All API requests require authentication via session cookies. 
                      First authenticate by logging in through the web interface.
                    </p>
                    
                    <div className="bg-slate-100 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Login Endpoint</h4>
                      <code className="block text-sm">
                        POST /api/login<br/>
                        Content-Type: application/json<br/><br/>
                        {`{
  "username": "your_username",
  "password": "your_password"
}`}
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="examples" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Code Examples</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">Get Dashboard Stats</h3>
                    <div className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
                      <code className="text-sm whitespace-pre">{`// JavaScript/Node.js
const response = await fetch('/api/dashboard/stats', {
  method: 'GET',
  credentials: 'include' // Include session cookies
});

const stats = await response.json();
console.log(stats);`}</code>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Submit Expense</h3>
                    <div className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
                      <code className="text-sm whitespace-pre">{`// JavaScript/Node.js
const expense = {
  description: "Business travel",
  amountUsd: "250.00",
  category: "travel",
  receiptUrl: "https://example.com/receipt.pdf"
};

const response = await fetch('/api/expenses', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify(expense)
});

const result = await response.json();`}</code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* SDK Section */}
          <Card>
            <CardHeader>
              <CardTitle>SDKs and Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">
                Official SDKs and tools to help you integrate with the PaidIn API more easily.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
                  <ExternalLink className="w-6 h-6 text-orange-500" />
                  <span className="font-medium">JavaScript SDK</span>
                  <span className="text-sm text-slate-600">Coming soon</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
                  <ExternalLink className="w-6 h-6 text-orange-500" />
                  <span className="font-medium">Python SDK</span>
                  <span className="text-sm text-slate-600">Coming soon</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}