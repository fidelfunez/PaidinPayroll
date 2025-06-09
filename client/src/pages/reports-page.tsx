import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Loader2, Download, FileText, Calendar } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";

export default function ReportsPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const [payrollDateRange, setPayrollDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [expenseDateRange, setExpenseDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const { data: btcRate } = useQuery<{ rate: number }>({
    queryKey: ['/api/btc-rate'],
  });

  const downloadCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      alert('No data available for export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPayrollReport = async () => {
    try {
      const params = new URLSearchParams();
      if (payrollDateRange.startDate) params.append('startDate', payrollDateRange.startDate);
      if (payrollDateRange.endDate) params.append('endDate', payrollDateRange.endDate);

      const response = await fetch(`/api/reports/payroll?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch payroll report');
      
      const data = await response.json();
      downloadCSV(data, 'payroll-report.csv');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export payroll report');
    }
  };

  const exportExpenseReport = async () => {
    try {
      const params = new URLSearchParams();
      if (expenseDateRange.startDate) params.append('startDate', expenseDateRange.startDate);
      if (expenseDateRange.endDate) params.append('endDate', expenseDateRange.endDate);

      const response = await fetch(`/api/reports/expenses?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch expense report');
      
      const data = await response.json();
      downloadCSV(data, 'expense-report.csv');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export expense report');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <div className={`transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          <Header 
            title="Reports" 
            subtitle="Access Denied"
            btcRate={btcRate?.rate}
          />
          <main className="p-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">You need admin access to view reports.</p>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className={`transition-all duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <Header 
          title="Reports" 
          subtitle="Export and analyze payroll and expense data"
          btcRate={btcRate?.rate}
        />
        
        <main className="p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reports</h1>
            <p className="text-muted-foreground mt-1">Export and analyze payroll and expense data</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payroll Reports */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Payroll Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="payroll-start-date">Start Date</Label>
                      <Input
                        id="payroll-start-date"
                        type="date"
                        value={payrollDateRange.startDate}
                        onChange={(e) => setPayrollDateRange(prev => ({
                          ...prev,
                          startDate: e.target.value
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="payroll-end-date">End Date</Label>
                      <Input
                        id="payroll-end-date"
                        type="date"
                        value={payrollDateRange.endDate}
                        onChange={(e) => setPayrollDateRange(prev => ({
                          ...prev,
                          endDate: e.target.value
                        }))}
                      />
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Export payroll payment history including Bitcoin conversions and transaction details.
                  </div>

                  <Button 
                    onClick={exportPayrollReport}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Payroll CSV
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Expense Reports */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Expense Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expense-start-date">Start Date</Label>
                      <Input
                        id="expense-start-date"
                        type="date"
                        value={expenseDateRange.startDate}
                        onChange={(e) => setExpenseDateRange(prev => ({
                          ...prev,
                          startDate: e.target.value
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="expense-end-date">End Date</Label>
                      <Input
                        id="expense-end-date"
                        type="date"
                        value={expenseDateRange.endDate}
                        onChange={(e) => setExpenseDateRange(prev => ({
                          ...prev,
                          endDate: e.target.value
                        }))}
                      />
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Export reimbursement history including approval status and Bitcoin payment details.
                  </div>

                  <Button 
                    onClick={exportExpenseReport}
                    className="w-full"
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Expense CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Report Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Report Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Payroll Reports Include:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Employee payment history</li>
                    <li>• USD and BTC amounts</li>
                    <li>• Exchange rates used</li>
                    <li>• Transaction hashes</li>
                    <li>• Payment status and dates</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">Expense Reports Include:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Expense categories and descriptions</li>
                    <li>• Approval workflow status</li>
                    <li>• USD to BTC conversions</li>
                    <li>• Approver information</li>
                    <li>• Payment timestamps</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">Data Format:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• CSV format for easy analysis</li>
                    <li>• All dates in ISO format</li>
                    <li>• BTC amounts to 8 decimals</li>
                    <li>• USD amounts to 2 decimals</li>
                    <li>• Complete audit trail</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    </div>
  );
}
