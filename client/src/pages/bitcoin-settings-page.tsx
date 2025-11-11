import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { 
  Settings, 
  Shield, 
  Key, 
  Link, 
  AlertTriangle, 
  CheckCircle,
  Bitcoin,
  Zap
} from "lucide-react";

export default function BitcoinSettingsPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const [btcpayUrl, setBtcpayUrl] = useState("https://your-btcpay-server.com");
  const [btcpayApiKey, setBtcpayApiKey] = useState("");
  const [btcpayStoreId, setBtcpayStoreId] = useState("");
  const [lnbitsUrl, setLnbitsUrl] = useState("https://your-lnbits-instance.com");
  const [lnbitsApiKey, setLnbitsApiKey] = useState("");
  const [isBtcpayEnabled, setIsBtcpayEnabled] = useState(true);
  const [isLnbitsEnabled, setIsLnbitsEnabled] = useState(true);

  // Check if user is super admin
  if (user?.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-background to-gray-50 flex">
        <Sidebar />
        <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16 lg:ml-16' : 'ml-16 lg:ml-64'}`}>
          <Header 
            title="Bitcoin Settings" 
            subtitle="Configure Bitcoin payment providers and security settings"
          />
          <main className="container mx-auto p-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You need super administrator privileges to access Bitcoin settings.
              </AlertDescription>
            </Alert>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-background to-gray-50 flex">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16 lg:ml-16' : 'ml-16 lg:ml-64'}`}>
        <Header 
          title="Bitcoin Settings" 
          subtitle="Configure Bitcoin payment providers and security settings"
        />
        <main className="container mx-auto p-6 space-y-6">
          <div className="flex items-center space-x-2">
            <Bitcoin className="h-6 w-6 text-orange-600" />
            <h1 className="text-3xl font-bold">Bitcoin Settings</h1>
            <Badge variant="destructive">Super Admin Only</Badge>
          </div>

          <div className="grid gap-6">
            {/* BTCPay Server Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>BTCPay Server Configuration</span>
                </CardTitle>
                <CardDescription>
                  Configure your BTCPay Server for Bitcoin payments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="btcpay-enabled">Enable BTCPay Server</Label>
                    <p className="text-sm text-muted-foreground">
                      Use BTCPay Server for Bitcoin payments
                    </p>
                  </div>
                  <Switch 
                    id="btcpay-enabled"
                    checked={isBtcpayEnabled}
                    onCheckedChange={setIsBtcpayEnabled}
                  />
                </div>

                {isBtcpayEnabled && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="btcpay-url">BTCPay Server URL</Label>
                      <Input
                        id="btcpay-url"
                        value={btcpayUrl}
                        onChange={(e) => setBtcpayUrl(e.target.value)}
                        placeholder="https://your-btcpay-server.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="btcpay-api-key">API Key</Label>
                      <Input
                        id="btcpay-api-key"
                        type="password"
                        value={btcpayApiKey}
                        onChange={(e) => setBtcpayApiKey(e.target.value)}
                        placeholder="Enter your BTCPay API key"
                      />
                    </div>
                    <div>
                      <Label htmlFor="btcpay-store-id">Store ID</Label>
                      <Input
                        id="btcpay-store-id"
                        value={btcpayStoreId}
                        onChange={(e) => setBtcpayStoreId(e.target.value)}
                        placeholder="Enter your store ID"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* LNbits Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>LNbits Configuration</span>
                </CardTitle>
                <CardDescription>
                  Configure LNbits for Lightning Network payments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="lnbits-enabled">Enable LNbits</Label>
                    <p className="text-sm text-muted-foreground">
                      Use LNbits for Lightning Network payments
                    </p>
                  </div>
                  <Switch 
                    id="lnbits-enabled"
                    checked={isLnbitsEnabled}
                    onCheckedChange={setIsLnbitsEnabled}
                  />
                </div>

                {isLnbitsEnabled && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="lnbits-url">LNbits URL</Label>
                      <Input
                        id="lnbits-url"
                        value={lnbitsUrl}
                        onChange={(e) => setLnbitsUrl(e.target.value)}
                        placeholder="https://your-lnbits-instance.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lnbits-api-key">API Key</Label>
                      <Input
                        id="lnbits-api-key"
                        type="password"
                        value={lnbitsApiKey}
                        onChange={(e) => setLnbitsApiKey(e.target.value)}
                        placeholder="Enter your LNbits API key"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Security Settings</span>
                </CardTitle>
                <CardDescription>
                  Configure security and notification settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="transaction-notifications">Transaction Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications for all Bitcoin transactions
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Save Changes */}
          <div className="flex justify-end space-x-4">
            <Button variant="outline">Cancel</Button>
            <Button>
              <Key className="h-4 w-4 mr-2" />
              Save Bitcoin Settings
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}