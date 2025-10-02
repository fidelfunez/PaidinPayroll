import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { useBtcRate } from "@/hooks/use-btc-rate-context";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  BarChart3, 
  Download,
  Eye,
  FileText,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Bitcoin
} from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";

interface FinancialData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  btcBalance: number;
  monthlyGrowth: number;
  quarterlyGrowth: number;
  recentTransactions: Array<{
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    btcAmount: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
    btcAmount: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
}

export default function AccountingPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { rate: btcRate } = useBtcRate();

  // Mock data for demonstration - consistent with payroll data
  const mockFinancialData: FinancialData = {
    totalRevenue: 85000,
    totalExpenses: 65000,
    netProfit: 20000,
    btcBalance: 2.0,
    monthlyGrowth: 8.5,
    quarterlyGrowth: 15.2,
    recentTransactions: [
      {
        id: '1',
        date: '2025-01-15',
        description: 'Client Payment - Web Development',
        amount: 12000,
        type: 'income',
        category: 'Services',
        btcAmount: 0.29
      },
      {
        id: '2',
        date: '2025-01-14',
        description: 'Office Rent Payment',
        amount: 2800,
        type: 'expense',
        category: 'Office',
        btcAmount: 0.07
      },
      {
        id: '3',
        date: '2025-01-13',
        description: 'Software Subscriptions',
        amount: 950,
        type: 'expense',
        category: 'Technology',
        btcAmount: 0.02
      },
      {
        id: '4',
        date: '2025-01-12',
        description: 'Consulting Services',
        amount: 6800,
        type: 'income',
        category: 'Services',
        btcAmount: 0.16
      },
      {
        id: '5',
        date: '2025-01-11',
        description: 'Marketing Campaign',
        amount: 1800,
        type: 'expense',
        category: 'Marketing',
        btcAmount: 0.04
      }
    ],
    categoryBreakdown: [
      { category: 'Services', amount: 51000, percentage: 60, btcAmount: 1.21 },
      { category: 'Office', amount: 10200, percentage: 12, btcAmount: 0.24 },
      { category: 'Technology', amount: 8500, percentage: 10, btcAmount: 0.20 },
      { category: 'Marketing', amount: 5100, percentage: 6, btcAmount: 0.12 },
      { category: 'Other', amount: 10200, percentage: 12, btcAmount: 0.24 }
    ],
    monthlyTrends: [
      { month: 'Oct', revenue: 65000, expenses: 55000, profit: 10000 },
      { month: 'Nov', revenue: 72000, expenses: 58000, profit: 14000 },
      { month: 'Dec', revenue: 78000, expenses: 62000, profit: 16000 },
      { month: 'Jan', revenue: 85000, expenses: 65000, profit: 20000 }
    ]
  };

  const formatUsd = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatBtc = (amount: number) => {
    return `${amount.toFixed(8)} BTC`;
  };

  // Calculate BTC amounts dynamically based on current rate
  const calculateBtcAmount = (usdAmount: number) => {
    return btcRate ? usdAmount / btcRate : 0;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16 lg:ml-16' : 'ml-16 lg:ml-64'}`}>
        <Header 
          title="Accounting" 
          subtitle="Bitcoin-integrated financial management"
        />
        
        <main className="p-4 lg:p-6 space-y-6">
          {/* Financial Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatUsd(mockFinancialData.totalRevenue)}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                  <span>+{mockFinancialData.monthlyGrowth}% from last month</span>
                </div>
                <div className="flex items-center text-xs text-orange-600 mt-1">
                  <Bitcoin className="h-3 w-3 mr-1" />
                  <span>{formatBtc(calculateBtcAmount(mockFinancialData.totalRevenue))}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatUsd(mockFinancialData.totalExpenses)}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <ArrowDownRight className="h-3 w-3 text-red-600 mr-1" />
                  <span>+5.2% from last month</span>
                </div>
                <div className="flex items-center text-xs text-orange-600 mt-1">
                  <Bitcoin className="h-3 w-3 mr-1" />
                  <span>{formatBtc(calculateBtcAmount(mockFinancialData.totalExpenses))}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{formatUsd(mockFinancialData.netProfit)}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                  <span>+{mockFinancialData.quarterlyGrowth}% quarterly growth</span>
                </div>
                <div className="flex items-center text-xs text-orange-600 mt-1">
                  <Bitcoin className="h-3 w-3 mr-1" />
                  <span>{formatBtc(calculateBtcAmount(mockFinancialData.netProfit))}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">BTC Balance</CardTitle>
                <Bitcoin className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{formatBtc(mockFinancialData.btcBalance)}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <span>≈ {formatUsd(btcRate ? mockFinancialData.btcBalance * btcRate : 0)}</span>
                </div>
                <div className="flex items-center text-xs text-green-600 mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  <span>+8.3% this month</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Analytics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Revenue by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockFinancialData.categoryBreakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                        <span className="text-sm font-medium">{item.category}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">{formatUsd(item.amount)}</div>
                        <div className="text-xs text-orange-600">{formatBtc(calculateBtcAmount(item.amount))}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Monthly Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockFinancialData.monthlyTrends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="font-medium">{trend.month} 2025</div>
                      <div className="text-right">
                        <div className="text-sm text-green-600 font-medium">{formatUsd(trend.revenue)}</div>
                        <div className="text-xs text-red-600">{formatUsd(trend.expenses)}</div>
                        <div className="text-xs text-blue-600 font-bold">{formatUsd(trend.profit)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Transactions
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockFinancialData.recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.type === 'income' ? (
                          <ArrowUpRight className="h-5 w-5 text-green-600" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-sm text-muted-foreground">{transaction.category} • {transaction.date}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatUsd(transaction.amount)}
                      </div>
                      <div className="text-sm text-orange-600">{formatBtc(calculateBtcAmount(transaction.amount))}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
