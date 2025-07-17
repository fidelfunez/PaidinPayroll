import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Calculator, Shield, AlertTriangle } from "lucide-react";

export default function TaxCompliancePage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Tax Compliance</h1>
              <p className="text-gray-600">Stay compliant with Bitcoin payment regulations</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-blue-600" />
                    <CardTitle>Reporting Requirements</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    All Bitcoin payments are automatically tracked and reported for tax purposes.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• 1099-MISC forms for contractors</li>
                    <li>• W-2 forms for employees</li>
                    <li>• Transaction history export</li>
                    <li>• Tax filing assistance</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Calculator className="h-6 w-6 text-green-600" />
                    <CardTitle>Tax Calculations</CardTitle>
                  </div>
                </CardHeader>
                <CardConten 