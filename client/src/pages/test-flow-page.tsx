import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, Download, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Wallet {
  id: number;
  name: string;
  walletData: string;
  network: string;
}

interface Transaction {
  id: number;
  txId: string;
  txType: 'received' | 'sent' | 'self';
  amountBtc: number;
  usdValue: number;
  timestamp: string;
  categoryId?: number;
}

interface Category {
  id: number;
  name: string;
  categoryType: string;
}

interface Purchase {
  id: number;
  amountBtc: number;
  costBasisUsd: number;
  remainingBtc: number;
  purchaseDate: string;
  source?: string;
}

interface CostBasisResult {
  transactionId: number;
  txType: string;
  amountBtc: number;
  saleValueUsd: number;
  costBasisUsd: number;
  gainLossUsd: number;
}

export default function TestFlowPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [section1Complete, setSection1Complete] = useState(false);
  const [section2Complete, setSection2Complete] = useState(false);
  const [section3Complete, setSection3Complete] = useState(false);
  const [section4Complete, setSection4Complete] = useState(false);
  const [section5Complete, setSection5Complete] = useState(false);

  // Fetch wallets
  const { data: wallets = [], refetch: refetchWallets } = useQuery<Wallet[]>({
    queryKey: ["wallets"],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const res = await fetch("/api/accounting/wallets", {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to fetch wallets");
      return res.json();
    },
  });

  // Fetch transactions
  const { data: transactionsData, refetch: refetchTransactions } = useQuery({
    queryKey: ["transactions", "test-flow"],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const res = await fetch("/api/accounting/transactions?page=1&limit=9999", {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      const data = await res.json();
      return data.data || [];
    },
  });

  const transactions: Transaction[] = transactionsData || [];

  // Fetch categories
  const { data: categories = [], refetch: refetchCategories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const res = await fetch("/api/accounting/categories", {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  // Fetch purchases
  const { data: purchases = [], refetch: refetchPurchases } = useQuery<Purchase[]>({
    queryKey: ["purchases"],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const res = await fetch("/api/accounting/purchases", {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to fetch purchases");
      return res.json();
    },
  });

  // Section 1: Fetch Transactions
  const fetchTransactionsMutation = useMutation({
    mutationFn: async (walletId: number) => {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`/api/accounting/wallets/${walletId}/fetch-transactions`, {
        method: "POST",
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch transactions");
      return data;
    },
    onSuccess: () => {
      refetchTransactions();
      setSection1Complete(true);
      toast({
        title: "Transactions fetched",
        description: "Transactions imported successfully",
      });
    },
  });

  // Section 2: Create test categories
  const createCategoriesMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('authToken');
      const testCategories = [
        { name: 'Salary', categoryType: 'income' },
        { name: 'Expense', categoryType: 'expense' },
        { name: 'Withdrawal', categoryType: 'expense' },
      ];

      const results = await Promise.all(
        testCategories.map(cat =>
          fetch("/api/accounting/categories", {
            method: "POST",
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            credentials: 'include',
            body: JSON.stringify(cat),
          }).then(res => res.json())
        )
      );

      return results;
    },
    onSuccess: () => {
      refetchCategories();
      toast({
        title: "Test categories created",
        description: "Created: Salary, Expense, Withdrawal",
      });
    },
  });

  // Section 2: Auto-categorize transactions
  const autoCategorizeMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('authToken');
      
      // Get categories by name
      const salaryCat = categories.find(c => c.name === 'Salary');
      const expenseCat = categories.find(c => c.name === 'Expense');
      
      if (!salaryCat || !expenseCat) {
        throw new Error("Test categories not found. Please create them first.");
      }

      let categorized = 0;
      const updates = transactions
        .filter(tx => !tx.categoryId) // Only categorize transactions without categories
        .map(async (tx) => {
          let categoryId: number | undefined;
          if (tx.txType === 'received') categoryId = salaryCat.id;
          else if (tx.txType === 'sent') categoryId = expenseCat.id;

          if (categoryId) {
            const res = await fetch(`/api/accounting/transactions/${tx.id}`, {
              method: "PATCH",
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
              },
              credentials: 'include',
              body: JSON.stringify({ categoryId }),
            });
            if (res.ok) {
              categorized++;
            }
          }
        });

      await Promise.all(updates);
      return categorized;
    },
    onSuccess: (count) => {
      refetchTransactions();
      if (count > 0) {
        setSection2Complete(true);
      }
      toast({
        title: count > 0 ? "Transactions categorized" : "No transactions to categorize",
        description: count > 0 
          ? `${count} transaction(s) automatically categorized`
          : "All transactions already have categories assigned",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error categorizing transactions",
        description: error.message || "Failed to categorize transactions",
        variant: "destructive",
      });
    },
  });

  // Section 3: Auto-create purchases from received transactions
  const createPurchasesMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('authToken');
      const receivedTxs = transactions.filter(tx => tx.txType === 'received');

      let created = 0;
      const errors: string[] = [];
      
      await Promise.all(
        receivedTxs.map(async (tx) => {
          try {
            // Convert timestamp to YYYY-MM-DD format (backend expects this format)
            const txDate = new Date(tx.timestamp);
            const purchaseDateStr = txDate.toISOString().split('T')[0];
            
            const res = await fetch("/api/accounting/purchases", {
              method: "POST",
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
              },
              credentials: 'include',
              body: JSON.stringify({
                amountBtc: tx.amountBtc,
                costBasisUsd: tx.usdValue,
                purchaseDate: purchaseDateStr,
                source: 'Auto-imported from transaction',
              }),
            });
            
            if (res.ok) {
              created++;
            } else {
              const errorData = await res.json().catch(() => ({}));
              errors.push(errorData.error || `Transaction ${tx.id}: ${res.status}`);
            }
          } catch (err: any) {
            errors.push(`Transaction ${tx.id}: ${err.message}`);
          }
        })
      );

      if (errors.length > 0 && created === 0) {
        throw new Error(errors[0] || "Failed to create purchases");
      }

      return created;
    },
    onSuccess: (count) => {
      refetchPurchases();
      setSection3Complete(true);
      toast({
        title: "Purchases created",
        description: `${count} purchase(s) created from received transactions`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating purchases",
        description: error.message || "Failed to create purchases",
        variant: "destructive",
      });
    },
  });

  // Section 4: Calculate cost basis
  const [costBasisResults, setCostBasisResults] = useState<CostBasisResult[]>([]);
  const calculateCostBasisMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('authToken');
      const sentTxs = transactions.filter(tx => tx.txType === 'sent');
      
      if (sentTxs.length === 0) {
        throw new Error("No 'sent' transactions found");
      }

      const txIds = sentTxs.map(tx => tx.id).join(',');
      const res = await fetch(`/api/accounting/transactions/cost-basis?transactionIds=${txIds}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include',
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to calculate cost basis");
      }
      const data = await res.json();
      // Backend returns { success: true, count: number, transactions: [...] }
      // Filter to only include sent transactions with cost basis > 0
      const results = (data.transactions || []).filter((r: any) => 
        r.txType === 'sent' && r.costBasisUsd > 0
      );
      return results;
    },
    onSuccess: (results) => {
      setCostBasisResults(results);
      setSection4Complete(true);
      refetchPurchases(); // Update remaining BTC
      toast({
        title: "Cost basis calculated",
        description: `FIFO cost basis calculated for ${results.length} transaction(s)`,
      });
    },
  });

  // Section 5: Export QuickBooks CSV
  const exportMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('authToken');
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const res = await fetch(
        `/api/accounting/export/quickbooks?startDate=${startDateStr}&endDate=${endDateStr}`,
        {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          credentials: 'include',
        }
      );

      if (!res.ok) throw new Error("Failed to export CSV");
      const csvText = await res.text();
      return csvText;
    },
    onSuccess: (csvText) => {
      // Download CSV
      const blob = new Blob([csvText], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quickbooks-export-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setSection5Complete(true);
      toast({
        title: "CSV exported",
        description: "QuickBooks export downloaded successfully",
      });
    },
  });

  // Section 6: Reset test data
  const resetMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('authToken');
      const res = await fetch("/api/accounting/test-data", {
        method: "DELETE",
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to reset test data");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setSection1Complete(false);
      setSection2Complete(false);
      setSection3Complete(false);
      setSection4Complete(false);
      setSection5Complete(false);
      setCostBasisResults([]);
      setResetDialogOpen(false);
      toast({
        title: "Test data cleared",
        description: "All test data has been reset. Ready for new test run.",
      });
    },
  });

  const sentTransactions = transactions.filter(tx => tx.txType === 'sent');
  const receivedTransactions = transactions.filter(tx => tx.txType === 'received');
  const firstWallet = wallets[0];

  // Parse CSV preview (handle quoted CSV values)
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const csvPreview = exportMutation.data?.split('\n').slice(0, 11) || [];
  const csvRows = csvPreview.filter(line => line.trim()).map(parseCSVLine);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">MVP Test Flow</h1>
        <p className="text-gray-600 mt-2">
          Complete end-to-end testing of all MVP features. Follow each section in order.
        </p>
      </div>

      {/* Section 1: Wallet & Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Section 1: Wallet & Transactions</CardTitle>
              <CardDescription>
                Fetch transactions from your connected wallets
              </CardDescription>
            </div>
            {section1Complete && <CheckCircle2 className="h-6 w-6 text-green-500" />}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Connected Wallets: <strong>{wallets.length}</strong>
            </p>
            <p className="text-sm text-muted-foreground mb-2">
              Transaction Count: <strong>{transactions.length}</strong>
            </p>
          </div>
          <Button
            onClick={() => firstWallet && fetchTransactionsMutation.mutate(firstWallet.id)}
            disabled={!firstWallet || fetchTransactionsMutation.isPending}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {fetchTransactionsMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching...
              </>
            ) : (
              "Fetch Transactions for First Wallet"
            )}
          </Button>
          {fetchTransactionsMutation.isSuccess && (
            <p className="text-sm text-green-600">
              ✅ Transactions imported successfully
            </p>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Categories */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Section 2: Categories</CardTitle>
              <CardDescription>
                Create test categories and auto-categorize transactions
              </CardDescription>
            </div>
            {section2Complete && <CheckCircle2 className="h-6 w-6 text-green-500" />}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Existing Categories ({categories.length}):</p>
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <Badge key={cat.id} variant="outline">{cat.name}</Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => createCategoriesMutation.mutate()}
              disabled={createCategoriesMutation.isPending}
              variant="outline"
            >
              {createCategoriesMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Test Categories"
              )}
            </Button>
            <Button
              onClick={() => autoCategorizeMutation.mutate()}
              disabled={autoCategorizeMutation.isPending || categories.length === 0}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {autoCategorizeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Categorizing...
                </>
              ) : (
                "Auto-categorize Transactions"
              )}
            </Button>
          </div>
          {autoCategorizeMutation.isSuccess && (
            <p className="text-sm text-green-600">
              ✅ Transactions categorized successfully
            </p>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Purchases */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Section 3: Purchases</CardTitle>
              <CardDescription>
                Auto-create purchases from received transactions
              </CardDescription>
            </div>
            {section3Complete && <CheckCircle2 className="h-6 w-6 text-green-500" />}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Received Transactions: <strong>{receivedTransactions.length}</strong>
            </p>
            <p className="text-sm text-muted-foreground mb-2">
              Existing Purchases: <strong>{purchases.length}</strong>
            </p>
          </div>
          {purchases.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>BTC Amount</TableHead>
                    <TableHead>Cost Basis USD</TableHead>
                    <TableHead>Remaining BTC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.slice(0, 5).map(p => (
                    <TableRow key={p.id}>
                      <TableCell>{new Date(p.purchaseDate).toLocaleDateString()}</TableCell>
                      <TableCell>{p.amountBtc.toFixed(8)}</TableCell>
                      <TableCell>${p.costBasisUsd.toFixed(2)}</TableCell>
                      <TableCell>{p.remainingBtc.toFixed(8)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <Button
            onClick={() => createPurchasesMutation.mutate()}
            disabled={createPurchasesMutation.isPending || receivedTransactions.length === 0}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {createPurchasesMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Auto-create Purchases from Received Transactions"
            )}
          </Button>
          {createPurchasesMutation.isSuccess && (
            <p className="text-sm text-green-600">
              ✅ Purchases created successfully
            </p>
          )}
        </CardContent>
      </Card>

      {/* Section 4: Cost Basis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Section 4: Cost Basis (FIFO)</CardTitle>
              <CardDescription>
                Calculate cost basis for all sent transactions
              </CardDescription>
            </div>
            {section4Complete && <CheckCircle2 className="h-6 w-6 text-green-500" />}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Sent Transactions: <strong>{sentTransactions.length}</strong>
            </p>
          </div>
          <Button
            onClick={() => calculateCostBasisMutation.mutate()}
            disabled={calculateCostBasisMutation.isPending || sentTransactions.length === 0}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {calculateCostBasisMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              "Calculate Cost Basis for All Sent Transactions"
            )}
          </Button>
          {costBasisResults.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tx ID</TableHead>
                    <TableHead>BTC Amount</TableHead>
                    <TableHead>Sale Value</TableHead>
                    <TableHead>Cost Basis</TableHead>
                    <TableHead>Gain/Loss</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costBasisResults.map(result => (
                    <TableRow key={result.transactionId}>
                      <TableCell className="font-mono text-xs">{result.transactionId}</TableCell>
                      <TableCell>{result.amountBtc.toFixed(8)}</TableCell>
                      <TableCell>${result.saleValueUsd.toFixed(2)}</TableCell>
                      <TableCell>${result.costBasisUsd.toFixed(2)}</TableCell>
                      <TableCell className={result.gainLossUsd >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ${result.gainLossUsd >= 0 ? '+' : ''}{result.gainLossUsd.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 5: QuickBooks Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Section 5: QuickBooks Export</CardTitle>
              <CardDescription>
                Export transactions to CSV format (last 30 days)
              </CardDescription>
            </div>
            {section5Complete && <CheckCircle2 className="h-6 w-6 text-green-500" />}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {exportMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export Last 30 Days to CSV
              </>
            )}
          </Button>
          {exportMutation.isSuccess && csvRows.length > 1 && (
            <div className="space-y-2">
              <p className="text-sm text-green-600">✅ CSV exported. Preview (first 10 rows):</p>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {csvRows[0]?.map((cell, i) => (
                        <TableHead key={i} className="text-xs">{cell}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvRows.slice(1, 11).map((row, i) => (
                      <TableRow key={i}>
                        {row.map((cell, j) => (
                          <TableCell key={j} className="text-xs">{cell}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 6: Reset */}
      <Card className="border-red-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-red-600">Section 6: Reset</CardTitle>
              <CardDescription>
                Clear all test data to start fresh
              </CardDescription>
            </div>
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => setResetDialogOpen(true)}
            disabled={resetMutation.isPending}
            variant="destructive"
          >
            {resetMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Clearing...
              </>
            ) : (
              "Clear All Test Data"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Test Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All transactions</li>
                <li>All purchases</li>
                <li>All transaction lots</li>
                <li>Test categories (Salary, Expense, Withdrawal)</li>
              </ul>
              <strong className="mt-2 block">This action cannot be undone.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => resetMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
            >
              Clear All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
