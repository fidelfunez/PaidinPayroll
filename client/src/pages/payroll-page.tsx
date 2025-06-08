import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Loader2, Plus, DollarSign, Users, Calendar, Bitcoin } from "lucide-react";
import { useState } from "react";
import { SchedulePayrollModal } from "@/components/modals/schedule-payroll-modal";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PayrollPayment, User } from "@shared/schema";

export default function PayrollPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);

  const { data: payments, isLoading: paymentsLoading } = useQuery<PayrollPayment[]>({
    queryKey: ['/api/payroll'],
  });

  const { data: employees } = useQuery<User[]>({
    queryKey: ['/api/employees'],
    enabled: user?.role === 'admin',
  });

  const { data: btcRate } = useQuery<{ rate: number }>({
    queryKey: ['/api/btc-rate'],
  });

  const processPaymentMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      await apiRequest('PATCH', `/api/payroll/${paymentId}`, {
        status: 'completed'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payroll'] });
      toast({
        title: "Payment processed",
        description: "The payment has been successfully processed.",
      });
    },
    onError: () => {
      toast({
        title: "Payment failed",
        description: "Failed to process the payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (paymentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const formatUsd = (amount: string | number) => 
    `$${parseFloat(amount.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatBtc = (amount: string | number) => 
    `${parseFloat(amount.toString()).toFixed(8)} BTC`;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const activeEmployees = employees?.filter(emp => emp.isActive).length || 0;
  const monthlyBudget = employees?.reduce((sum, emp) => sum + parseFloat(emp.monthlySalary || '0'), 0) || 0;
  const btcRequired = btcRate ? monthlyBudget / btcRate.rate : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="ml-64">
        <Header 
          title="Payroll Management" 
          subtitle="Schedule and manage Bitcoin salary payments"
          btcRate={btcRate?.rate}
        />
        
        <main className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Payroll Management</h1>
              <p className="text-muted-foreground mt-1">Schedule and manage Bitcoin salary payments</p>
            </div>
            {user?.role === 'admin' && (
              <Button onClick={() => setShowModal(true)} className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Schedule Payroll
              </Button>
            )}
          </div>

          {/* Payroll Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Active Employees</div>
                    <div className="text-2xl font-bold text-foreground mt-1">{activeEmployees}</div>
                  </div>
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Next Payroll</div>
                    <div className="text-2xl font-bold text-foreground mt-1">March 15</div>
                  </div>
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Monthly Budget</div>
                    <div className="text-2xl font-bold text-foreground mt-1">{formatUsd(monthlyBudget)}</div>
                  </div>
                  <DollarSign className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">BTC Required</div>
                    <div className="text-2xl font-bold text-foreground mt-1">{formatBtc(btcRequired)}</div>
                  </div>
                  <Bitcoin className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payroll Payments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Payroll Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {payments && payments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>USD Amount</TableHead>
                      <TableHead>BTC Amount</TableHead>
                      <TableHead>BTC Rate</TableHead>
                      <TableHead>Scheduled Date</TableHead>
                      <TableHead>Status</TableHead>
                      {user?.role === 'admin' && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">#{payment.userId}</TableCell>
                        <TableCell>{formatUsd(payment.amountUsd)}</TableCell>
                        <TableCell>{formatBtc(payment.amountBtc)}</TableCell>
                        <TableCell>{formatUsd(payment.btcRate)}</TableCell>
                        <TableCell>{new Date(payment.scheduledDate).toLocaleDateString()}</TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        {user?.role === 'admin' && (
                          <TableCell>
                            {payment.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => processPaymentMutation.mutate(payment.id)}
                                disabled={processPaymentMutation.isPending}
                                className="mr-2"
                              >
                                {processPaymentMutation.isPending ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  'Pay Now'
                                )}
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No payroll payments found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>

      <SchedulePayrollModal 
        open={showModal} 
        onOpenChange={setShowModal} 
      />
    </div>
  );
}
