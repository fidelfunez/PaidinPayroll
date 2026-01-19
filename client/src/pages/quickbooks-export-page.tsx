import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function QuickBooksExportPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { toast } = useToast();

  // Fetch transactions to show export preview
  const { data: transactionsResponse } = useQuery({
    queryKey: ["transactions", "export-preview"],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch("/api/accounting/transactions?page=1&limit=9999", {
        headers,
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      const data = await res.json();
      return data.data || [];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch("/api/accounting/categories", {
        headers,
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  // Filter transactions by date range for preview
  // Parse dates as local dates (not UTC) to match user's date picker selection
  const allTransactions = transactionsResponse || [];
  let filteredTransactions = allTransactions;
  
  if (startDate || endDate) {
    filteredTransactions = allTransactions.filter((tx: any) => {
      const txDate = new Date(tx.timestamp);
      
      if (startDate) {
        // Parse YYYY-MM-DD and create date at local midnight (not UTC)
        const [year, month, day] = startDate.split('-').map(Number);
        const start = new Date(year, month - 1, day, 0, 0, 0, 0);
        if (txDate < start) return false;
      }
      if (endDate) {
        // Parse YYYY-MM-DD and create date at local end of day (not UTC)
        const [year, month, day] = endDate.split('-').map(Number);
        const end = new Date(year, month - 1, day, 23, 59, 59, 999);
        if (txDate > end) return false;
      }
      return true;
    });
  }

  const totalTransactions = filteredTransactions.length;
  const categorized = filteredTransactions.filter((tx: any) => tx.categoryId).length || 0;
  const uncategorized = totalTransactions - categorized;

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Build query string with date filters
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const url = `/api/accounting/export/quickbooks${params.toString() ? `?${params.toString()}` : ''}`;
      
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch(url, {
        headers,
        credentials: 'include',
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate export");
      }

      // Download the CSV file
      const blob = await res.blob();
      const url_download = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url_download;
      a.download = `quickbooks-export-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url_download);

      const dateRangeText = startDate || endDate 
        ? ` (${startDate || 'Start'} to ${endDate || 'End'})`
        : '';
      
      toast({
        title: "Export successful",
        description: `QuickBooks CSV file has been downloaded${dateRangeText}.`,
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message || "Failed to generate export",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">QuickBooks Export</h1>
        <p className="text-gray-600">Export your Bitcoin transactions to QuickBooks</p>
      </div>

      {/* Date Range Filter */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
          <CardDescription>
            Select a date range to filter transactions (leave empty for all transactions)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Status */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle>Export Status</CardTitle>
          <CardDescription>
            {startDate || endDate 
              ? `Transactions from ${startDate || 'beginning'} to ${endDate || 'today'}`
              : "Overview of all transactions ready for export"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Total Transactions</p>
              </div>
              <p className="text-2xl font-bold">{totalTransactions}</p>
            </div>
            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm font-medium">Categorized</p>
              </div>
              <p className="text-2xl font-bold text-green-600">{categorized}</p>
            </div>
            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <p className="text-sm font-medium">Uncategorized</p>
              </div>
              <p className="text-2xl font-bold text-orange-600">{uncategorized}</p>
            </div>
          </div>

          {uncategorized > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You have {uncategorized} uncategorized transaction(s). Consider categorizing them before export for better organization in QuickBooks.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button 
              onClick={handleExport} 
              disabled={isExporting || totalTransactions === 0}
              size="lg"
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "Generating Export..." : "Export to QuickBooks"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Format Information */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle>Export Format</CardTitle>
          <CardDescription>
            Understanding the QuickBooks CSV format
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">CSV Structure</h4>
            <p className="text-sm text-muted-foreground">
              The exported CSV file includes the following columns:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li><strong>Date:</strong> Transaction date (MM/DD/YYYY format)</li>
              <li><strong>Description:</strong> Transaction type and category (e.g., "Bitcoin received - Contractor Payments")</li>
              <li><strong>Credit:</strong> Amount for received transactions (money in)</li>
              <li><strong>Debit:</strong> Amount for sent transactions (money out)</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              Note: QuickBooks standard format uses Date, Description, Credit, Debit. Each row has either Credit OR Debit (not both).
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Import to QuickBooks</h4>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
              <li>Download the CSV export file</li>
              <li>Open QuickBooks and go to Banking → Upload Transactions</li>
              <li>Select "Upload from file" and choose the CSV</li>
              <li>Map the columns if prompted</li>
              <li>Review and confirm the import</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Categories</h4>
            <p className="text-sm text-muted-foreground">
              You have {categories?.length || 0} categor{categories?.length === 1 ? 'y' : 'ies'} configured:
            </p>
            {categories && categories.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat: any) => (
                  <div key={cat.id} className="text-sm border rounded p-2">
                    <p className="font-medium">{cat.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {cat.quickbooksAccount || "No QB account mapped"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  No categories configured. Create categories to better organize your exports.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
