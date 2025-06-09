import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, DollarSign, Receipt, FileText, Settings, LogOut, User, Menu, X,
  Users, CreditCard, CheckSquare, Download, Shield, MessageSquare, 
  Clock, Calendar, Gift, Wallet, Bell, FolderOpen, FileBarChart, ChevronDown, ChevronRight,
  TrendingUp, Building2, Layers, Target, Search, Archive, Award, Banknote, 
  ScrollText, PieChart, Mail, Zap
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { isCollapsed, toggleSidebar, expandedSections, toggleSection } = useSidebar();

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
        { name: 'Dashboard', href: '/', icon: TrendingUp },
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
      <div className={`fixed inset-y-0 left-0 z-50 bg-white shadow-lg transition-all duration-300 h-screen flex flex-col ${
        isCollapsed 
          ? 'w-16' 
          : 'w-64'
      } ${
        // On mobile, show collapsed sidebar as small fixed bar, expanded as overlay
        isCollapsed ? 'translate-x-0' : 'translate-x-0 lg:translate-x-0'
      }`}>
      <div className="flex items-center justify-between h-16 px-3 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold text-white">₿</span>
          </div>
          {!isCollapsed && (
            <span className="text-xl font-bold text-foreground">Paidin</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
        </Button>
      </div>
      
      <div className="flex-1 overflow-hidden flex flex-col">
        <nav className="flex-1 overflow-y-auto px-2 py-4 sidebar-scroll">
          <div className="space-y-1">
            {navigation.map((section) => (
              <div key={section.id}>
                {!isCollapsed && (
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors"
                  >
                    <span>{section.title}</span>
                    {expandedSections.has(section.id) ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
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
                            className={`flex items-center text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                              isCollapsed 
                                ? 'px-3 py-3 justify-center' 
                                : 'px-3 py-2'
                            } ${
                              isActive
                                ? 'text-orange-700 bg-orange-50'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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
                  <div className="h-px bg-slate-200 mx-3 my-2" />
                )}
              </div>
            ))}
          </div>
        </nav>
      </div>
      
      <div className={`px-2 pb-4 flex-shrink-0 ${isCollapsed ? '' : 'px-4'}`}>
        <div className={`bg-slate-50 rounded-lg ${isCollapsed ? 'p-2' : 'p-4'}`}>
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
