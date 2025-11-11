import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Loader2, TrendingUp, Clock, DollarSign, Users, CheckSquare, FileBarChart, Receipt, Wallet, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { SchedulePayrollModal } from "@/components/modals/schedule-payroll-modal";
import { ExpenseModal } from "@/components/modals/expense-modal";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { useBitcoinQuotes } from "@/hooks/use-bitcoin-quotes";
import { useBtcRateProvider } from "@/hooks/use-btc-rate-context";
import { getQueryFn } from "@/lib/queryClient";

interface DashboardStats {
  totalBtcBalance: number;
  totalBtcBalanceUsd: number;
  pendingPaymentsCount: number;
  pendingPaymentsAmount: number;
  monthlyPayrollUsd: number;
  activeEmployees: number;
  currentBtcRate: number;
  recentActivity: Array<{
    type: string;
    description: string;
    amount: string;
    date: string;
    status: string;
  }>;
}



export default function DashboardPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { currentQuote } = useBitcoinQuotes();
  const { updateRate, setLoading } = useBtcRateProvider();
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Update shared BTC rate when dashboard gets the data
  useEffect(() => {
    if (stats?.currentBtcRate) {
      updateRate(stats.currentBtcRate);
    }
    if (isLoading) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [stats?.currentBtcRate, isLoading, updateRate, setLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const formatBtc = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '0.00000000 BTC';
    return `${amount.toFixed(8)} BTC`;
  };
  const formatUsd = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '$0.00';
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-background to-gray-50 flex">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16 lg:ml-16' : 'ml-16 lg:ml-64'}`}>
        <Header 
          title="Dashboard" 
          subtitle="Overview of your business operations"
          btcRate={stats?.currentBtcRate}
        />
        
        <main className="p-4 lg:p-6 space-y-6 animate-fade-in">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 rounded-2xl p-6 lg:p-8 text-white shadow-xl border border-orange-400/20 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl"></div>
                    <div className="relative bg-white/20 backdrop-blur-md rounded-2xl p-2 border border-white/30 shadow-lg">
                      <img 
                        src="/app - graphic designs/Bitcoin - logo - yellow.png" 
                        alt="Bitcoin Logo" 
                        className="w-12 h-12 lg:w-14 lg:h-14"
                      />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">
                      Welcome back, {user?.firstName || 'User'}!
                    </h2>
                    <p className="text-orange-50 text-base lg:text-lg mt-1">
                      Ready to revolutionize your business with Bitcoin
                    </p>
                  </div>
                </div>
                {/* Bitcoin Quotes - Desktop Only */}
                <div className="hidden lg:block bg-white/15 backdrop-blur-md rounded-xl p-4 lg:p-5 border border-white/20 shadow-lg">
                  <p className="text-lg lg:text-xl font-semibold mb-2 leading-relaxed">
                    "{currentQuote.quote}"
                  </p>
                  <p className="text-orange-50 text-sm lg:text-base font-medium">
                    — {currentQuote.author} • {currentQuote.tagline}
                  </p>
                </div>
              </div>
              <div className="hidden lg:block relative">
                <div className="absolute inset-0 bg-white/10 rounded-3xl blur-2xl"></div>
                <div className="relative">
                  <img 
                    src="/app - graphic designs/Bitcoin - logo.png" 
                    alt="Bitcoin Logo" 
                    className="w-28 h-28 lg:w-36 lg:h-36 drop-shadow-2xl"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            <Card className="border-gray-200/80 bg-gradient-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total BTC Balance</p>
                    <p className="text-3xl font-bold text-foreground mt-2 tracking-tight">
                      {stats ? formatBtc(stats.totalBtcBalance) : '--'}
                    </p>
                    <p className="text-sm font-medium text-muted-foreground mt-2">
                      {stats ? `≈ ${formatUsd(stats.totalBtcBalanceUsd)}` : '--'}
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-bitcoin-100 to-bitcoin-200 rounded-xl flex items-center justify-center shadow-lg border border-bitcoin-300/50">
                    <svg className="w-7 h-7 text-bitcoin-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.546z"/>
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-gray-200/80 bg-gradient-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Pending Payments</p>
                    <p className="text-3xl font-bold text-foreground mt-2 tracking-tight">
                      {stats?.pendingPaymentsCount || 0}
                    </p>
                    <p className="text-sm font-medium text-muted-foreground mt-2">
                      {stats ? formatUsd(stats.pendingPaymentsAmount) : '--'}
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl flex items-center justify-center shadow-lg border border-yellow-300/50">
                    <Clock className="w-7 h-7 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-gray-200/80 bg-gradient-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">This Month</p>
                    <p className="text-3xl font-bold text-foreground mt-2 tracking-tight">
                      {stats ? formatUsd(stats.monthlyPayrollUsd) : '--'}
                    </p>
                    <p className="text-sm font-semibold text-green-600 mt-2 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      +12.5% from last month
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center shadow-lg border border-green-300/50">
                    <TrendingUp className="w-7 h-7 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card className="border-gray-200/80">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.recentActivity?.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50/80 transition-colors duration-200 group cursor-pointer">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md transition-transform duration-200 group-hover:scale-110 ${
                        activity.type === 'payroll' 
                          ? 'bg-gradient-to-br from-green-100 to-green-200 border border-green-300/50' 
                          : 'bg-gradient-to-br from-blue-100 to-blue-200 border border-blue-300/50'
                      }`}>
                        {activity.type === 'payroll' ? (
                          <DollarSign className={`w-4 h-4 ${
                            activity.type === 'payroll' 
                              ? 'text-green-600' 
                              : 'text-blue-600'
                          }`} />
                        ) : (
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(activity.date).toLocaleDateString()} • <span className="font-medium">{activity.status}</span>
                        </p>
                      </div>
                      <div className="text-base font-bold text-foreground">
                        {formatUsd(parseFloat(activity.amount))}
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No recent activity</p>
                    </div>
                  )}
                </div>
                
                <Button variant="ghost" className="w-full mt-4 text-bitcoin-600 hover:text-bitcoin-700">
                  View all activity
                </Button>
              </CardContent>
            </Card>

            {/* Role-based Quick Actions */}
            <Card className="border-gray-200/80">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(user?.role === 'admin' || user?.role === 'super_admin') ? (
                  // Admin Quick Actions
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full justify-between h-auto p-4 hover:border-bitcoin-300 hover:bg-bitcoin-50"
                      onClick={() => setShowPayrollModal(true)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-bitcoin-100 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-bitcoin-600" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-foreground">Process Payroll</p>
                          <p className="text-sm text-muted-foreground">Schedule salary payments</p>
                        </div>
                      </div>
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                    
                    <Link href="/approvals">
                      <Button 
                        variant="outline"
                        className="w-full justify-between h-auto p-4 hover:border-red-300 hover:bg-red-50"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <CheckSquare className="w-5 h-5 text-red-600" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-foreground">Review Approvals</p>
                            <p className="text-sm text-muted-foreground">Pending requests</p>
                          </div>
                        </div>
                        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Button>
                    </Link>
                    
                    <Link href="/reports">
                      <Button 
                        variant="outline"
                        className="w-full justify-between h-auto p-4 hover:border-green-300 hover:bg-green-50"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <FileBarChart className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-foreground">Generate Reports</p>
                            <p className="text-sm text-muted-foreground">Download analytics</p>
                          </div>
                        </div>
                        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Button>
                    </Link>
                  </>
                ) : (
                  // Employee Quick Actions
                  <>
                    <Button 
                      variant="outline"
                      className="w-full justify-between h-auto p-4 hover:border-blue-300 hover:bg-blue-50"
                      onClick={() => setShowExpenseModal(true)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Receipt className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-foreground">Submit Expense</p>
                          <p className="text-sm text-muted-foreground">File reimbursement claim</p>
                        </div>
                      </div>
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                    
                    <Link href="/withdrawal-method">
                      <Button 
                        variant="outline"
                        className="w-full justify-between h-auto p-4 hover:border-orange-300 hover:bg-orange-50"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-orange-600" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-foreground">Update Wallet</p>
                            <p className="text-sm text-muted-foreground">Manage Bitcoin address</p>
                          </div>
                        </div>
                        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Button>
                    </Link>
                    
                    <Link href="/time-off">
                      <Button 
                        variant="outline"
                        className="w-full justify-between h-auto p-4 hover:border-purple-300 hover:bg-purple-50"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-foreground">Request Time Off</p>
                            <p className="text-sm text-muted-foreground">Submit leave request</p>
                          </div>
                        </div>
                        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Button>
                    </Link>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>

      <SchedulePayrollModal 
        open={showPayrollModal} 
        onOpenChange={setShowPayrollModal} 
      />
      <ExpenseModal 
        open={showExpenseModal} 
        onOpenChange={setShowExpenseModal} 
      />
    </div>
  );
}
