import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  BarChart3, Settings, LogOut, User, Menu, X,
  Wallet, Download, ArrowUpDown, Tag, Coins, Shield
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();

  // Simplified navigation for Bitcoin Accounting
  const navigation = [
    { name: 'Dashboard', href: '/', icon: BarChart3 },
    { name: 'Wallets', href: '/accounting/wallets', icon: Wallet },
    { name: 'Transactions', href: '/accounting/transactions', icon: ArrowUpDown },
    { name: 'Categories', href: '/accounting/categories', icon: Tag },
    { name: 'Purchases', href: '/accounting/purchases', icon: Coins },
    { name: 'QuickBooks Export', href: '/accounting/export', icon: Download },
  ];

  const bottomNavigation = [
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  // Admin navigation (only show for platform_admin users)
  // Regular 'admin' role is for company admins, not platform admins
  const isPlatformAdmin = user?.role === 'platform_admin';
  const adminNavigation = isPlatformAdmin ? [
    { name: 'Admin Console', href: '/admin', icon: Shield },
  ] : [];

  const isActive = (path: string) => {
    if (path === '/') {
      return location === '/' || location === '/accounting';
    }
    return location.startsWith(path);
  };

  if (isCollapsed && !isMobile) {
    return (
      <aside className="w-16 bg-white border-r flex flex-col">
        <div className="p-4 flex flex-col items-center gap-2">
          <img 
            src="/favicon/paidin-logo.png" 
            alt="PaidIn Logo" 
            className="h-8 w-8 rounded-full object-cover"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 flex flex-col gap-2 p-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={`flex items-center justify-center p-3 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-orange-50 text-orange-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title={item.name}
                >
                  <Icon className="h-5 w-5" />
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t space-y-2">
          {isPlatformAdmin && adminNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={`flex items-center justify-center p-3 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-orange-50 text-orange-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title={item.name}
                >
                  <Icon className="h-5 w-5" />
                </a>
              </Link>
            );
          })}
          {bottomNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={`flex items-center justify-center p-3 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-orange-50 text-orange-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title={item.name}
                >
                  <Icon className="h-5 w-5" />
                </a>
              </Link>
            );
          })}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => logoutMutation.mutate()}
            className="w-full h-12 text-gray-600 hover:bg-gray-100"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </aside>
    );
  }

  return (
    <>
      {/* Mobile overlay */}
      {!isCollapsed && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          ${isMobile ? 'fixed inset-y-0 left-0 z-50 transform transition-transform' : 'relative'}
          ${isCollapsed && isMobile ? '-translate-x-full' : 'translate-x-0'}
          w-64 bg-white border-r flex flex-col
        `}
      >
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/favicon/paidin-logo.png" 
              alt="PaidIn Logo" 
              className="h-10 w-10 rounded-full object-cover -ml-[6px]"
            />
            <div>
              <h2 className="text-xl font-bold text-gray-900">PaidIn</h2>
              <p className="text-xs text-gray-500">Bitcoin Accounting</p>
            </div>
          </div>
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* User info */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.profilePhoto || undefined} alt={`${user?.firstName} ${user?.lastName}`} />
              <AvatarFallback className="bg-orange-100 text-orange-600">
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Main navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-orange-50 text-orange-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </a>
              </Link>
            );
          })}
        </nav>

        {/* Bottom navigation */}
        <div className="p-4 border-t space-y-1">
          {adminNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-orange-50 text-orange-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </a>
              </Link>
            );
          })}
          {bottomNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-orange-50 text-orange-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </a>
              </Link>
            );
          })}
          <Button
            variant="ghost"
            onClick={() => logoutMutation.mutate()}
            className="w-full justify-start text-gray-700 hover:bg-gray-100"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>
    </>
  );
}
