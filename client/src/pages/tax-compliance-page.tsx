import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { FileText, Download, Upload, AlertTriangle, CheckCircle, Calculator, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";

export default function TaxCompliancePage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();

  const taxDocuments = [
    {
      type: "W-2",
      year: 2025,
      status: "ready",
      downloadDate: "2025-01-31",
      description: "Wage and Tax Statement"
    },
    {
      type: "1099-MISC",
      year: 2025,
      status: "pending",
      downloadDate: null,
      description: "Bitcoin Payment Records"
    },
    {
      type: "Crypto Tax Report",
      year: 2025,
      status: "ready",
      downloadDate: "2025-12-31",
      description: "Detailed Bitcoin transaction history"
    },
    {
      type: "W-2",
      year: 2023,
      status: "archived",
      downloadDate: "2023-01-31",
      description: "Previous year tax statement"
    }
  ];

  const taxEstimate = {
    totalBitcoinIncome: 85000,
    estimatedTaxLiability: 18700,
    quarterlyPayments: 4675,
    nextDueDate: "2025-04-15"
  };

  const complianceItems = [
    {
      title: "Bitcoin Income Reporting",
      status: "complete",
      description: "All Bitcoin payments properly categorized",
      dueDate: "Ongoing"
    },
    {
      title: "Quarterly Estimated Taxes",
      status: "pending",
      description: "Q1 2025 estimated tax payment",
      dueDate: "April 15, 2025"
    },
    {
      title: "State Tax Registration",
      status: "complete", 
      description: "Registered for state income tax",
      dueDate: "Complete"
    },
    {
      title: "FBAR Filing",
      status: "not-required",
      description: "Foreign bank account reporting",
      dueDate: "June 30, 2025"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-background to-gray-50 flex">
      <Sidebar />
      <div className={`flex-1 flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16 lg:ml-16' : 'ml-16 lg:ml-64'}`}>
        <Header 
          title="Tax & Compliance" 
          subtitle="Manage your Bitcoin income tax obligations"
        />
        
        <main className="p-4 lg:p-6 space-y-6">
          {/* Tax Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Calculator className="w-6 h-6 text-orange-500" />
                2025 Tax Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    ${taxEstimate.totalBitcoinIncome.toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-600">Bitcoin Income</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    ${taxEstimate.estimatedTaxLiability.toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-600">Est. Tax Liability</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    ${taxEstimate.quarterlyPayments.toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-600">Quarterly Payment</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {taxEstimate.nextDueDate}
                  </div>
                  <div className="text-sm text-slate-600">Next Due Date</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="documents" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="documents">Tax Documents</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              <TabsTrigger value="calculator">Tax Calculator</TabsTrigger>
            </TabsList>

            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tax Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {taxDocuments.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <FileText className="w-8 h-8 text-slate-500" />
                          <div>
                            <h3 className="font-medium">{doc.type} - {doc.year}</h3>
                            <p className="text-sm text-slate-600">{doc.description}</p>
                            {doc.downloadDate && (
                              <p className="text-xs text-slate-500">
                                Available since: {doc.downloadDate}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={
                            doc.status === 'ready' ? 'default' :
                            doc.status === 'pending' ? 'secondary' : 'outline'
                          }>
                            {doc.status}
                          </Badge>
                          {doc.status === 'ready' && (
                            <Button size="sm" variant="outline" disabled>
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Upload Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="font-medium mb-2">Upload Tax Documents</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Upload receipts, forms, or other tax-related documents
                    </p>
                    <Button disabled>Choose Files</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Checklist</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {complianceItems.map((item, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                        <div className="mt-1">
                          {item.status === 'complete' ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : item.status === 'pending' ? (
                            <Calendar className="w-5 h-5 text-orange-500" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{item.title}</h3>
                          <p className="text-sm text-slate-600">{item.description}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            item.status === 'complete' ? 'default' :
                            item.status === 'pending' ? 'secondary' :
                            'outline'
                          }>
                            {item.status === 'not-required' ? 'Not Required' : item.status}
                          </Badge>
                          <p className="text-xs text-slate-500 mt-1">{item.dueDate}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="calculator" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Bitcoin Tax Calculator</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium mb-4">Income Breakdown</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Regular Salary (BTC):</span>
                          <span className="font-medium">1.2 BTC</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Bonuses (BTC):</span>
                          <span className="font-medium">0.15 BTC</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Total Bitcoin Income:</span>
                          <span className="font-medium">1.35 BTC</span>
                        </div>
                        <div className="h-px bg-slate-200 my-2" />
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">USD Value (avg rate):</span>
                          <span className="font-bold">${taxEstimate.totalBitcoinIncome.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-4">Tax Estimates</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Federal Income Tax:</span>
                          <span className="font-medium">$12,750</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">State Income Tax:</span>
                          <span className="font-medium">$4,250</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">FICA Taxes:</span>
                          <span className="font-medium">$1,700</span>
                        </div>
                        <div className="h-px bg-slate-200 my-2" />
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Total Tax Liability:</span>
                          <span className="font-bold">${taxEstimate.estimatedTaxLiability.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-900 mb-1">Tax Estimate Disclaimer</p>
                        <p className="text-yellow-700">
                          These are estimates based on current tax rates and your Bitcoin income. 
                          Consult with a tax professional for accurate calculations and personalized advice.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button className="h-auto p-4 flex flex-col gap-2" disabled>
                  <Calculator className="w-6 h-6" />
                  <span>Calculate Taxes</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col gap-2" disabled>
                  <FileText className="w-6 h-6" />
                  <span>Generate Report</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col gap-2" disabled>
                  <Download className="w-6 h-6" />
                  <span>Export Data</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}