import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Loader2, TrendingUp, Clock, DollarSign, Users, CheckSquare, FileBarChart, Receipt, Wallet, Calendar, AlertCircle, CreditCard } from "lucide-react";
import { useState, useEffect } from "react";
import { SchedulePayrollModal } from "@/components/modals/schedule-payroll-modal";
import { ExpenseModal } from "@/components/modals/expense-modal";
import { WalletBackupModal } from "@/components/WalletBackupModal";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { useBitcoinQuotes } from "@/hooks/use-bitcoin-quotes";
import { useBtcRateProvider } from "@/hooks/use-btc-rate-context";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { createWallet } from "@/lib/breez-wallet";
import { useToast } from "@/hooks/use-toast";
import { differenceInDays, differenceInHours, isAfter, formatDistanceToNow } from "date-fns";

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

// Trial Countdown Banner Component
function TrialCountdownBanner({ trialEndDate, plan }: { trialEndDate: Date; plan: string }) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [daysRemaining, setDaysRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const end = new Date(trialEndDate);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining('Trial expired');
        setDaysRemaining(0);
        return;
      }

      setIsExpired(false);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      setDaysRemaining(days);
      setTimeRemaining(days > 0 ? `${days} day${days !== 1 ? 's' : ''} and ${hours} hour${hours !== 1 ? 's' : ''}` : `${hours} hour${hours !== 1 ? 's' : ''}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [trialEndDate]);

  const planNames: Record<string, string> = {
    starter: 'Starter',
    growth: 'Growth',
    scale: 'Scale',
  };

  if (isExpired) {
    return (
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">Trial Expired</h3>
              <p className="text-sm text-gray-600">Add a payment method to continue using {planNames[plan] || plan} plan</p>
            </div>
          </div>
          <Button 
            className="bg-primary hover:bg-primary/90 text-white"
            onClick={() => window.location.href = '/payment'}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Add Payment Method
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border-2 border-orange-200 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <Clock className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">
              {daysRemaining <= 3 ? 'Trial Ending Soon' : 'Free Trial Active'}
            </h3>
            <p className="text-sm text-gray-600">
              {daysRemaining <= 3 
                ? `${timeRemaining} remaining on your ${planNames[plan] || plan} trial`
                : `${daysRemaining} days left in your free trial`}
            </p>
          </div>
        </div>
        <Button 
          variant="outline"
          className="border-orange-300 text-orange-700 hover:bg-orange-100"
          onClick={() => window.location.href = '/payment'}
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Add Payment Method
        </Button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isLoading: isAuthLoading, error: authError } = useAuth();
  const { isCollapsed } = useSidebar();
  const { currentQuote } = useBitcoinQuotes();
  const { updateRate, setLoading } = useBtcRateProvider();
  const { toast } = useToast();
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [walletMnemonic, setWalletMnemonic] = useState<string | null>(null);
  const [showWalletBackup, setShowWalletBackup] = useState(false);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [hasCheckedWallet, setHasCheckedWallet] = useState(false);
  const [walletCheckRetries, setWalletCheckRetries] = useState(0);

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Check if user has wallet when they first access dashboard (after email verification)
  useEffect(() => {
    const checkAndCreateWallet = async () => {
      // Wait for auth to finish loading
      if (isAuthLoading) {
        console.log('⏳ Waiting for auth to finish loading...');
        return;
      }

      if (!user || !user.emailVerified || hasCheckedWallet || isCreatingWallet) {
        if (!user?.emailVerified) {
          console.log('⏳ Waiting for user email verification...', { 
            user: user ? { id: user.id, emailVerified: user.emailVerified } : 'null' 
          });
        }
        return;
      }

      // Verify auth is actually working (no errors, user loaded)
      if (authError) {
        console.warn('⚠️ Auth error detected, skipping wallet check:', authError);
        return;
      }

      // Check if auth token exists before making request
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      if (!authToken) {
        if (walletCheckRetries >= 5) {
          console.warn('⚠️ Max retries reached waiting for auth token. Wallet check skipped.');
          return;
        }
        console.log('⏳ Waiting for auth token to be set...', { retries: walletCheckRetries });
        // Reset hasCheckedWallet so we can retry
        setHasCheckedWallet(false);
        setWalletCheckRetries(prev => prev + 1);
        // Retry after a delay
        setTimeout(() => {
          checkAndCreateWallet();
        }, 1000);
        return;
      }
      
      console.log('🔍 Checking for existing wallet...', { userId: user.id, email: user.email });
      setHasCheckedWallet(true);
      
      try {
        // Small delay to ensure auth is fully ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if wallet exists using authenticated request
        try {
          const response = await apiRequest('GET', '/api/wallets/employee');
          
          if (response.ok) {
            // Wallet exists - no need to create
            const walletData = await response.json();
            console.log('✅ Wallet already exists:', walletData);
            setWalletCheckRetries(0);
            return; // Exit - wallet already exists
          }
        } catch (checkError: any) {
          const errorMessage = checkError?.message || '';
          const is404 = errorMessage.includes('404') || errorMessage.includes('Not Found');
          const is401 = errorMessage.includes('401') || errorMessage.includes('Unauthorized');
          
          if (is401) {
            // Auth not ready - retry with limits
            if (walletCheckRetries >= 3) {
              console.warn('⚠️ Max retries reached for auth. Skipping wallet check.');
              return;
            }
            console.log('⏳ Auth not ready, retrying...', { retries: walletCheckRetries });
            setHasCheckedWallet(false);
            setWalletCheckRetries(prev => prev + 1);
            setTimeout(() => {
              checkAndCreateWallet();
            }, 2000);
            return;
          }
          
          // If 404, wallet doesn't exist - proceed to create
          if (!is404) {
            // Some other error - log but proceed anyway
            console.warn('⚠️ Unexpected error checking wallet:', errorMessage);
          }
        }
        
        // No wallet exists (404) or check failed - create one
        console.log('🔄 No wallet found, creating one...');
        setIsCreatingWallet(true);
        
        try {
          const walletResult = await createWallet('employee', user.email);
          console.log('✅ Wallet created successfully:', walletResult);
          setWalletMnemonic(walletResult.mnemonic);
          setShowWalletBackup(true);
          
          toast({
            title: "Welcome to PaidIn!",
            description: "Setting up your Bitcoin wallet...",
          });
          setWalletCheckRetries(0);
        } catch (walletError: any) {
          const errorMessage = walletError?.message || '';
          // Check if error is because wallet already exists (409 Conflict)
          if (errorMessage.includes('already') || errorMessage.includes('exists') || errorMessage.includes('409')) {
            console.log('ℹ️ Wallet already exists (created between check and creation), skipping');
          } else {
            console.error('❌ Wallet creation failed:', walletError);
            toast({
              title: "Wallet Setup",
              description: "Could not create wallet automatically. You can set it up later in settings.",
              variant: "default",
            });
          }
        } finally {
          setIsCreatingWallet(false);
        }
      } catch (error: any) {
        console.error('❌ Error in wallet check/creation flow:', error);
        setIsCreatingWallet(false);
      }
    };

    // Only check if user is verified
    if (user?.emailVerified) {
      // Small delay to ensure auth token is set after email verification
      const timer = setTimeout(() => {
        checkAndCreateWallet();
      }, 1000); // Increased delay to 1 second
      
      return () => clearTimeout(timer);
    }
  }, [user, hasCheckedWallet, isCreatingWallet, isAuthLoading, toast]);

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

  // Handle wallet backup confirmation
  const handleWalletBackupConfirmed = () => {
    setShowWalletBackup(false);
    setWalletMnemonic(null);
    toast({
      title: "Wallet ready!",
      description: "Your Bitcoin wallet is set up and ready to use.",
    });
  };

  const handleWalletBackupSkip = () => {
    setShowWalletBackup(false);
    setWalletMnemonic(null);
    toast({
      title: "Wallet created",
      description: "You can backup your recovery phrase later in settings.",
      variant: "default",
    });
  };

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
          {/* Trial Status Banner */}
          {user?.company?.subscriptionStatus === 'trial' && user?.company?.trialEndDate && (
            <TrialCountdownBanner 
              trialEndDate={new Date(user.company.trialEndDate)}
              plan={user.company.subscriptionPlan || 'starter'}
            />
          )}

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
      {walletMnemonic && (
        <WalletBackupModal
          open={showWalletBackup}
          mnemonic={walletMnemonic}
          onConfirmed={handleWalletBackupConfirmed}
          onSkip={handleWalletBackupSkip}
        />
      )}
    </div>
  );
}
