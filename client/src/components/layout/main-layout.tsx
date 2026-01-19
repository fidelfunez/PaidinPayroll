import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/hooks/use-sidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const isMobile = useIsMobile();
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header with menu toggle */}
        {isMobile && (
          <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-10 w-10"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">PaidIn</h1>
                <p className="text-xs text-gray-500">Bitcoin Accounting</p>
              </div>
            </div>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
