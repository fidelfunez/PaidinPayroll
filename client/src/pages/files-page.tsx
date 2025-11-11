import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Upload, FileText, Download, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { useBtcRate } from "@/hooks/use-btc-rate-context";

export default function FilesPage() {
  const { isCollapsed } = useSidebar();
  const { rate: btcRate } = useBtcRate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-background to-gray-50 flex">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16 lg:ml-16' : 'ml-16 lg:ml-64'}`}>
        <Header title="Files" subtitle="Manage your uploaded documents" btcRate={btcRate} />
        
        <main className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Document Upload</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-orange-200 rounded-lg p-12 text-center">
                  <Upload className="mx-auto h-16 w-16 text-orange-400 mb-6" />
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">Document Management</h3>
                  <p className="text-slate-600 mb-6">Secure file storage and document management system</p>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 max-w-md mx-auto">
                    <p className="text-orange-800 font-medium">Coming Soon</p>
                    <p className="text-orange-700 text-sm mt-1">Document upload and management features will be available in the next release.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Document Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <FileText className="h-8 w-8 text-blue-500 mb-3" />
                    <h4 className="font-medium mb-2">Secure Storage</h4>
                    <p className="text-sm text-slate-600">Encrypted document storage with version control</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <Download className="h-8 w-8 text-green-500 mb-3" />
                    <h4 className="font-medium mb-2">Easy Access</h4>
                    <p className="text-sm text-slate-600">Quick download and sharing capabilities</p>
                  </div>
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