import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Loader2, Users, DollarSign, FileText, Calendar, Shield, Download, Plus, Bell, MessageSquare, CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ExpenseReimbursement, PayrollPayment, User, TimeOffRequest, AuditLog } from "@shared/schema";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { toast } = useToast();

  const { data: employees, isLoading: employeesLoading } = useQuery<User[]>({
    queryKey: ['/api/employees'],
  });

  const { data: expenses, isLoading: expensesLoading } = useQuery<ExpenseReimbursement[]>({
    queryKey: ['/api/admin/expenses'],
  });

  const { data: payrollPayments, isLoading: payrollLoading } = useQuery<PayrollPayment[]>({
    queryKey: ['/api/admin/payroll'],
  });

  const { data: timeOffRequests, isLoading: timeOffLoading } = useQuery<TimeOffRequest[]>({
    queryKey: ['/api/admin/time-off'],
  });

  const { data: auditLogs, isLoading: auditLoading } = useQuery<AuditLog[]>({
    queryKey: ['/api/admin/audit-logs'],
  });

  const { data: btcRate } = useQuery<{ rate: number }>({
    queryKey: ['/api/btc-rate'],
  });

  const approveExpenseMutation = useMutation({
    mutationFn: async (expenseId: number) => {
      await apiRequest('PATCH', `/api/expenses/${expenseId}`, { status: 'approved' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/expenses'] });
      toast({
        title: "Expense approved",
        description: "The expense has been approved for payment.",
      });
    },
  });

  const rejectExpenseMutation = useMutation({
    mutationFn: async (expenseId: number) => {
      await apiRequest('PATCH', `/api/expenses/${expenseId}`, { status: 'rejected' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/expenses'] });
      toast({
        title: "Expense rejected",
        description: "The expense has been rejected.",
      });
    },
  });

  const processPaymentMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      await apiRequest('PATCH', `/api/payroll/${paymentId}`, { status: 'completed' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payroll'] });
      toast({
        title: "Payment processed",
        description: "The payment has been successfully processed.",
      });
    },
  });

  const approveTimeOffMutation = useMutation({
    mutationFn: async (requestId: number) => {
      await apiRequest('PATCH', `/api/admin/time-off/${requestId}`, { status: 'approved' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/time-off'] });
      toast({
        title: "Time off approved",
        description: "The time off request has been approved.",
      });
    },
  });

  const rejectTimeOffMutation = useMutation({
    mutationFn: async (requestId: number) => {
      await apiRequest('PATCH', `/api/admin/time-off/${requestId}`, { status: 'rejected' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/time-off'] });
      toast({
        title: "Time off rejected",
        description: "The time off request has been rejected.",
      });
    },
  });

  const bulkPayrollMutation = useMutation({
    mutationFn: async () => {
      const pendingPayments = payrollPayments?.filter(p => p.status === 'pending') || [];
      await Promise.all(
        pendingPayments.map(payment => 
          apiRequest('PATCH', `/api/payroll/${payment.id}`, { status: 'completed' })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payroll'] });
      toast({
        title: "Bulk payments processed",
        description: "All pending payments have been processed.",
      });
    },
  });

  const formatUsd = (amount: string | number) => 
    `$${parseFloat(amount.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatBtc = (amount: string | number) => 
    `${parseFloat(amount.toString()).toFixed(8)} BTC`;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const pendingExpenses = expenses?.filter(exp => exp.status === 'pending').length || 0;
  const pendingPayroll = payrollPayments?.filter(p => p.status === 'pending').length || 0;
  const pendingTimeOff = timeOffRequests?.filter(req => req.status === 'pending').length || 0;
  const totalPendingAmount = payrollPayments?.filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + parseFloat(p.amountUsd), 0) || 0;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Header 
          title="Admin Dashboard" 
          subtitle="Management Portal"
          btcRate={btcRate?.rate}
        />
        
        <main className="flex-1 p-6 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                    <p className="text-2xl font-bold">{employees?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                    <p className="text-2xl font-bold">{pendingExpenses + pendingTimeOff}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Pending Payroll</p>
                    <p className="text-2xl font-bold">{formatUsd(totalPendingAmount)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Shield className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">System Actions</p>
                    <p className="text-2xl font-bold">{auditLogs?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Expenses */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Pending Expenses ({pendingExpenses})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {expensesLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {expenses?.filter(exp => exp.status === 'pending').slice(0, 5).map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex-1">
                          <p className="font-medium">{expense.category}</p>
                          <p className="text-sm text-muted-foreground">{expense.description}</p>
                          <p className="text-sm font-medium">{formatUsd(expense.amountUsd)}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => approveExpenseMutation.mutate(expense.id)}
                            disabled={approveExpenseMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => rejectExpenseMutation.mutate(expense.id)}
                            disabled={rejectExpenseMutation.isPending}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {pendingExpenses === 0 && (
                      <p className="text-center text-muted-foreground py-4">No pending expenses</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Payroll */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Pending Payroll ({pendingPayroll})
                  </CardTitle>
                  {pendingPayroll > 0 && (
                    <Button 
                      onClick={() => bulkPayrollMutation.mutate()}
                      disabled={bulkPayrollMutation.isPending}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {bulkPayrollMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Process All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {payrollLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payrollPayments?.filter(p => p.status === 'pending').slice(0, 5).map((payment) => {
                      const employee = employees?.find(emp => emp.id === payment.userId);
                      return (
                        <div key={payment.id} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex-1">
                            <p className="font-medium">{employee?.firstName} {employee?.lastName}</p>
                            <p className="text-sm text-muted-foreground">
                              Due: {new Date(payment.scheduledDate).toLocaleDateString()}
                            </p>
                            <p className="text-sm font-medium">{formatUsd(payment.amountUsd)}</p>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => processPaymentMutation.mutate(payment.id)}
                            disabled={processPaymentMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {processPaymentMutation.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                            Process
                          </Button>
                        </div>
                      );
                    })}
                    
                    {pendingPayroll === 0 && (
                      <p className="text-center text-muted-foreground py-4">No pending payroll</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Employees Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Employee Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              {employeesLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Salary</TableHead>
                      <TableHead>Withdrawal Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees?.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">
                          {employee.firstName} {employee.lastName}
                        </TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>
                          <Badge variant={employee.role === 'admin' ? 'default' : 'secondary'}>
                            {employee.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {employee.monthlySalary ? formatUsd(employee.monthlySalary) : 'Not set'}
                        </TableCell>
                        <TableCell>
                          {employee.btcAddress ? (
                            <Badge className="bg-orange-100 text-orange-800">BTC</Badge>
                          ) : employee.bankAccountNumber ? (
                            <Badge className="bg-blue-100 text-blue-800">Bank</Badge>
                          ) : (
                            <Badge variant="outline">Not set</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={employee.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {employee.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Time Off Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Time Off Requests ({pendingTimeOff} pending)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timeOffLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeOffRequests?.slice(0, 10).map((request) => {
                      const employee = employees?.find(emp => emp.id === request.userId);
                      return (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">
                            {employee?.firstName} {employee?.lastName}
                          </TableCell>
                          <TableCell>{new Date(request.startDate).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(request.endDate).toLocaleDateString()}</TableCell>
                          <TableCell>{request.days}</TableCell>
                          <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell>
                            {request.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => approveTimeOffMutation.mutate(request.id)}
                                  disabled={approveTimeOffMutation.isPending}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => rejectTimeOffMutation.mutate(request.id)}
                                  disabled={rejectTimeOffMutation.isPending}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Audit Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Recent Audit Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs?.slice(0, 10).map((log) => {
                      const logUser = employees?.find(emp => emp.id === log.userId);
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">
                            {logUser?.firstName} {logUser?.lastName}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.action}</Badge>
                          </TableCell>
                          <TableCell>{log.resourceType}</TableCell>
                          <TableCell className="max-w-xs truncate">{log.details}</TableCell>
                          <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    </div>
  );
}