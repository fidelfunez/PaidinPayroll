import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Loader2, Clock, DollarSign, FileText, Calendar, Shield, Download, Plus, Bell, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ExpenseReimbursement, PayrollPayment, TimeTracking, TimeOffRequest, Notification } from "@shared/schema";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { toast } = useToast();

  const { data: expenses, isLoading: expensesLoading } = useQuery<ExpenseReimbursement[]>({
    queryKey: ['/api/expenses'],
  });

  const { data: payslips, isLoading: payslipsLoading } = useQuery<PayrollPayment[]>({
    queryKey: ['/api/payroll'],
  });

  const { data: timeTracking, isLoading: timeLoading } = useQuery<TimeTracking[]>({
    queryKey: ['/api/time-tracking'],
  });

  const { data: timeOffRequests, isLoading: timeOffLoading } = useQuery<TimeOffRequest[]>({
    queryKey: ['/api/time-off'],
  });

  const { data: notifications, isLoading: notificationsLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
  });

  const { data: btcRate } = useQuery<{ rate: number }>({
    queryKey: ['/api/btc-rate'],
  });

  const clockInMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/time-tracking/clock-in', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-tracking'] });
      toast({
        title: "Clocked in",
        description: "You've successfully clocked in for today.",
      });
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('POST', `/api/time-tracking/${id}/clock-out`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-tracking'] });
      toast({
        title: "Clocked out",
        description: "You've successfully clocked out.",
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
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const todayTimeEntry = timeTracking?.find(entry => 
    new Date(entry.date).toDateString() === new Date().toDateString() && !entry.clockOut
  );

  const totalExpenses = expenses?.reduce((sum, exp) => sum + parseFloat(exp.amountUsd), 0) || 0;
  const pendingExpenses = expenses?.filter(exp => exp.status === 'pending').length || 0;
  const approvedExpenses = expenses?.filter(exp => exp.status === 'approved' || exp.status === 'paid').length || 0;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Header 
          title="My Dashboard" 
          subtitle="Employee Portal"
          btcRate={btcRate?.rate}
        />
        
        <main className="flex-1 p-6 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                    <p className="text-2xl font-bold">{formatUsd(totalExpenses)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Pending Expenses</p>
                    <p className="text-2xl font-bold">{pendingExpenses}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Approved Expenses</p>
                    <p className="text-2xl font-bold">{approvedExpenses}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Bell className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Notifications</p>
                    <p className="text-2xl font-bold">{notifications?.filter(n => !n.isRead).length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Time Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Time Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                {todayTimeEntry ? (
                  <Button 
                    onClick={() => clockOutMutation.mutate(todayTimeEntry.id)}
                    disabled={clockOutMutation.isPending}
                    variant="outline"
                  >
                    {clockOutMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Clock Out
                  </Button>
                ) : (
                  <Button 
                    onClick={() => clockInMutation.mutate()}
                    disabled={clockInMutation.isPending}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {clockInMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Clock In
                  </Button>
                )}
                
                {todayTimeEntry && (
                  <div className="text-sm text-muted-foreground">
                    Clocked in at {new Date(todayTimeEntry.clockIn).toLocaleTimeString()}
                  </div>
                )}
              </div>

              {timeLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Clock In</TableHead>
                      <TableHead>Clock Out</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeTracking?.slice(0, 5).map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(entry.clockIn).toLocaleTimeString()}</TableCell>
                        <TableCell>
                          {entry.clockOut ? new Date(entry.clockOut).toLocaleTimeString() : '-'}
                        </TableCell>
                        <TableCell>{entry.hoursWorked || '-'}</TableCell>
                        <TableCell>{entry.description || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* My Expenses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  My Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                {expensesLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {expenses?.slice(0, 5).map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{expense.category}</p>
                          <p className="text-sm text-muted-foreground">{expense.description}</p>
                          <p className="text-sm font-medium">{formatUsd(expense.amountUsd)}</p>
                        </div>
                        {getStatusBadge(expense.status)}
                      </div>
                    ))}
                    
                    {(!expenses || expenses.length === 0) && (
                      <p className="text-center text-muted-foreground py-4">No expenses submitted yet</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Payslips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Payslips
                </CardTitle>
              </CardHeader>
              <CardContent>
                {payslipsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payslips?.slice(0, 5).map((payslip) => (
                      <div key={payslip.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">Salary Payment</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(payslip.scheduledDate).toLocaleDateString()}
                          </p>
                          <p className="text-sm font-medium">{formatUsd(payslip.amountUsd)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(payslip.status)}
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {(!payslips || payslips.length === 0) && (
                      <p className="text-center text-muted-foreground py-4">No payslips available</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Recent Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notificationsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications?.slice(0, 5).map((notification) => (
                    <div key={notification.id} className={`p-3 border rounded ${!notification.isRead ? 'bg-orange-50' : ''}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{notification.title}</p>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {(!notifications || notifications.length === 0) && (
                    <p className="text-center text-muted-foreground py-4">No notifications</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    </div>
  );
}