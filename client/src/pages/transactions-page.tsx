import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  History, 
  AlertTriangle, 
  Search,
  Filter,
  Download,
  Bitcoin,
  Zap,
  DollarSign,
  Calendar
} from "lucide-react";

export default function TransactionsPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const [searchTerm, setSearchTerm] = useState("");

  // Check if user is super admin
  if (user?.role !== 'super_admin') {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You need super administrator privileges to view transaction history.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Mock transaction data
  const transactions = [
    {
      id: "tx_001",
      type: "payroll",
      employee: "John Doe",
      amountUsd: 5000,
      amountBtc: 0.12,
      btcRate: 41666.67,
      method: "lightning",
      status: "completed",
      txHash: "lnbc1234567890abcdef...",
      timestamp: "2024-01-15 10:30:00",
      confirmations: 6
    },
    {
      id: "tx_002",
      type: "reimbursement",
      employee: "Jane Smith",
      amountUsd: 250,
      amountBtc: 0.006,
      btcRate: 41666.67,
      method: "onchain",
      status: "completed",
      txHash: "1A2B3C4D5E6F7890ABCDEF...",
      timestamp: "2024-01-14 15:45:00",
      confirmations: 12
    },
    {
      id: "tx_003",
      type: "payroll",
      employee: "Mike Johnson",
      amountUsd: 3500,
      amountBtc: 0.084,
      btcRate: 41666.67,
      method: "lightning",
      status: "pending",
      txHash: "lnbc9876543210fedcba...",
      timestamp: "2024-01-15 09:15:00",
      confirmations: 0
    },
    {
      id: "tx_004",
      type: "payroll",
      employee: "Sarah Wilson",
      amountUsd: 4200,
      amountBtc: 0.101,
      btcRate: 41666.67,
      method: "onchain",
      status: "completed",
      txHash: "2B3C4D5E6F7890ABCDEF12...",
      timestamp: "2024-01-13 14:20:00",
      confirmations: 24
    }
  ];

  const filteredTransactions = transactions.filter(tx =>
    tx.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.txHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-600">Completed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMethodIcon = (method: string) => {
    return method === "lightning" ? (
      <Zap className="h-4 w-4 text-yellow-500" />
    ) : (
      <Bitcoin className="h-4 w-4 text-orange-500" />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-background to-gray-50 flex">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16 lg:ml-16' : 'ml-16 lg:ml-64'}`}>
        <Header 
          title="Transaction History" 
          subtitle="Complete history of Bitcoin transactions"
        />
        <main className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <History className="h-6 w-6 text-orange-600" />
          <h1 className="text-3xl font-bold">Transaction History</h1>
          <Badge variant="destructive">Super Admin Only</Badge>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume (USD)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${transactions.reduce((sum, tx) => sum + tx.amountUsd, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume (BTC)</CardTitle>
            <Bitcoin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transactions.reduce((sum, tx) => sum + tx.amountBtc, 0).toFixed(4)} BTC
            </div>
            <p className="text-xs text-muted-foreground">
              Sent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((transactions.filter(tx => tx.status === 'completed').length / transactions.length) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Search & Filter</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search by employee, transaction hash, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            Complete history of Bitcoin transactions processed through the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Amount (USD)</TableHead>
                <TableHead>Amount (BTC)</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Confirmations</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Transaction Hash</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-mono text-sm">{tx.id}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {tx.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{tx.employee}</TableCell>
                  <TableCell>${tx.amountUsd.toLocaleString()}</TableCell>
                  <TableCell>{tx.amountBtc.toFixed(4)} BTC</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getMethodIcon(tx.method)}
                      <span className="capitalize">{tx.method}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(tx.status)}</TableCell>
                  <TableCell>
                    {tx.method === 'onchain' ? (
                      <span className="text-sm">{tx.confirmations}/6</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{tx.timestamp}</TableCell>
                  <TableCell className="font-mono text-xs max-w-[200px] truncate">
                    {tx.txHash}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
        </main>
        <Footer />
      </div>
    </div>
  );
}
