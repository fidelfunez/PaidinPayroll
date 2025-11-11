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
  ScrollText, PieChart, Mail, Zap, HelpCircle, BookOpen, MessageCircle, 
  FileQuestion, Headphones, CreditCard as CreditCardIcon, History
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
        { name: 'Dashboard', href: '/', icon: BarChart3 },
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
      id: 'accounting',
      title: 'Accounting',
      items: [
        { name: 'Financial Dashboard', href: '/accounting', icon: PieChart },
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
      id: 'help',
      title: 'Help Center',
      items: [
        { name: 'Bitcoin Education', href: '/bitcoin-education', icon: BookOpen },
        { name: 'Getting Started', href: '/getting-started', icon: HelpCircle },
        { name: 'FAQ', href: '/faq', icon: FileQuestion },
        { name: 'Support', href: '/support', icon: Headphones },
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

  const superAdminNavigation = [
    {
      id: 'overview',
      title: 'Overview',
      items: [
        { name: 'Dashboard', href: '/', icon: BarChart3 },
        { name: 'Employees', href: '/employees', icon: Users },
        { name: 'Financial Analytics', href: '/financial-analytics', icon: TrendingUp },
      ]
    },
    {
      id: 'finance',
      title: 'Finance & Treasury',
      items: [
        { name: 'Bitcoin Wallet', href: '/wallet', icon: Wallet },
        { name: 'Payment Processing', href: '/process-payments', icon: Zap },
        { name: 'Payroll', href: '/payroll', icon: DollarSign },
        { name: 'Bulk Payroll', href: '/bulk-payroll', icon: Zap },
        { name: 'Reimbursements', href: '/reimbursements', icon: Receipt },
        { name: 'Transaction History', href: '/transactions', icon: History },
        { name: 'Withdrawal Methods', href: '/withdrawal-methods', icon: CreditCard },
        { name: 'Bitcoin Settings', href: '/bitcoin-settings', icon: Settings },
      ]
    },
    {
      id: 'accounting',
      title: 'Accounting',
      items: [
        { name: 'Accounting Dashboard', href: '/accounting', icon: PieChart },
        { name: 'Invoicing & Reports', href: '/reports', icon: FileText },
        { name: 'PDF Payslips', href: '/payslips', icon: Download },
      ]
    },
    {
      id: 'compliance',
      title: 'Global Compliance',
      items: [
        { name: 'Tax & Compliance', href: '/tax-compliance-dashboard', icon: Shield },
        { name: 'Audit Logs', href: '/audit-logs', icon: Search },
        { name: 'Approvals', href: '/approvals', icon: CheckSquare },
      ]
    },
    {
      id: 'communication',
      title: 'Communication',
      items: [
        { name: 'Messages', href: '/admin-messages', icon: MessageSquare },
        { name: 'Notifications', href: '/notifications', icon: Bell },
      ]
    },
    {
      id: 'help',
      title: 'Help Center',
      items: [
        { name: 'Bitcoin Education', href: '/bitcoin-education', icon: BookOpen },
        { name: 'Getting Started', href: '/getting-started', icon: HelpCircle },
        { name: 'FAQ', href: '/faq', icon: FileQuestion },
        { name: 'Support', href: '/support', icon: Headphones },
      ]
    },
    {
      id: 'advanced',
      title: 'Advanced Tools',
      items: [
        { name: 'Integrations', href: '/integrations', icon: Layers },
        { name: 'API Access', href: '/api-access', icon: Zap },
        { name: 'Settings', href: '/settings', icon: Settings },
      ]
    }
  ];

  const adminNavigation = [
    {
      id: 'overview',
      title: 'Overview',
      items: [
        { name: 'Dashboard', href: '/', icon: BarChart3 },
        { name: 'Employees', href: '/employees', icon: Users },
      ]
    },
    {
      id: 'finance',
      title: 'Finance & Payroll',
      items: [
        { name: 'Payroll Schedule', href: '/payroll', icon: DollarSign },
        { name: 'Bulk Payroll', href: '/bulk-payroll', icon: Zap },
        { name: 'Reimbursements', href: '/reimbursements', icon: Receipt },
        { name: 'Withdrawal Methods', href: '/withdrawal-methods', icon: CreditCard },
      ]
    },
    {
      id: 'accounting',
      title: 'Accounting',
      items: [
        { name: 'Accounting Dashboard', href: '/accounting', icon: PieChart },
        { name: 'Invoicing & Reports', href: '/reports', icon: FileText },
        { name: 'PDF Payslips', href: '/payslips', icon: Download },
      ]
    },
    {
      id: 'compliance',
      title: 'Global Compliance',
      items: [
        { name: 'Tax & Compliance', href: '/tax-compliance-dashboard', icon: Shield },
        { name: 'Audit Logs', href: '/audit-logs', icon: Search },
        { name: 'Approvals', href: '/approvals', icon: CheckSquare },
      ]
    },
    {
      id: 'communication',
      title: 'Communication',
      items: [
        { name: 'Messages', href: '/admin-messages', icon: MessageSquare },
        { name: 'Notifications', href: '/notifications', icon: Bell },
      ]
    },
    {
      id: 'help',
      title: 'Help Center',
      items: [
        { name: 'Bitcoin Education', href: '/bitcoin-education', icon: BookOpen },
        { name: 'Getting Started', href: '/getting-started', icon: HelpCircle },
        { name: 'FAQ', href: '/faq', icon: FileQuestion },
        { name: 'Support', href: '/support', icon: Headphones },
      ]
    },
    {
      id: 'advanced',
      title: 'Advanced Tools',
      items: [
        { name: 'Integrations', href: '/integrations', icon: Layers },
        { name: 'API Access', href: '/api-access', icon: Zap },
        { name: 'Settings', href: '/settings', icon: Settings },
      ]
    }
  ];

  const platformAdminNavigation = [
    {
      id: 'overview',
      title: 'Platform Overview',
      items: [
        { name: 'Dashboard', href: '/platform', icon: BarChart3 },
        { name: 'All Companies', href: '/platform/companies', icon: Building2 },
        { name: 'All Staff', href: '/platform/staff', icon: Users },
        { name: 'Analytics', href: '/platform/analytics', icon: TrendingUp },
      ]
    },
    {
      id: 'management',
      title: 'Platform Management',
      items: [
        { name: 'Subscriptions', href: '/platform/subscriptions', icon: CreditCard },
        { name: 'Revenue', href: '/platform/revenue', icon: DollarSign },
        { name: 'System Health', href: '/platform/health', icon: Shield },
        { name: 'Audit Logs', href: '/platform/audit', icon: Search },
      ]
    },
    {
      id: 'support',
      title: 'Support & Tools',
      items: [
        { name: 'Customer Support', href: '/platform/support', icon: HelpCircle },
        { name: 'Platform Settings', href: '/platform/settings', icon: Settings },
        { name: 'Documentation', href: '/platform/docs', icon: BookOpen },
      ]
    }
  ];

  const navigation = user?.role === 'platform_admin'
    ? platformAdminNavigation
    : user?.role === 'super_admin' 
    ? superAdminNavigation
    : user?.role === 'admin' 
    ? adminNavigation 
    : employeeNavigation;

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

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <>
      {/* Mobile overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-white/95 backdrop-blur-sm shadow-xl border-r border-gray-200/80 transition-all duration-300 ease-out h-screen flex flex-col ${
        isCollapsed 
          ? 'w-16' 
          : 'w-64'
      } ${
        // On mobile: collapsed = visible as thin bar, expanded = overlay
        // On desktop: always visible at proper position
        isCollapsed 
          ? 'translate-x-0' 
          : 'translate-x-0 lg:translate-x-0'
      }`}>
      <div className="flex items-center justify-between h-16 px-3 border-b border-gray-200/60 flex-shrink-0 bg-gradient-to-r from-gray-50/50 to-transparent">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Only show logo when sidebar is expanded */}
          {!isCollapsed && (
            <img 
              src="/paidin - logos/Logo Designs (Transparent)/paidin-text-and-icon-logo.png" 
              alt="PaidIn Logo" 
              className="ml-1"
              style={{ height: '100px' }}
            />
          )}
        </div>
        <div className="flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="h-10 w-10 p-0 rounded-lg"
          >
            {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden flex flex-col">
        <nav className="flex-1 overflow-y-auto px-2 py-4 sidebar-scroll">
          <div className="space-y-1">
            {/* Mobile: Show only main navigation icons */}
            {isMobile && isCollapsed ? (
              mobileNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                
                return (
                  <Link key={item.id} href={item.href}>
                    <div
                      className={`flex items-center text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer px-3 py-3 justify-center ${
                        isActive
                          ? 'text-primary bg-primary/10 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/80'
                      }`}
                      title={item.title}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                  </Link>
                );
              })
            ) : (
              /* Desktop: Show full navigation with sections */
              navigation.map((section) => (
                <div key={section.id}>
                  {!isCollapsed && (
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="flex items-center justify-between w-full px-3 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-gray-700 transition-all duration-200 rounded-lg hover:bg-gray-50/50"
                    >
                      <span>{section.title}</span>
                      {expandedSections.has(section.id) ? (
                        <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200" />
                      )}
                    </button>
                  )}
                  
                  {(isCollapsed || expandedSections.has(section.id)) && (
                    <div className={`space-y-1 ${!isCollapsed ? 'ml-2' : ''}`}>
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = location === item.href;
                        
                        return (
                          <Link key={item.name} href={item.href}>
                            <div
                              className={`flex items-center text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer ${
                                isCollapsed 
                                  ? 'px-3 py-3 justify-center' 
                                  : 'px-3 py-2.5'
                              } ${
                                isActive
                                  ? 'text-primary bg-primary/10 shadow-sm border-l-4 border-primary font-semibold'
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/80 hover:translate-x-1'
                              }`}
                              title={isCollapsed ? item.name : undefined}
                            >
                              <Icon className={`w-4 h-4 ${isCollapsed ? '' : 'mr-3'}`} />
                              {!isCollapsed && (
                                <span className="truncate">{item.name}</span>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                  
                  {!isCollapsed && section.id !== 'settings' && (
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-3 my-3" />
                  )}
                </div>
              ))
            )}
          </div>
        </nav>
      </div>
      
      <div className={`px-2 pb-4 flex-shrink-0 ${isCollapsed ? '' : 'px-4'}`}>
        <div className={`bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-200/50 shadow-sm ${isCollapsed ? 'p-2' : 'p-4'}`}>
          {isCollapsed ? (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-300 flex items-center justify-center" title={`${user?.firstName} ${user?.lastName}`}>
                {user?.profilePhoto ? (
                  <img 
                    src={user.profilePhoto} 
                    alt="Profile photo" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-slate-600" />
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0 text-muted-foreground hover:text-foreground"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-300 flex items-center justify-center">
                  {user?.profilePhoto ? (
                    <img 
                      src={user.profilePhoto} 
                      alt="Profile photo" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-slate-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate capitalize">
                    {user?.role}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-3 text-left justify-start text-muted-foreground hover:text-foreground"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
