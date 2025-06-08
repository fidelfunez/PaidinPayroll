import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { Button } from "@/components/ui/button";
import { BarChart3, DollarSign, Receipt, FileText, Settings, LogOut, User, Menu, X } from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: BarChart3 },
    { name: 'Payroll', href: '/payroll', icon: DollarSign },
    { name: 'Reimbursements', href: '/reimbursements', icon: Receipt },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className={`fixed inset-y-0 left-0 z-50 bg-white shadow-lg transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="flex items-center justify-between h-16 px-3 border-b border-slate-200">
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
      
      <nav className="mt-8 px-2">
        <div className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={`flex items-center text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                    isCollapsed 
                      ? 'px-3 py-3 justify-center' 
                      : 'px-4 py-3'
                  } ${
                    isActive
                      ? 'text-orange-700 bg-orange-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
      
      <div className={`absolute bottom-4 ${isCollapsed ? 'left-2 right-2' : 'left-4 right-4'}`}>
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
                <div className="w-10 h-10 bg-slate-300 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-slate-600" />
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
  );
}
