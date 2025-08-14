import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Loader2, TrendingUp, Clock, DollarSign, Users, CheckSquare, FileBarChart, Receipt, Wallet, Calendar } from "lucide-react";
import { useState } from "react";
import { SchedulePayrollModal } from "@/components/modals/schedule-payroll-modal";
import { ExpenseModal } from "@/components/modals/expense-modal";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { useBitcoinQuotes } from "@/hooks/use-bitcoin-quotes";
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
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    queryFn: getQueryFn({ on401: "throw" }),
  });

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
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16 lg:ml-16' : 'ml-16 lg:ml-64'}`}>
        <Header 
          title="Dashboard" 
          subtitle="Overview of your Bitcoin payroll operations"
          btcRate={stats?.currentBtcRate}
        />
        
        <main className="p-4 lg:p-6 space-y-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 lg:p-6 text-white shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-xl lg:text-2xl">₿</span>
                  </div>
                  <div>
                    <h2 className="text-xl lg:text-2xl font-bold">
                      Welcome back, {user?.firstName || 'User'}!
                    </h2>
                    <p className="text-orange-100 text-sm lg:text-base">
                      Ready to revolutionize payroll with Bitcoin
                    </p>
                  </div>
                </div>
                {/* Bitcoin Quotes - Desktop Only */}
                <div className="hidden lg:block bg-white/10 rounded-lg p-3 lg:p-4 backdrop-blur-sm">
                  <p className="text-base lg:text-lg font-medium mb-2 leading-relaxed">
                    "{currentQuote.quote}"
                  </p>
                  <p className="text-orange-100 text-xs lg:text-sm">
                    — {currentQuote.author} • {currentQuote.tagline}
                  </p>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="w-24 h-24 lg:w-32 lg:h-32 bg-white/10 rounded-full flex items-center justify-center">
                  <span className="text-4xl lg:text-6xl">₿</span>
                </div>
              </div>
            </div>
          </div>

          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total BTC Balance</p>
                    <p className="text-2xl font-bold text-foreground mt-2">
                      {stats ? formatBtc(stats.totalBtcBalance) : '--'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {stats ? `≈ ${formatUsd(stats.totalBtcBalanceUsd)}` : '--'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-bitcoin-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-bitcoin-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.546z"/>
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
                    <p className="text-2xl font-bold text-foreground mt-2">
                      {stats?.pendingPaymentsCount || 0}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {stats ? formatUsd(stats.pendingPaymentsAmount) : '--'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">This Month</p>
                    <p className="text-2xl font-bold text-foreground mt-2">
                      {stats ? formatUsd(stats.monthlyPayrollUsd) : '--'}
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      <TrendingUp className="w-3 h-3 inline mr-1" />
                      +12.5% from last month
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.recentActivity?.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        activity.type === 'payroll' 
                          ? 'bg-green-100' 
                          : 'bg-blue-100'
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
                        <p className="text-sm font-medium text-foreground">{activity.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(activity.date).toLocaleDateString()} • {activity.status}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-foreground">
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
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user?.role === 'admin' ? (
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
