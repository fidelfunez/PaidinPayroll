import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { Crown, Construction } from "lucide-react";

interface PlatformPlaceholderPageProps {
  title: string;
  subtitle: string;
  description: string;
}

export default function PlatformPlaceholderPage({ 
  title, 
  subtitle, 
  description 
}: PlatformPlaceholderPageProps) {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();

  // Check if user is platform admin
  if (user?.role !== 'platform_admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-background to-gray-50 flex">
        <Sidebar />
        <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16 lg:ml-16' : 'ml-16 lg:ml-64'}`}>
          <Header 
            title={title} 
            subtitle="Access Denied"
          />
          <main className="container mx-auto p-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Crown className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Platform Admin Access Required</h2>
                  <p className="text-muted-foreground">
                    You need platform administrator privileges to access this page.
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-background to-gray-50 flex">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16 lg:ml-16' : 'ml-16 lg:ml-64'}`}>
        <Header 
          title={title} 
          subtitle={subtitle}
        />
        <main className="container mx-auto p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Construction className="h-5 w-5" />
                Coming Soon
              </CardTitle>
              <CardDescription>
                This feature is under development
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Construction className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{title}</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {description}
                </p>
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    This page will be available in a future update. For now, you can use the 
                    <strong> Platform Dashboard</strong> to access the core platform management features.
                  </p>
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

// Export specific page components
export function PlatformStaffPage() {
  return (
    <PlatformPlaceholderPage
      title="All Staff"
      subtitle="View and manage all staff across all companies"
      description="Monitor all employees, admins, and super admins across the entire PaidIn platform. View role distributions, activity levels, and manage permissions."
    />
  );
}

export function PlatformAnalyticsPage() {
  return (
    <PlatformPlaceholderPage
      title="Platform Analytics"
      subtitle="Comprehensive analytics and insights"
      description="Access detailed analytics about platform usage, growth metrics, revenue trends, and user engagement across all companies."
    />
  );
}

export function PlatformSubscriptionsPage() {
  return (
    <PlatformPlaceholderPage
      title="Subscription Management"
      subtitle="Manage all company subscriptions"
      description="Oversee subscription plans, billing cycles, payment status, and subscription health across all companies on the platform."
    />
  );
}

export function PlatformRevenuePage() {
  return (
    <PlatformPlaceholderPage
      title="Revenue Analytics"
      subtitle="Track platform revenue and financial metrics"
      description="Monitor monthly recurring revenue, subscription growth, churn rates, and financial performance across the entire platform."
    />
  );
}

export function PlatformHealthPage() {
  return (
    <PlatformPlaceholderPage
      title="System Health"
      subtitle="Monitor platform performance and health"
      description="Track system performance, API health, database metrics, and overall platform stability and uptime."
    />
  );
}

export function PlatformAuditPage() {
  return (
    <PlatformPlaceholderPage
      title="Audit Logs"
      subtitle="Platform-wide audit and activity logs"
      description="View comprehensive audit logs of all platform activities, user actions, system changes, and security events."
    />
  );
}

export function PlatformSupportPage() {
  return (
    <PlatformPlaceholderPage
      title="Customer Support"
      subtitle="Manage customer support and tickets"
      description="Handle customer support requests, manage tickets, track resolution times, and provide assistance to all platform users."
    />
  );
}

export function PlatformSettingsPage() {
  return (
    <PlatformPlaceholderPage
      title="Platform Settings"
      subtitle="Configure platform-wide settings"
      description="Manage global platform settings, feature flags, system configurations, and platform-wide policies."
    />
  );
}

export function PlatformDocsPage() {
  return (
    <PlatformPlaceholderPage
      title="Documentation"
      subtitle="Platform documentation and guides"
      description="Access comprehensive documentation, API guides, integration instructions, and platform usage guides."
    />
  );
}
