import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Download, Search, Calendar, FileText, Eye } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { useBtcRate } from "@/hooks/use-btc-rate-context";

interface PayslipRecord {
  id: number;
  employeeId: number;
  employeeName: string;
  payPeriod: string;
  grossPay: number;
  netPay: number;
  btcAmount: number;
  btcRate: number;
  generatedDate: string;
  status: 'generated' | 'sent' | 'downloaded';
}

export default function PayslipsPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { rate: btcRate } = useBtcRate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("all");

  const { data: employees } = useQuery({
    queryKey: ['/api/employees']
  });

  const { data: payrollPayments } = useQuery({
    queryKey: ['/api/payroll']
  });

  // Generate payslip records from real payroll data
  const payslipRecords: PayslipRecord[] = Array.isArray(payrollPayments) && Array.isArray(employees) 
    ? payrollPayments.map(payment => {
        const employee = employees.find(emp => emp.id === payment.userId);
        return {
          id: payment.id,
          employeeId: payment.userId,
          employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee',
          payPeriod: new Date(payment.createdAt).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long' 
          }),
          grossPay: parseFloat(payment.amountUsd),
          netPay: parseFloat(payment.amountUsd) * 0.85, // Assuming 15% deductions
          btcAmount: parseFloat(payment.amountBtc || '0'),
          btcRate: parseFloat(payment.amountUsd) / parseFloat(payment.amountBtc || '1'),
          generatedDate: new Date(payment.createdAt).toLocaleDateString(),
          status: payment.status === 'completed' ? 'sent' : 'generated'
        };
      })
    : [];

  const filteredPayslips = payslipRecords.filter(payslip => {
    const matchesSearch = payslip.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payslip.payPeriod.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPeriod = selectedPeriod === "all" || payslip.payPeriod.includes(selectedPeriod);
    return matchesSearch && matchesPeriod;
  });

  const formatCurrency = (amount: number) => 
    `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatBtc = (amount: number) => 
    `${amount.toFixed(8)} BTC`;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-100 text-green-800">Sent</Badge>;
      case 'downloaded':
        return <Badge className="bg-blue-100 text-blue-800">Downloaded</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Generated</Badge>;
    }
  };

  const generatePayslip = (payslip: PayslipRecord) => {
    // In a real application, this would generate a PDF payslip
    const payslipData = {
      employee: payslip.employeeName,
      period: payslip.payPeriod,
      grossPay: formatCurrency(payslip.grossPay),
      netPay: formatCurrency(payslip.netPay),
      btcAmount: formatBtc(payslip.btcAmount),
      btcRate: formatCurrency(payslip.btcRate),
      generatedDate: payslip.generatedDate
    };

    const content = `
PAYSLIP - ${payslipData.period}
Employee: ${payslipData.employee}
Generated: ${payslipData.generatedDate}

EARNINGS:
Gross Pay: ${payslipData.grossPay}
Net Pay: ${payslipData.netPay}

BITCOIN PAYMENT:
Amount: ${payslipData.btcAmount}
BTC Rate: ${payslipData.btcRate}

This payslip confirms Bitcoin salary payment for the specified period.
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payslip_${payslip.employeeName.replace(' ', '_')}_${payslip.payPeriod.replace(' ', '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateBulkPayslips = () => {
    filteredPayslips.forEach(payslip => {
      setTimeout(() => generatePayslip(payslip), 100);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Header 
          title="PDF Payslips" 
          subtitle="Generate and manage employee payslips"
          btcRate={btcRate}
        />
        
        <main className="flex-1 p-4 lg:p-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">PDF Payslips</h1>
              <p className="text-muted-foreground mt-1">Generate and download Bitcoin payslips for employees</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={generateBulkPayslips} className="bg-primary hover:bg-primary/90">
                <Download className="w-4 h-4 mr-2" />
                Download All
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Payslips</p>
                    <p className="text-2xl font-bold">{payslipRecords.length}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">This Month</p>
                    <p className="text-2xl font-bold">
                      {payslipRecords.filter(p => 
                        new Date(p.generatedDate).getMonth() === new Date().getMonth()
                      ).length}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Paid (USD)</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(payslipRecords.reduce((sum, p) => sum + p.netPay, 0))}
                    </p>
                  </div>
                  <Download className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by employee name or pay period..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Periods</option>
                  <option value="2025">2025</option>
                  <option value="March">March 2025</option>
                  <option value="February">February 2025</option>
                  <option value="January">January 2025</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Payslips Table */}
          <Card>
            <CardHeader>
              <CardTitle>Payslip Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Pay Period</TableHead>
                      <TableHead>Gross Pay</TableHead>
                      <TableHead>Net Pay</TableHead>
                      <TableHead>BTC Amount</TableHead>
                      <TableHead>Generated</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayslips.map((payslip) => (
                      <TableRow key={payslip.id}>
                        <TableCell className="font-medium">
                          {payslip.employeeName}
                        </TableCell>
                        <TableCell>{payslip.payPeriod}</TableCell>
                        <TableCell>{formatCurrency(payslip.grossPay)}</TableCell>
                        <TableCell>{formatCurrency(payslip.netPay)}</TableCell>
                        <TableCell>{formatBtc(payslip.btcAmount)}</TableCell>
                        <TableCell>{payslip.generatedDate}</TableCell>
                        <TableCell>{getStatusBadge(payslip.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => generatePayslip(payslip)}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {filteredPayslips.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-muted-foreground">No payslips found</p>
                  <p className="text-sm text-muted-foreground">Payslips will appear here after payroll processing</p>
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