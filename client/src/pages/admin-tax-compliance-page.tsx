import { useSidebar } from "@/hooks/use-sidebar";
import { useBtcRate } from "@/hooks/use-btc-rate-context";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Construction } from "lucide-react";

export default function AdminTaxCompliancePage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { rate: btcRate } = useBtcRate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-background to-gray-50 flex">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16 lg:ml-16' : 'ml-16 lg:ml-64'}`}>
        <Header title="Tax & Compliance" subtitle="Review employee tax documents and compliance status" btcRate={btcRate} />
        
        <main className="p-6">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <Construction className="mx-auto h-16 w-16 text-orange-500 mb-4" />
                <CardTitle className="text-2xl">Tax & Compliance Management</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-lg text-muted-foreground">Review employee tax documents and compliance status</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  This administrative feature for managing employee tax compliance and document review is currently under development.
                </p>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 max-w-md mx-auto">
                  <FileText className="mx-auto h-8 w-8 text-orange-600 mb-2" />
                  <p className="text-orange-800 font-medium">Coming Soon</p>
                  <p className="text-orange-700 text-sm mt-1">Advanced tax compliance tools for administrators.</p>
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