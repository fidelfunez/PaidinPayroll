import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, ArrowUpDown, Download, Plus, CheckCircle2, Circle, X } from "lucide-react";
import { Link } from "wouter";
import { getQueryFn } from "@/lib/queryClient";

export default function AccountingDashboardPage() {
  // Fetch overview data - request all transactions for dashboard stats
  const { data: transactionsResponse, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/accounting/transactions?page=1&limit=9999"],
    queryFn: getQueryFn({ on401: "throw" }),
    refetchOnMount: true, // Always refetch on page load to ensure fresh data
  });

  const { data: wallets, isLoading: walletsLoading } = useQuery({
    queryKey: ["/api/accounting/wallets"],
    queryFn: getQueryFn({ on401: "throw" }),
    refetchOnMount: true, // Always refetch on page load to ensure fresh data
  });

  // Fetch purchases for onboarding checklist
  const { data: purchases = [] } = useQuery({
    queryKey: ["purchases"],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch("/api/accounting/purchases", {
        headers,
        credentials: 'include',
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Extract transactions array from paginated response
  const transactions = transactionsResponse?.data || [];

  // Calculate summary stats
  const totalTransactions = transactions?.length || 0;
  const uncategorized = transactions?.filter((tx: any) => !tx.categoryId).length || 0;
  const totalWallets = wallets?.length || 0;
  const hasPurchases = purchases.length > 0;
  const hasCategorized = uncategorized < totalTransactions && totalTransactions > 0;
  const hasExported = false; // Could track this if needed

  // Onboarding checklist state
  const [checklistDismissed, setChecklistDismissed] = useState(() => {
    return localStorage.getItem('onboardingChecklistDismissed') === 'true';
  });

  const handleDismissChecklist = () => {
    setChecklistDismissed(true);
    localStorage.setItem('onboardingChecklistDismissed', 'true');
  };

  // Checklist items
  const checklistItems = [
    {
      id: 'wallet',
      label: 'Connect your first wallet',
      completed: totalWallets > 0,
      link: '/accounting/wallets',
    },
    {
      id: 'transactions',
      label: 'Import transactions',
      completed: totalTransactions > 0,
      link: '/accounting/wallets',
    },
    {
      id: 'purchases',
      label: 'Add Bitcoin purchases',
      completed: hasPurchases,
      link: '/accounting/purchases',
    },
    {
      id: 'categorize',
      label: 'Categorize transactions',
      completed: hasCategorized,
      link: '/accounting/transactions',
    },
    {
      id: 'export',
      label: 'Export to QuickBooks',
      completed: hasExported,
      link: '/accounting/export',
    },
  ];

  const allCompleted = checklistItems.every(item => item.completed);

  return (
    <div className="container mx-auto px-6 pt-6 space-y-6 [&>*:last-child]:mb-0" style={{ paddingBottom: 0 }}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bitcoin Accounting</h1>
          <p className="text-gray-600">Manage your Bitcoin transactions and exports</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/accounting/export">
              <Download className="h-4 w-4 mr-2" />
              Export to QuickBooks
            </Link>
          </Button>
          <Button asChild className="bg-orange-600 hover:bg-orange-700 text-white">
            <Link href="/accounting/wallets">
              <Plus className="h-4 w-4 mr-2" />
              Add Wallet
            </Link>
          </Button>
        </div>
      </div>

      {/* Onboarding Checklist */}
      {!checklistDismissed && (
        <Card className="hover:shadow-lg transition-shadow border-orange-200 bg-orange-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>Getting Started with PaidIn</CardTitle>
              <CardDescription>Complete these steps to set up your Bitcoin accounting</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismissChecklist}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {checklistItems.map((item) => {
                const Icon = item.completed ? CheckCircle2 : Circle;
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <Icon
                      className={`h-5 w-5 ${
                        item.completed
                          ? 'text-green-600'
                          : 'text-gray-400'
                      }`}
                    />
                    <div className="flex-1">
                      {item.completed ? (
                        <p className="text-sm line-through text-muted-foreground">
                          {item.label}
                        </p>
                      ) : (
                        <Link href={item.link}>
                          <a className="text-sm font-medium text-gray-900 hover:text-orange-600 transition-colors">
                            {item.label}
                          </a>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {allCompleted && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-green-600 font-medium">
                  🎉 All set! You're ready to use PaidIn for Bitcoin accounting.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transactionsLoading ? "..." : totalTransactions}
            </div>
            <p className="text-xs text-muted-foreground">
              {uncategorized} uncategorized
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallets Connected</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {walletsLoading ? "..." : totalWallets}
            </div>
            <p className="text-xs text-muted-foreground">
              Bitcoin wallets tracked
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">QuickBooks Ready</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalTransactions - uncategorized}
            </div>
            <p className="text-xs text-muted-foreground">
              Transactions categorized
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with Bitcoin accounting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start hover:bg-orange-50 hover:border-orange-200 transition-colors" asChild>
            <Link href="/accounting/wallets">
              <Wallet className="h-4 w-4 mr-2" />
              Connect a Bitcoin Wallet
            </Link>
          </Button>
          <Button variant="outline" className="w-full justify-start hover:bg-orange-50 hover:border-orange-200 transition-colors" asChild>
            <Link href="/accounting/transactions">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              View & Categorize Transactions
            </Link>
          </Button>
          <Button variant="outline" className="w-full justify-start hover:bg-orange-50 hover:border-orange-200 transition-colors" asChild>
            <Link href="/accounting/categories">
              <Plus className="h-4 w-4 mr-2" />
              Manage Categories
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="hover:shadow-lg transition-shadow mb-0">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest Bitcoin transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <p className="text-muted-foreground">Loading transactions...</p>
          ) : transactions && transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.slice(0, 5).map((tx: any) => (
                <div key={tx.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium">{tx.txType === 'received' ? 'Received' : 'Sent'}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${parseFloat(tx.usdValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-sm text-muted-foreground">
                      {parseFloat(tx.amountBtc).toFixed(8)} BTC
                    </p>
                  </div>
                </div>
              ))}
              <Button variant="link" asChild className="w-full">
                <Link href="/accounting/transactions">View All Transactions</Link>
              </Button>
            </div>
          ) : (
            <div className="text-center py-12">
              <ArrowUpDown className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900">No transactions yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Connect a Bitcoin wallet and fetch transactions to get started with accounting
              </p>
              <Button asChild className="bg-orange-600 hover:bg-orange-700 text-white">
                <Link href="/accounting/wallets">
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect a Wallet
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
