import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Loader2, Plus, Clock, DollarSign, Bitcoin, Timer } from "lucide-react";
import { useState } from "react";
import { ExpenseModal } from "@/components/modals/expense-modal";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ExpenseReimbursement } from "@shared/schema";

export default function ReimbursementsPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: expenses, isLoading } = useQuery<ExpenseReimbursement[]>({
    queryKey: ['/api/expenses'],
  });

  const { data: btcRate } = useQuery<{ rate: number }>({
    queryKey: ['/api/btc-rate'],
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      await apiRequest('PATCH', `/api/expenses/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      toast({
        title: "Expense updated",
        description: "The expense has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update the expense. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
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
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'paid':
        return <Badge className="bg-blue-100 text-blue-800">Paid</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const handleApprove = (expenseId: number) => {
    updateExpenseMutation.mutate({
      id: expenseId,
      updates: { status: 'approved' }
    });
  };

  const handleReject = (expenseId: number) => {
    updateExpenseMutation.mutate({
      id: expenseId,
      updates: { status: 'rejected' }
    });
  };

  const handlePay = (expenseId: number) => {
    updateExpenseMutation.mutate({
      id: expenseId,
      updates: { status: 'paid' }
    });
  };

  const filteredExpenses = expenses?.filter(expense => 
    statusFilter === "all" || expense.status === statusFilter
  ) || [];

  const pendingCount = expenses?.filter(e => e.status === 'pending').length || 0;
  const approvedThisMonth = expenses?.filter(e => {
    const expenseDate = new Date(e.createdAt);
    const now = new Date();
    return e.status === 'approved' && 
           expenseDate.getMonth() === now.getMonth() && 
           expenseDate.getFullYear() === now.getFullYear();
  }).reduce((sum, e) => sum + parseFloat(e.amountUsd), 0) || 0;

  const paidBtc = expenses?.filter(e => e.status === 'paid')
    .reduce((sum, e) => sum + parseFloat(e.amountBtc || '0'), 0) || 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className={`transition-all duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <Header 
          title="Reimbursements" 
          subtitle="Manage expense claims and Bitcoin payouts"
          btcRate={btcRate?.rate}
        />
        
        <main className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Reimbursements</h1>
              <p className="text-muted-foreground mt-1">Manage expense claims and Bitcoin payouts</p>
            </div>
            <Button onClick={() => setShowModal(true)} className="bg-blue-500 hover:bg-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              New Expense
            </Button>
          </div>

          {/* Reimbursement Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Pending Review</div>
                    <div className="text-2xl font-bold text-foreground mt-1">{pendingCount}</div>
                  </div>
                  <Clock className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Approved This Month</div>
                    <div className="text-2xl font-bold text-foreground mt-1">{formatUsd(approvedThisMonth)}</div>
                  </div>
                  <DollarSign className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Paid in BTC</div>
                    <div className="text-2xl font-bold text-foreground mt-1">{formatBtc(paidBtc)}</div>
                  </div>
                  <Bitcoin className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Average Processing</div>
                    <div className="text-2xl font-bold text-foreground mt-1">2.3 days</div>
                  </div>
                  <Timer className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Expense Claims Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Expense Claims</CardTitle>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {filteredExpenses.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>USD Amount</TableHead>
                      <TableHead>BTC Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      {user?.role === 'admin' && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">#{expense.userId}</TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <div className="font-medium text-foreground">{expense.description}</div>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{expense.category}</TableCell>
                        <TableCell>{formatUsd(expense.amountUsd)}</TableCell>
                        <TableCell>
                          {expense.amountBtc ? formatBtc(expense.amountBtc) : '--'}
                        </TableCell>
                        <TableCell>{getStatusBadge(expense.status)}</TableCell>
                        <TableCell>{new Date(expense.createdAt).toLocaleDateString()}</TableCell>
                        {user?.role === 'admin' && (
                          <TableCell>
                            <div className="flex space-x-2">
                              {expense.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-600 hover:text-green-700"
                                    onClick={() => handleApprove(expense.id)}
                                    disabled={updateExpenseMutation.isPending}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => handleReject(expense.id)}
                                    disabled={updateExpenseMutation.isPending}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                              {expense.status === 'approved' && (
                                <Button
                                  size="sm"
                                  onClick={() => handlePay(expense.id)}
                                  disabled={updateExpenseMutation.isPending}
                                  className="bg-primary hover:bg-primary/90"
                                >
                                  {updateExpenseMutation.isPending ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    'Pay Now'
                                  )}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No expense claims found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>

      <ExpenseModal 
        open={showModal} 
        onOpenChange={setShowModal} 
      />
    </div>
  );
}
