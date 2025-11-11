import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Bitcoin,
  Users,
  TrendingUp
} from "lucide-react";

export default function ProcessPaymentsPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if user is super admin
  if (user?.role !== 'super_admin') {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You need super administrator privileges to process Bitcoin payments.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Mock data for pending payments
  const pendingPayments = [
    {
      id: 1,
      employee: "John Doe",
      amount: 5000,
      amountBtc: 0.12,
      btcRate: 41666.67,
      status: "pending",
      scheduledDate: "2024-01-15",
      method: "lightning"
    },
    {
      id: 2,
      employee: "Jane Smith",
      amount: 3500,
      amountBtc: 0.084,
      btcRate: 41666.67,
      status: "pending",
      scheduledDate: "2024-01-15",
      method: "onchain"
    },
    {
      id: 3,
      employee: "Mike Johnson",
      amount: 4200,
      amountBtc: 0.101,
      btcRate: 41666.67,
      status: "pending",
      scheduledDate: "2024-01-15",
      method: "lightning"
    }
  ];

  const handleProcessAll = async () => {
    setIsProcessing(true);
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
  };

  const handleProcessPayment = async (paymentId: number) => {
    setIsProcessing(true);
    // Simulate processing individual payment
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-background to-gray-50 flex">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16 lg:ml-16' : 'ml-16 lg:ml-64'}`}>
        <Header 
          title="Payment Processing" 
          subtitle="Process Bitcoin payments for scheduled payroll"
        />
        <main className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Zap className="h-6 w-6 text-orange-600" />
        <h1 className="text-3xl font-bold">Payment Processing</h1>
        <Badge variant="destructive">Super Admin Only</Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments.length}</div>
            <p className="text-xs text-muted-foreground">
              Ready for processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount (USD)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${pendingPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              To be processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount (BTC)</CardTitle>
            <Bitcoin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingPayments.reduce((sum, p) => sum + p.amountBtc, 0).toFixed(4)} BTC
            </div>
            <p className="text-xs text-muted-foreground">
              At current rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current BTC Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${pendingPayments[0]?.btcRate.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Per Bitcoin
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Processing Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Payment Processing</span>
          </CardTitle>
          <CardDescription>
            Process Bitcoin payments for scheduled payroll. This will send actual Bitcoin to employees.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> Processing payments will send Bitcoin to employees. 
              This action cannot be undone. Please verify all details before proceeding.
            </AlertDescription>
          </Alert>

          <div className="flex space-x-4">
            <Button 
              onClick={handleProcessAll}
              disabled={isProcessing || pendingPayments.length === 0}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Process All Payments ({pendingPayments.length})
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pending Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Pending Payments</span>
          </CardTitle>
          <CardDescription>
            Review and process individual payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Amount (USD)</TableHead>
                <TableHead>Amount (BTC)</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Scheduled Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.employee}</TableCell>
                  <TableCell>${payment.amount.toLocaleString()}</TableCell>
                  <TableCell>{payment.amountBtc.toFixed(4)} BTC</TableCell>
                  <TableCell>
                    <Badge variant={payment.method === 'lightning' ? 'default' : 'secondary'}>
                      {payment.method === 'lightning' ? 'Lightning' : 'On-chain'}
                    </Badge>
                  </TableCell>
                  <TableCell>{payment.scheduledDate}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{payment.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() => handleProcessPayment(payment.id)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Clock className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </Button>
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
