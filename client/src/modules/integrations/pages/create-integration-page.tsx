import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const integrationTypes = [
  { value: "slack", label: "Slack", description: "Send notifications to Slack channels" },
  { value: "quickbooks", label: "QuickBooks", description: "Sync invoices and payments" },
  { value: "zapier", label: "Zapier", description: "Automate workflows with Zapier" },
  { value: "btcpay", label: "BTCPay Server", description: "Accept Bitcoin payments" },
  { value: "lnbits", label: "LNbits", description: "Lightning Network payments" }
];

export default function CreateIntegrationPage() {
  const { user } = useAuth();
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const [selectedType, setSelectedType] = useState("");

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <Link to="/integrations">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Integrations
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Add Integration</h1>
                <p className="text-gray-600">Connect a new service to PaidIn</p>
              </div>
            </div>

            <form className="space-y-6">
              {/* Integration Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Integration Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="type">Select Integration Type</Label>
                      <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose an integration type" />
                        </SelectTrigger>
                        <SelectContent>
                          {integrationTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-sm text-gray-500">{type.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Integration Name</Label>
                    <Input id="name" placeholder="e.g., Production Slack" />
                  </div>

                  {selectedType === "slack" && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="webhook">Slack Webhook URL</Label>
                        <Input id="webhook" placeholder="https://hooks.slack.com/services/..." />
                      </div>
                      <div>
                        <Label htmlFor="channel">Default Channel</Label>
                        <Input id="channel" placeholder="#paidin-notifications" />
                      </div>
                    </div>
                  )}

                  {selectedType === "quickbooks" && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="clientId">QuickBooks Client ID</Label>
                        <Input id="clientId" placeholder="Enter your QuickBooks Client ID" />
                      </div>
                      <div>
                        <Label htmlFor="clientSecret">QuickBooks Client Secret</Label>
                        <Input id="clientSecret" type="password" placeholder="Enter your QuickBooks Client Secret" />
                      </div>
                      <div>
                        <Label htmlFor="realmId">QuickBooks Realm ID</Label>
                        <Input id="realmId" placeholder="Enter your QuickBooks Realm ID" />
                      </div>
                    </div>
                  )}

                  {selectedType === "zapier" && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="apiKey">Zapier API Key</Label>
                        <Input id="apiKey" placeholder="Enter your Zapier API Key" />
                      </div>
                      <div>
                        <Label htmlFor="webhookUrl">Webhook URL</Label>
                        <Input id="webhookUrl" placeholder="https://hooks.zapier.com/..." />
                      </div>
                    </div>
                  )}

                  {selectedType === "btcpay" && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="serverUrl">BTCPay Server URL</Label>
                        <Input id="serverUrl" placeholder="https://your-btcpay-server.com" />
                      </div>
                      <div>
                        <Label htmlFor="apiKey">BTCPay API Key</Label>
                        <Input id="apiKey" placeholder="Enter your BTCPay API Key" />
                      </div>
                      <div>
                        <Label htmlFor="storeId">Store ID</Label>
                        <Input id="storeId" placeholder="Enter your Store ID" />
                      </div>
                    </div>
                  )}

                  {selectedType === "lnbits" && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="serverUrl">LNbits Server URL</Label>
                        <Input id="serverUrl" placeholder="https://your-lnbits-server.com" />
                      </div>
                      <div>
                        <Label htmlFor="apiKey">LNbits API Key</Label>
                        <Input id="apiKey" placeholder="Enter your LNbits API Key" />
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what this integration is for..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-end gap-4">
                <Link to="/integrations">
                  <Button variant="outline">Cancel</Button>
                </Link>
                <Button type="submit">Create Integration</Button>
              </div>
            </form>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
} 