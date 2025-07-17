import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Share, Edit, Loader2, AlertCircle, Copy, Check, RefreshCw } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { invoicingApi, type Invoice } from "@/lib/api/invoicing-api";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const statusColors = {
  paid: "bg-green-100 text-green-800",
  sent: "bg-blue-100 text-blue-800",
  pending: "bg-yellow-100 text-yellow-800",
  overdue: "bg-red-100 text-red-800",
  draft: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800"
};

interface PaymentStatus {
  status: 'pending' | 'paid' | 'expired';
  btcAmount?: number;
  paymentUrl?: string;
  qrCode?: string;
  expiresAt?: string;
  transactions?: Array<{
    id: string;
    amount: number;
    confirmations: number;
    txid: string;
    timestamp: string;
  }>;
}

export default function InvoiceDetailPage() {
  const { user } = useAuth();
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const { id } = useParams();
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Fetch invoice details
  const {
    data: invoice,
    isLoading,
    error
  } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoicingApi.getInvoice(id!),
    enabled: !!id,
  });

  // Fetch payment status
  const {
    data: paymentStatus,
    isLoading: paymentLoading,
    refetch: refetchPayment
  } = useQuery({
    queryKey: ['invoice-payment-status', id],
    queryFn: () => invoicingApi.getPaymentStatus(id!),
    enabled: !!id && !!invoice?.paymentUrl,
    refetchInterval: 30000, // Poll every 30 seconds
  });

  // Update invoice status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      invoicingApi.updateInvoiceStatus(id, status),
    onSuccess: () => {
      toast({
        title: "Invoice updated",
        description: "Invoice status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update invoice. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleCopyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({
        title: "Copied to clipboard",
        description: `${field} has been copied to your clipboard.`,
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onMenuClick={toggleSidebar} />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading invoice details...</span>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onMenuClick={toggleSidebar} />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-red-800">Invoice Not Found</h3>
                      <p className="text-red-600">The invoice you're looking for doesn't exist or has been deleted.</p>
                    </div>
                  </div>
                  <Link to="/invoices">
                    <Button className="mt-4" variant="outline">
                      Back to Invoices
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Link to="/invoices">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Invoices
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Invoice #{invoice.id}
                  </h1>
                  <p className="text-gray-600">{invoice.clientName}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline">
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Link to={`/invoice/${invoice.id}/edit`}>
                  <Button>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Invoice Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Invoice Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Invoice Number</div>
                        <div className="font-medium">#{invoice.id}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Status</div>
                        <Badge className={statusColors[invoice.status as keyof typeof statusColors]}>
                          {invoice.status}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Created Date</div>
                        <div className="font-medium">
                          {new Date(invoice.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Due Date</div>
                        <div className="font-medium">
                          {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'No due date'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Invoice Description */}
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{invoice.description}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Payment Information */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Payment Information</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetchPayment()}
                        disabled={paymentLoading}
                      >
                        {paymentLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-500">Amount (USD)</div>
                      <div className="text-2xl font-bold text-green-600">
                        ${parseFloat(invoice.amountUsd).toLocaleString()}
                      </div>
                    </div>
                    
                    {paymentStatus?.btcAmount && (
                      <div>
                        <div className="text-sm text-gray-500">Amount (BTC)</div>
                        <div className="text-lg font-medium">
                          {paymentStatus.btcAmount} BTC
                        </div>
                      </div>
                    )}

                    {paymentStatus?.paymentUrl && (
                      <div>
                        <div className="text-sm text-gray-500 mb-2">Payment URL</div>
                        <div className="relative">
                          <div className="text-xs font-mono bg-gray-100 p-2 rounded break-all">
                            {paymentStatus.paymentUrl}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute top-1 right-1"
                            onClick={() => handleCopyToClipboard(paymentStatus.paymentUrl!, 'Payment URL')}
                          >
                            {copiedField === 'Payment URL' ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {paymentStatus?.qrCode && (
                      <div>
                        <div className="text-sm text-gray-500 mb-2">QR Code</div>
                        <div className="bg-white p-4 rounded border">
                          <img 
                            src={`data:image/png;base64,${paymentStatus.qrCode}`} 
                            alt="Payment QR Code"
                            className="w-full h-auto"
                          />
                        </div>
                      </div>
                    )}

                    {paymentStatus?.expiresAt && (
                      <div>
                        <div className="text-sm text-gray-500">Expires At</div>
                        <div className="font-medium">
                          {new Date(paymentStatus.expiresAt).toLocaleString()}
                        </div>
                      </div>
                    )}

                    {paymentStatus?.transactions && paymentStatus.transactions.length > 0 && (
                      <div>
                        <div className="text-sm text-gray-500 mb-2">Transactions</div>
                        <div className="space-y-2">
                          {paymentStatus.transactions.map((tx) => (
                            <div key={tx.id} className="text-xs bg-gray-50 p-2 rounded">
                              <div className="flex justify-between">
                                <span>Amount: {tx.amount} BTC</span>
                                <span>Confirmations: {tx.confirmations}</span>
                              </div>
                              <div className="text-gray-500 truncate">
                                TXID: {tx.txid}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Client Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Client Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-sm text-gray-500">Client Name</div>
                      <div className="font-medium">{invoice.clientName}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Client Email</div>
                      <div className="font-medium">{invoice.clientEmail}</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {invoice.status === 'draft' && (
                      <Button 
                        className="w-full" 
                        onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: 'sent' })}
                        disabled={updateStatusMutation.isPending}
                      >
                        {updateStatusMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Send Invoice"
                        )}
                      </Button>
                    )}
                    {invoice.status === 'sent' && (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: 'paid' })}
                        disabled={updateStatusMutation.isPending}
                      >
                        {updateStatusMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Mark as Paid"
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
} 