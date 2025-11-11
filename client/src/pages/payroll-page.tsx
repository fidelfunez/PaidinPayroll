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
import { useSidebar } from "@/hooks/use-sidebar";
import { useBtcRate } from "@/hooks/use-btc-rate-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PayrollPayment, User } from "@shared/schema";

export default function PayrollPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);

  const { data: payments, isLoading: paymentsLoading } = useQuery<PayrollPayment[]>({
    queryKey: ['/api/payroll'],
  });

  const { data: employees } = useQuery<User[]>({
    queryKey: ['/api/employees'],
    enabled: user?.role === 'admin' || user?.role === 'super_admin',
  });

  const { data: employeesWithWithdrawal } = useQuery<User[]>({
    queryKey: ['/api/employees/withdrawal-methods'],
    enabled: user?.role === 'admin' || user?.role === 'super_admin',
  });

  const { rate: btcRate } = useBtcRate();

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

  const processBitcoinPaymentMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      const response = await apiRequest('POST', `/api/payroll/${paymentId.toString()}/process-bitcoin`, {});
      return response;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/payroll'] });
      toast({
        title: "Bitcoin payment initiated",
        description: `Lightning payment sent. Payment hash: ${data.lnbitsPaymentHash?.substring(0, 16)}...`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Bitcoin payment failed",
        description: error.message || "Failed to process Bitcoin payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createLightningInvoiceMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      const response = await apiRequest('POST', `/api/payroll/${paymentId.toString()}/create-lightning-invoice`, {});
      return response;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/payroll'] });
      toast({
        title: "Lightning invoice created",
        description: `Invoice created for ${data.lightningInvoice?.amountUsd || 'unknown'} USD (${data.lightningInvoice?.amountSats || 'unknown'} sats)`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lightning invoice failed",
        description: error.message || "Failed to create Lightning invoice. Please try again.",
        variant: "destructive",
      });
    },
  });

  const processLightningPaymentMutation = useMutation({
    mutationFn: async ({ paymentId, lightningAddress }: { paymentId: number; lightningAddress: string }) => {
      const response = await apiRequest('POST', `/api/payroll/${paymentId}/process-lightning-payment`, {
        lightningAddress
      });
      return response;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/payroll'] });
      toast({
        title: "Lightning payment sent",
        description: `Payment of ${data.lightningPayment.amountUsd} USD sent to ${data.lightningPayment.lightningAddress}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lightning payment failed",
        description: error.message || "Failed to send Lightning payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetPaymentMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      const response = await apiRequest('POST', `/api/payroll/${paymentId}/reset-payment`, {});
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payroll'] });
      toast({
        title: "Payment reset",
        description: "Payment has been reset to pending status and can be retried.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Reset failed",
        description: error.message || "Failed to reset payment. Please try again.",
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

  const formatUsd = (amount: string | number | undefined) => {
    if (amount === undefined || amount === null) return '$0.00';
    return `$${parseFloat(amount.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatBtc = (amount: string | number | undefined) => {
    if (amount === undefined || amount === null) return '0.00000000 BTC';
    return `${parseFloat(amount.toString()).toFixed(8)} BTC`;
  };

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-background to-gray-50 flex">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16 lg:ml-16' : 'ml-16 lg:ml-64'}`}>
        <Header 
          title="Payroll Management" 
          subtitle="Schedule and manage Bitcoin salary payments"
          btcRate={btcRate}
        />
        
        <main className="p-4 lg:p-6 space-y-6 animate-fade-in">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Payroll Management</h1>
              <p className="text-muted-foreground mt-1.5">Schedule and manage Bitcoin salary payments</p>
            </div>
            {(user?.role === 'admin' || user?.role === 'super_admin') && (
              <Button onClick={() => setShowModal(true)} size="lg" className="shadow-lg">
                <Plus className="w-4 h-4 mr-2" />
                Schedule Payroll
              </Button>
            )}
          </div>

          {/* Payroll Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-6">
            <Card className="border-gray-200/80 bg-gradient-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Active Employees</div>
                    <div className="text-3xl font-bold text-foreground mt-2 tracking-tight">{activeEmployees}</div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center shadow-lg border border-blue-300/50">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200/80 bg-gradient-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Next Payroll</div>
                    <div className="text-3xl font-bold text-foreground mt-2 tracking-tight">March 15</div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center shadow-lg border border-purple-300/50">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200/80 bg-gradient-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Monthly Budget</div>
                    <div className="text-3xl font-bold text-foreground mt-2 tracking-tight">{formatUsd(monthlyBudget)}</div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center shadow-lg border border-green-300/50">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200/80 bg-gradient-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">BTC Required</div>
                    <div className="text-3xl font-bold text-foreground mt-2 tracking-tight">{formatBtc(btcRequired)}</div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center shadow-lg border border-orange-300/50">
                    <Bitcoin className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payroll Payments Table */}
          <Card className="border-gray-200/80">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold">Payroll Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {payments && payments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Withdrawal Method</TableHead>
                      <TableHead>USD Amount</TableHead>
                      <TableHead>BTC Amount</TableHead>
                      <TableHead>Scheduled Date</TableHead>
                      <TableHead>Status</TableHead>
                      {(user?.role === 'admin' || user?.role === 'super_admin') && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => {
                      const employee = employeesWithWithdrawal?.find(emp => emp.id === payment.userId);
                      const hasWithdrawalMethod = employee?.btcAddress || employee?.withdrawalMethod === 'bank_transfer';
                      
                      return (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">
                            <div>
                              <div>{employee ? `${employee.firstName} ${employee.lastName}` : `Employee #${payment.userId}`}</div>
                              <div className="text-xs text-muted-foreground">{employee?.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {employee?.btcAddress ? (
                                <>
                                  <Bitcoin className="w-4 h-4 text-orange-500" />
                                  <div>
                                    <div className="text-xs font-medium">Lightning Address</div>
                                    <div className="text-xs text-muted-foreground truncate max-w-32">
                                      {employee.btcAddress}
                                    </div>
                                  </div>
                                </>
                              ) : employee?.withdrawalMethod === 'bank_transfer' ? (
                                <>
                                  <DollarSign className="w-4 h-4 text-blue-500" />
                                  <div className="text-xs">Bank Transfer</div>
                                </>
                              ) : (
                                <div className="text-xs text-red-500">Not set</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{formatUsd(payment.amountUsd)}</TableCell>
                          <TableCell>{formatBtc(payment.amountBtc)}</TableCell>
                          <TableCell>{new Date(payment.scheduledDate).toLocaleDateString()}</TableCell>
                          <TableCell>{getStatusBadge(payment.status)}</TableCell>
                          {(user?.role === 'admin' || user?.role === 'super_admin') && (
                            <TableCell>
                              <div className="flex gap-2">
                                {payment.status === 'pending' && employee?.btcAddress && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => createLightningInvoiceMutation.mutate(payment.id)}
                                      disabled={createLightningInvoiceMutation.isPending}
                                      className="bg-orange-500 hover:bg-orange-600"
                                    >
                                      {createLightningInvoiceMutation.isPending ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <>
                                          <Bitcoin className="w-3 h-3 mr-1" />
                                          Create Invoice
                                        </>
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        const lightningAddress = prompt('Enter Lightning address (user@domain.com):');
                                        if (lightningAddress) {
                                          processLightningPaymentMutation.mutate({
                                            paymentId: payment.id,
                                            lightningAddress
                                          });
                                        }
                                      }}
                                      disabled={processLightningPaymentMutation.isPending}
                                      className="bg-green-500 hover:bg-green-600"
                                    >
                                      {processLightningPaymentMutation.isPending ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <>
                                          <Bitcoin className="w-3 h-3 mr-1" />
                                          Send Payment
                                        </>
                                      )}
                                    </Button>
                                  </>
                                )}
                                {payment.status === 'pending' && !hasWithdrawalMethod && (
                                  <div className="text-xs text-red-500 py-1">
                                    Employee needs to set withdrawal method
                                  </div>
                                )}
                                {payment.status === 'pending' && employee?.withdrawalMethod === 'bank_transfer' && (
                                  <Button
                                    size="sm"
                                    onClick={() => processPaymentMutation.mutate(payment.id)}
                                    disabled={processPaymentMutation.isPending}
                                    variant="outline"
                                  >
                                    {processPaymentMutation.isPending ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      'Mark Paid'
                                    )}
                                  </Button>
                                )}
                                {payment.status === 'processing' && (
                                  <div className="flex gap-2">
                                    <div className="text-xs text-blue-500 py-1">
                                      Processing Lightning payment...
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={() => resetPaymentMutation.mutate(payment.id)}
                                      disabled={resetPaymentMutation.isPending}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {resetPaymentMutation.isPending ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        'Reset Payment'
                                      )}
                                    </Button>
                                  </div>
                                )}
                                {payment.status === 'completed' && payment.transactionHash && (
                                  <div className="text-xs text-green-500 py-1">
                                    ✅ Paid via Lightning
                                  </div>
                                )}
                                {payment.processingNotes && (
                                  <div className="text-xs text-muted-foreground max-w-32 truncate" title={payment.processingNotes}>
                                    {payment.processingNotes}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
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
