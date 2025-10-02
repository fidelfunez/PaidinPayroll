import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Loader2, Plus, DollarSign, Bitcoin } from "lucide-react";
import { useState } from "react";
import { ExpenseModal } from "@/components/modals/expense-modal";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { useBtcRate } from "@/hooks/use-btc-rate-context";
import type { ExpenseReimbursement } from "@shared/schema";

export default function MyExpensesPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const [showModal, setShowModal] = useState(false);

  const { data: expenses, isLoading } = useQuery<ExpenseReimbursement[]>({
    queryKey: ['/api/expenses'],
  });

  const { rate: btcRate } = useBtcRate();

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

  const myExpenses = expenses?.filter(expense => expense.userId === user?.id) || [];
  const totalPending = myExpenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + parseFloat(e.amountUsd), 0);
  const totalApproved = myExpenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + parseFloat(e.amountUsd), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className={`transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Header title="My Expenses" subtitle="Track your submitted expense claims" btcRate={btcRate} />
        
        <main className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Submitted</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatUsd(totalPending + totalApproved)}</div>
                  <p className="text-xs text-muted-foreground">
                    {myExpenses.length} total claims
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatUsd(totalPending)}</div>
                  <p className="text-xs text-muted-foreground">
                    {myExpenses.filter(e => e.status === 'pending').length} claims
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Approved Amount</CardTitle>
                  <Bitcoin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatUsd(totalApproved)}</div>
                  <p className="text-xs text-muted-foreground">
                    {btcRate ? formatBtc(totalApproved / btcRate.rate) : '0 BTC'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Expenses Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>My Expense Claims</CardTitle>
                <Button onClick={() => setShowModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Expense
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount (USD)</TableHead>
                      <TableHead>Amount (BTC)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myExpenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No expenses submitted yet. Click "Submit Expense" to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      myExpenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell className="font-medium">{expense.category}</TableCell>
                          <TableCell className="max-w-xs truncate">{expense.description}</TableCell>
                          <TableCell>{formatUsd(expense.amountUsd)}</TableCell>
                          <TableCell>{expense.amountBtc ? formatBtc(expense.amountBtc) : '-'}</TableCell>
                          <TableCell>{getStatusBadge(expense.status)}</TableCell>
                          <TableCell>{new Date(expense.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>

      <ExpenseModal open={showModal} onOpenChange={setShowModal} />
    </div>
  );
}