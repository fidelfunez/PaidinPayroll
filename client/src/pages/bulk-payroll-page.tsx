import { useSidebar } from "@/hooks/use-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Construction } from "lucide-react";

export default function BulkPayrollPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className={`transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Header title="Bulk Payroll" subtitle="Process multiple employee payments simultaneously" />
        
        <main className="p-6">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <Construction className="mx-auto h-16 w-16 text-orange-500 mb-4" />
                <CardTitle className="text-2xl">Bulk Payroll Processing</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-lg text-muted-foreground">Process multiple employee payments simultaneously</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  This feature will allow administrators to process payroll for multiple employees at once, with Bitcoin conversion and batch processing capabilities.
                </p>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 max-w-md mx-auto">
                  <Users className="mx-auto h-8 w-8 text-orange-600 mb-2" />
                  <p className="text-orange-800 font-medium">Coming Soon</p>
                  <p className="text-orange-700 text-sm mt-1">Efficient bulk payment processing for all employees.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}