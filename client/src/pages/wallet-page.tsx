import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { useBtcRate } from "@/hooks/use-btc-rate-context";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  Settings,
  Copy,
  QrCode,
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  Bitcoin
} from "lucide-react";
import { useState } from "react";

export default function WalletPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { rate: btcRate } = useBtcRate();
  const [activeTab, setActiveTab] = useState("overview");

  // Mock wallet data
  const walletData = {
    totalBalance: 2.5, // BTC
    usdBalance: 2.5 * (btcRate || 0),
    lightningBalance: 0.1, // BTC
    onchainBalance: 2.4, // BTC
    recentTransactions: [
      {
        id: 1,
        type: "sent",
        amount: 0.05,
        to: "Employee Payment",
        timestamp: "2024-01-15T10:30:00Z",
        status: "confirmed",
        method: "lightning"
      },
      {
        id: 2,
        type: "received",
        amount: 1.0,
        from: "Company Funding",
        timestamp: "2024-01-14T15:45:00Z",
        status: "confirmed",
        method: "onchain"
      },
      {
        id: 3,
        type: "sent",
        amount: 0.02,
        to: "Reimbursement",
        timestamp: "2024-01-14T09:15:00Z",
        status: "pending",
        method: "lightning"
      }
    ]
  };

  const formatBtc = (amount: number) => {
    return `${amount.toFixed(8)} BTC`;
  };

  const formatUsd = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getMethodIcon = (method: string) => {
    return method === "lightning" ? Zap : Bitcoin;
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "transactions", label: "Transactions" },
    { id: "funding", label: "Funding" },
    { id: "settings", label: "Settings" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16 lg:ml-16' : 'ml-16 lg:ml-64'}`}>
        <Header
          title="Wallet"
          subtitle="Manage your Bitcoin wallet and transactions"
        />

        <main className="p-4 lg:p-6 space-y-6">
          {/* Wallet Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                <Wallet className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{formatBtc(walletData.totalBalance)}</div>
                <div className="text-sm text-muted-foreground">{formatUsd(walletData.usdBalance)}</div>
                <div className="flex items-center text-xs text-green-600 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+2.5% from last week</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lightning Balance</CardTitle>
                <Zap className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{formatBtc(walletData.lightningBalance)}</div>
                <div className="text-sm text-muted-foreground">{formatUsd(walletData.lightningBalance * (btcRate || 0))}</div>
                <div className="text-xs text-muted-foreground mt-1">Fast payments</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">On-chain Balance</CardTitle>
                <Bitcoin className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{formatBtc(walletData.onchainBalance)}</div>
                <div className="text-sm text-muted-foreground">{formatUsd(walletData.onchainBalance * (btcRate || 0))}</div>
                <div className="text-xs text-muted-foreground mt-1">Secure storage</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Wallet Management</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Fund Wallet
                  </Button>
                  <Button size="sm" variant="outline">
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                </div>
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
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                      <Plus className="h-6 w-6 text-green-600" />
                      <span>Fund Wallet</span>
                    </Button>
                    <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                      <ArrowUpRight className="h-6 w-6 text-blue-600" />
                      <span>Send Bitcoin</span>
                    </Button>
                    <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                      <QrCode className="h-6 w-6 text-purple-600" />
                      <span>Receive</span>
                    </Button>
                    <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                      <History className="h-6 w-6 text-orange-600" />
                      <span>History</span>
                    </Button>
                  </div>

                  {/* Wallet Address */}
                  <div className="space-y-2">
                    <Label>Wallet Address</Label>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                      <code className="flex-1 text-sm font-mono">
                        bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
                      </code>
                      <Button size="sm" variant="ghost">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <QrCode className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "transactions" && (
                <div className="space-y-4">
                  {walletData.recentTransactions.map((tx) => {
                    const MethodIcon = getMethodIcon(tx.method);
                    return (
                      <div key={tx.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.type === "sent" ? "bg-red-100" : "bg-green-100"
                        }`}>
                          {tx.type === "sent" ? (
                            <ArrowUpRight className="h-5 w-5 text-red-600" />
                          ) : (
                            <ArrowDownLeft className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {tx.type === "sent" ? "Sent to" : "Received from"}
                            </span>
                            <span className="text-muted-foreground">
                              {tx.type === "sent" ? tx.to : tx.from}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MethodIcon className="h-3 w-3" />
                            <span>{tx.method}</span>
                            <span>•</span>
                            <span>{new Date(tx.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className={`font-medium ${
                            tx.type === "sent" ? "text-red-600" : "text-green-600"
                          }`}>
                            {tx.type === "sent" ? "-" : "+"}{formatBtc(tx.amount)}
                          </div>
                          <Badge className={`text-xs ${getStatusColor(tx.status)}`}>
                            {tx.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === "funding" && (
                <div className="space-y-6">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                      <Plus className="h-8 w-8 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Fund Your Wallet</h3>
                      <p className="text-muted-foreground">
                        Add Bitcoin to your wallet to start making payments
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Lightning Network</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Fast, low-cost transactions for regular payments
                        </p>
                        <Button className="w-full">
                          <Zap className="h-4 w-4 mr-2" />
                          Fund Lightning
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">On-chain</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Secure storage for larger amounts
                        </p>
                        <Button className="w-full">
                          <Bitcoin className="h-4 w-4 mr-2" />
                          Fund On-chain
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === "settings" && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Wallet Settings</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Auto-fund Lightning</h4>
                          <p className="text-sm text-muted-foreground">
                            Automatically move funds to Lightning when balance is low
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Transaction Notifications</h4>
                          <p className="text-sm text-muted-foreground">
                            Get notified when transactions are confirmed
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Backup Wallet</h4>
                          <p className="text-sm text-muted-foreground">
                            Download your wallet backup for security
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
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
