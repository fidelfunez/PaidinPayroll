import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { 
  TrendingUp, 
  AlertTriangle, 
  DollarSign,
  Bitcoin,
  Users,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  ArrowUp,
  ArrowDown
} from "lucide-react";

export default function FinancialAnalyticsPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();

  // Check if user is super admin
  if (user?.role !== 'super_admin') {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You need super administrator privileges to view financial analytics.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Mock financial data
  const financialData = {
    totalPayroll: 125000,
    totalReimbursements: 8500,
    totalBitcoinSent: 3.2,
    currentBtcRate: 41666.67,
    monthlyGrowth: 12.5,
    employeeCount: 25,
    avgSalary: 5000,
    btcHolding: 15.8
  };

  const monthlyData = [
    { month: "Jan", payroll: 120000, reimbursements: 7500, btcSent: 2.9 },
    { month: "Feb", payroll: 125000, reimbursements: 8200, btcSent: 3.1 },
    { month: "Mar", payroll: 130000, reimbursements: 8500, btcSent: 3.2 },
    { month: "Apr", payroll: 128000, reimbursements: 7800, btcSent: 3.0 },
    { month: "May", payroll: 135000, reimbursements: 9200, btcSent: 3.4 },
    { month: "Jun", payroll: 140000, reimbursements: 8800, btcSent: 3.3 }
  ];

  const topEmployees = [
    { name: "John Doe", salary: 8000, btcReceived: 0.19 },
    { name: "Jane Smith", salary: 7500, btcReceived: 0.18 },
    { name: "Mike Johnson", salary: 7000, btcReceived: 0.17 },
    { name: "Sarah Wilson", salary: 6500, btcReceived: 0.16 },
    { name: "David Brown", salary: 6000, btcReceived: 0.14 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-background to-gray-50 flex">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16 lg:ml-16' : 'ml-16 lg:ml-64'}`}>
        <Header 
          title="Financial Analytics" 
          subtitle="Comprehensive financial insights and Bitcoin analytics"
        />
        <main className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <TrendingUp className="h-6 w-6 text-orange-600" />
        <h1 className="text-3xl font-bold">Financial Analytics</h1>
        <Badge variant="destructive">Super Admin Only</Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${financialData.totalPayroll.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUp className="h-3 w-3 text-green-600 mr-1" />
              +{financialData.monthlyGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bitcoin Sent</CardTitle>
            <Bitcoin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialData.totalBitcoinSent} BTC</div>
            <p className="text-xs text-muted-foreground">
              ${(financialData.totalBitcoinSent * financialData.currentBtcRate).toLocaleString()} USD
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialData.employeeCount}</div>
            <p className="text-xs text-muted-foreground">
              Avg salary: ${financialData.avgSalary.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">BTC Holdings</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialData.btcHolding} BTC</div>
            <p className="text-xs text-muted-foreground">
              ${(financialData.btcHolding * financialData.currentBtcRate).toLocaleString()} USD
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Monthly Trends</span>
            </CardTitle>
            <CardDescription>
              Payroll and reimbursement trends over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyData.map((data, index) => (
                <div key={data.month} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 text-sm font-medium">{data.month}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-orange-100 h-2 rounded">
                          <div 
                            className="bg-orange-600 h-2 rounded" 
                            style={{ width: `${(data.payroll / 150000) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">${data.payroll.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="w-20 bg-blue-100 h-2 rounded">
                          <div 
                            className="bg-blue-600 h-2 rounded" 
                            style={{ width: `${(data.reimbursements / 10000) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          ${data.reimbursements.toLocaleString()} reimbursements
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-medium">
                    {data.btcSent} BTC
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Employees */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5" />
              <span>Top Employees by Salary</span>
            </CardTitle>
            <CardDescription>
              Highest paid employees and their Bitcoin allocations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topEmployees.map((employee, index) => (
                <div key={employee.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{employee.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {employee.btcReceived} BTC received
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${employee.salary.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">monthly</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bitcoin Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bitcoin className="h-5 w-5" />
            <span>Bitcoin Performance</span>
          </CardTitle>
          <CardDescription>
            Bitcoin price impact on payroll costs and holdings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                ${financialData.currentBtcRate.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Current BTC Rate</div>
              <div className="text-xs text-green-600 flex items-center justify-center mt-1">
                <ArrowUp className="h-3 w-3 mr-1" />
                +5.2% today
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold">
                ${(financialData.totalBitcoinSent * financialData.currentBtcRate).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total BTC Value Sent</div>
              <div className="text-xs text-muted-foreground">
                {financialData.totalBitcoinSent} BTC
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold">
                ${(financialData.btcHolding * financialData.currentBtcRate).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Current Holdings Value</div>
              <div className="text-xs text-muted-foreground">
                {financialData.btcHolding} BTC
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common financial operations and reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              Generate Monthly Report
            </Button>
            <Button variant="outline">
              <DollarSign className="h-4 w-4 mr-2" />
              Export Financial Data
            </Button>
            <Button variant="outline">
              <Bitcoin className="h-4 w-4 mr-2" />
              BTC Performance Report
            </Button>
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Employee Cost Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
        </main>
        <Footer />
      </div>
    </div>
  );
}
