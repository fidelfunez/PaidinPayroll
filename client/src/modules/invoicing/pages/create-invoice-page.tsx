import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { invoicingApi, type CreateInvoiceRequest } from "@/lib/api/invoicing-api";

export default function CreateInvoicePage() {
  const { user } = useAuth();
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateInvoiceRequest>({
    clientName: "",
    clientEmail: "",
    amountUsd: "",
    description: "",
    dueDate: ""
  });

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: invoicingApi.createInvoice,
    onSuccess: (data) => {
      console.log('Invoice created successfully:', data);
      // Navigate to the new invoice detail page
      navigate(`/invoices/${data.invoice.id}`);
    },
    onError: (error) => {
      console.error('Failed to create invoice:', error);
      // You could add a toast notification here
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createInvoiceMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof CreateInvoiceRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <Link to="/invoices">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Invoices
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
                <p className="text-gray-600">Generate a new Bitcoin invoice for your client</p>
              </div>
            </div>

            {createInvoiceMutation.error && (
              <Card className="border-red-200 bg-red-50 mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <h3 className="font-semibold text-red-800">Error Creating Invoice</h3>
                      <p className="text-red-600 text-sm">
                        {createInvoiceMutation.error instanceof Error 
                          ? createInvoiceMutation.error.message 
                          : 'An unexpected error occurred'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <form onSubmit={handleSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="clientName">Client Name *</Label>
                      <Input
                        id="clientName"
                        value={formData.clientName}
                        onChange={(e) => handleInputChange('clientName', e.target.value)}
                        placeholder="Enter client name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientEmail">Client Email *</Label>
                      <Input
                        id="clientEmail"
                        type="email"
                        value={formData.clientEmail}
                        onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                        placeholder="client@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="amountUsd">Amount (USD) *</Label>
                    <Input
                      id="amountUsd"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amountUsd}
                      onChange={(e) => handleInputChange('amountUsd', e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe the services or products..."
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Submit */}
              <div className="flex justify-end gap-4 mt-6">
                <Link to="/invoices">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  disabled={createInvoiceMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {createInvoiceMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Create Invoice
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
} 