import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Search, 
  Eye,
  Settings,
  Crown,
  UserCheck,
  UserX,
  Calendar,
  CreditCard
} from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";

interface PlatformOverview {
  totalCompanies: number;
  activeSubscriptions: number;
  totalEmployees: number;
  monthlyRevenue: number;
  newCompaniesThisMonth: number;
  subscriptionBreakdown: Record<string, number>;
}

interface CompanySummary {
  id: number;
  name: string;
  slug: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  subscriptionEndDate: string;
  employeeCount: number;
  maxEmployees: number;
  monthlyFee: number;
  paymentStatus: string;
  createdAt: string;
  staffBreakdown: {
    superAdmins: number;
    admins: number;
    employees: number;
  };
}

export default function PlatformDashboardPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const [searchTerm, setSearchTerm] = useState("");

  // Check if user is platform admin
  if (user?.role !== 'platform_admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-background to-gray-50 flex">
        <Sidebar />
        <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16 lg:ml-16' : 'ml-16 lg:ml-64'}`}>
          <Header 
            title="Platform Dashboard" 
            subtitle="Access Denied"
          />
          <main className="container mx-auto p-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Crown className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Platform Admin Access Required</h2>
                  <p className="text-muted-foreground">
                    You need platform administrator privileges to access this dashboard.
                  </p>
                </div>
              </CardContent>
            </Card>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  // Fetch platform overview data
  const { data: overview, isLoading: overviewLoading, error: overviewError } = useQuery<PlatformOverview>({
    queryKey: ["/api/platform/overview"],
    queryFn: getQueryFn({ on401: "throw" }),
    retry: 1,
  });

  // Fetch companies data
  const { data: companies, isLoading: companiesLoading, error: companiesError } = useQuery<CompanySummary[]>({
    queryKey: ["/api/platform/companies"],
    queryFn: getQueryFn({ on401: "throw" }),
    retry: 1,
  });

  // Filter companies based on search
  const filteredCompanies = (companies || []).filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getSubscriptionBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-100 text-yellow-800">Suspended</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'current':
        return <Badge className="bg-green-100 text-green-800">Current</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    const colors = {
      starter: 'bg-blue-100 text-blue-800',
      growth: 'bg-green-100 text-green-800',
      scale: 'bg-purple-100 text-purple-800',
      enterprise: 'bg-orange-100 text-orange-800'
    };
    return <Badge className={colors[plan as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
      {plan.charAt(0).toUpperCase() + plan.slice(1)}
    </Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-background to-gray-50 flex">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16 lg:ml-16' : 'ml-16 lg:ml-64'}`}>
        <Header 
          title="Platform Dashboard" 
          subtitle="Oversee all companies and users on the PaidIn platform"
        />
        <main className="container mx-auto p-6 space-y-6">
          {/* Error Messages */}
          {(overviewError || companiesError) && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="text-red-800">
                  <h3 className="font-semibold mb-2">Error loading data</h3>
                  {overviewError && <p>Overview: {overviewError.message}</p>}
                  {companiesError && <p>Companies: {companiesError.message}</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Platform Overview Cards */}
          {overviewLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview?.totalCompanies || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    +{overview?.newCompaniesThisMonth || 0} this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview?.activeSubscriptions || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {overview?.totalCompanies ? 
                      Math.round((overview.activeSubscriptions / overview.totalCompanies) * 100) : 0}% of total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview?.totalEmployees || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Across all companies
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(overview?.monthlyRevenue || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Recurring monthly revenue
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Subscription Breakdown */}
          {overview && overview.subscriptionBreakdown && (
            <Card>
              <CardHeader>
                <CardTitle>Subscription Plans</CardTitle>
                <CardDescription>Distribution of companies by subscription plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(overview.subscriptionBreakdown || {}).map(([plan, count]) => (
                    <div key={plan} className="text-center">
                      <div className="text-2xl font-bold">{count}</div>
                      <div className="text-sm text-muted-foreground capitalize">{plan}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Companies Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Companies</CardTitle>
                  <CardDescription>Manage and monitor all companies on the platform</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search companies..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {companiesLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{company.name}</div>
                            <div className="text-sm text-muted-foreground">@{company.slug}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getPlanBadge(company.subscriptionPlan)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{company.employeeCount}/{company.maxEmployees}</div>
                            <div className="text-muted-foreground">
                              {company.staffBreakdown.superAdmins} SA, {company.staffBreakdown.admins} A, {company.staffBreakdown.employees} E
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getSubscriptionBadge(company.subscriptionStatus)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{getPaymentBadge(company.paymentStatus)}</div>
                            <div className="text-muted-foreground">{formatCurrency(company.monthlyFee)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(company.subscriptionEndDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    </div>
  );
}
