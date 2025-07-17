import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, DollarSign, Receipt, FileText, Settings, LogOut, User, Menu, X,
  Users, CreditCard, CheckSquare, Download, Shield, MessageSquare, 
  Clock, Calendar, Gift, Wallet, Bell, FolderOpen, FileBarChart, ChevronDown, ChevronRight,
  TrendingUp, Building2, Layers, Target, Search, Archive, Award, Banknote, 
  ScrollText, PieChart, Mail, Zap, Globe, Settings2, FileSpreadsheet
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { isCollapsed, toggleSidebar, expandedSections, toggleSection } = useSidebar();
  const isMobile = useIsMobile();

  const employeeNavigation = [
    {
      id: 'overview',
      title: 'Overview',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
        { name: 'My Expenses', href: '/my-expenses', icon: Receipt },
        { name: 'Invoices', href: '/invoices', icon: ScrollText },
      ]
    },
    {
      id: 'time',
      title: 'Time & Leave',
      items: [
        { name: 'Time Tracking', href: '/time-tracking', icon: Clock },
        { name: 'Time Off', href: '/time-off', icon: Calendar },
      ]
    },
    {
      id: 'personal',
      title: 'Personal',
      items: [
        { name: 'Profile', href: '/profile', icon: User },
        { name: 'Files', href: '/files', icon: FolderOpen },
        { name: 'Benefits', href: '/benefits', icon: Award },
      ]
    },
    {
      id: 'finance',
      title: 'Finance & Tax',
      items: [
        { name: 'Withdrawal Method', href: '/withdrawal-method', icon: Wallet },
        { name: 'Tax & Compliance', href: '/tax-compliance', icon: Shield },
      ]
    },
    {
      id: 'communication',
      title: 'Communication',
      items: [
        { name: 'Notifications', href: '/notifications', icon: Bell },
        { name: 'Messages', href: '/messages', icon: Mail },
      ]
    },
    {
      id: 'settings',
      title: 'Settings',
      items: [
        { name: 'Settings', href: '/settings', icon: Settings },
      ]
    }
  ];

  const adminNavigation = [
    {
      id: 'overview',
      title: 'Overview',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
        { name: 'Employees', href: '/employees', icon: Users },
      ]
    },
    {
      id: 'finance',
      title: 'Finance & Payroll',
      items: [
        { name: 'Payroll', href: '/payroll', icon: DollarSign },
        { name: 'Bulk Payroll', href: '/bulk-payroll', icon: Zap },
        { name: 'Reimbursements', href: '/reimbursements', icon: Receipt },
        { name: 'Withdrawal Methods', href: '/withdrawal-methods', icon: CreditCard },
      ]
    },
    {
      id: 'business',
      title: 'Business Operations',
      items: [
        { name: 'Invoicing', href: '/invoicing', icon: FileSpreadsheet },
        { name: 'Onboarding', href: '/onboarding', icon: Target },
        { name: 'Integrations', href: '/integrations', icon: Globe },
      ]
    },
    {
      id: 'approval',
      title: 'Approvals & Tasks',
      items: [
        { name: 'Approvals', href: '/approvals', icon: CheckSquare },
        { name: 'Audit Logs', href: '/audit-logs', icon: Search },
      ]
    },
    {
      id: 'reports',
      title: 'Reports & Documents',
      items: [
        { name: 'Invoices & Reports', href: '/reports', icon: PieChart },
        { name: 'PDF Payslips', href: '/payslips', icon: Download },
        { name: 'Tax & Compliance', href: '/admin-tax-compliance', icon: Shield },
      ]
    },
    {
      id: 'communication',
      title: 'Communication',
      items: [
        { name: 'Messages', href: '/admin-messages', icon: MessageSquare },
      ]
    },
    {
      id: 'settings',
      title: 'Settings',
      items: [
        { name: 'Settings', href: '/settings', icon: Settings },
      ]
    }
  ];

  const navigation = user?.role === 'admin' ? adminNavigation : employeeNavigation;

  // Get main navigation items for mobile (first item from each section)
  const getMobileNavigation = () => {
    return navigation.map((section) => ({
      id: section.id,
      title: section.title,
      icon: section.items[0].icon, // Use first item's icon as section icon
      href: section.items[0].href, // Use first item's href as section link
    }));
  };

  const mobileNavigation = getMobileNavigation();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location === '/' || location === '/dashboard';
    }
    return location === href;
  };

  const renderNavigationItem = (item: any) => (
    <Link
      key={item.href}
      href={item.href}
      className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive(item.href)
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      }`}
    >
      <item.icon className="w-4 h-4" />
      {!isCollapsed && <span>{item.name}</span>}
    </Link>
  );

  const renderSection = (section: any) => (
    <div key={section.id} className="space-y-1">
      {!isCollapsed && (
        <div className="flex items-center justify-between px-3 py-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {section.title}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSection(section.id)}
            className="h-4 w-4 p-0"
          >
            {expandedSections.has(section.id) ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </Button>
        </div>
      )}
      {expandedSections.has(section.id) && (
        <div className="space-y-1">
          {section.items.map(renderNavigationItem)}
        </div>
      )}
    </div>
  );

  const renderMobileNavigation = () => (
    <div className="space-y-2">
      {mobileNavigation.map((section) => (
        <Link
          key={section.href}
          href={section.href}
          className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive(section.href)
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
        >
          <section.icon className="w-4 h-4" />
          <span>{section.title}</span>
        </Link>
      ))}
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      {isMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" />
          <div className="fixed left-0 top-0 h-full w-80 border-r bg-background p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">PaidIn</h2>
              <Button variant="ghost" size="sm" onClick={toggleSidebar}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            {renderMobileNavigation()}
            <div className="mt-auto pt-6 border-t">
              <div className="flex items-center space-x-3 px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-foreground">
                    {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-muted-foreground">{user?.role}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logoutMutation.mutate()}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div
        className={`fixed left-0 top-0 z-40 h-full border-r bg-background transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            {!isCollapsed && (
              <h2 className="text-lg font-semibold">PaidIn</h2>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="lg:hidden"
            >
              <Menu className="w-4 h-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-4 p-4">
            {isCollapsed ? (
              // Collapsed view - just icons
              <div className="space-y-2">
                {navigation.map((section) => (
                  <div key={section.id} className="space-y-1">
                    {section.items.map((item: any) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-center w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                          isActive(item.href)
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              // Expanded view - full navigation
              <div className="space-y-6">
                {navigation.map(renderSection)}
              </div>
            )}
          </nav>

          {/* User Profile */}
          {!isCollapsed && (
            <div className="border-t p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-foreground">
                    {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.role}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logoutMutation.mutate()}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
