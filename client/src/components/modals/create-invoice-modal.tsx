import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Copy, ExternalLink, QrCode, Download, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const invoiceSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Valid email is required"),
  amountUsd: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Amount must be a positive number"
  ),
  description: z.string().min(1, "Description is required"),
  dueDate: z.string().min(1, "Due date is required"),
  currency: z.string().min(1, "Currency is required"),
});

interface CreateInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MockInvoiceResponse {
  id: string;
  invoiceNumber: string;
  paymentUrl: string;
  qrCodeData: string;
  amountBtc: number;
  status: string;
  expiresAt: string;
}

export function CreateInvoiceModal({ open, onOpenChange }: CreateInvoiceModalProps) {
  const { toast } = useToast();
  const [createdInvoice, setCreatedInvoice] = useState<MockInvoiceResponse | null>(null);
  const [currentStep, setCurrentStep] = useState<'form' | 'payment'>('form');

  const form = useForm({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientName: "",
      clientEmail: "",
      amountUsd: "",
      description: "",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      currency: "USD",
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: z.infer<typeof invoiceSchema>): Promise<MockInvoiceResponse> => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock BTCPay Server response
      const amountUsd = parseFloat(data.amountUsd);
      const btcRate = 45000; // Mock BTC rate
      const amountBtc = amountUsd / btcRate;
      
      const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      
      return {
        id: invoiceId,
        invoiceNumber,
        paymentUrl: `https://btcpay.example.com/invoice/${invoiceId}`,
        qrCodeData: `bitcoin:bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh?amount=${amountBtc.toFixed(8)}&label=${encodeURIComponent(invoiceNumber)}`,
        amountBtc,
        status: 'pending',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      };
    },
    onSuccess: (data) => {
      setCreatedInvoice(data);
      setCurrentStep('payment');
      toast({
        title: "Invoice created successfully",
        description: "Payment URL and QR code generated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Invoice creation failed",
        description: error.message || "Failed to create invoice. Please try again.",
        variant: "destructive",
      });
    },
  });

  const copyPaymentUrl = () => {
    if (createdInvoice) {
      navigator.clipboard.writeText(createdInvoice.paymentUrl);
      toast({
        title: "Payment URL copied",
        description: "The payment URL has been copied to your clipboard.",
      });
    }
  };

  const copyQrCodeData = () => {
    if (createdInvoice) {
      navigator.clipboard.writeText(createdInvoice.qrCodeData);
      toast({
        title: "QR code data copied",
        description: "The QR code data has been copied to your clipboard.",
      });
    }
  };

  const formatCurrency = (amount: number) => 
    `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatBtc = (amount: number) => 
    `${amount.toFixed(8)} BTC`;

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const onSubmit = (data: z.infer<typeof invoiceSchema>) => {
    createInvoiceMutation.mutate(data);
  };

  const handleClose = () => {
    onOpenChange(false);
    setCurrentStep('form');
    setCreatedInvoice(null);
    form.reset();
  };

  const handleCreateAnother = () => {
    setCurrentStep('form');
    setCreatedInvoice(null);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
        {currentStep === 'form' ? (
          <>
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter client name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="client@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amountUsd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (USD)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          className="h-24 resize-none" 
                          placeholder="Describe the services or products..."
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleClose}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={createInvoiceMutation.isPending}
                  >
                    {createInvoiceMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Invoice
                  </Button>
                </div>
              </form>
            </Form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Invoice Created Successfully
              </DialogTitle>
            </DialogHeader>

            {createdInvoice && (
              <div className="space-y-6">
                {/* Invoice Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Invoice Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Invoice Number:</span>
                        <p className="text-muted-foreground">{createdInvoice.invoiceNumber}</p>
                      </div>
                      <div>
                        <span className="font-medium">Amount:</span>
                        <p className="text-muted-foreground">
                          {formatCurrency(parseFloat(form.getValues('amountUsd')))}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">BTC Amount:</span>
                        <p className="text-muted-foreground">{formatBtc(createdInvoice.amountBtc)}</p>
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>
                        <Badge className="bg-yellow-100 text-yellow-800">Pending Payment</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment URL */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Payment URL</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Input 
                        value={createdInvoice.paymentUrl} 
                        readOnly 
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyPaymentUrl}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(createdInvoice.paymentUrl, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Share this URL with your client to collect payment
                    </p>
                  </CardContent>
                </Card>

                {/* QR Code */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">QR Code</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-center">
                      <div className="w-48 h-48 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <QrCode className="w-32 h-32 text-gray-400 mx-auto mb-2" />
                          <p className="text-xs text-gray-500">QR Code Preview</p>
                          <p className="text-xs text-gray-400">(Mock display)</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Input 
                        value={createdInvoice.qrCodeData} 
                        readOnly 
                        className="flex-1 text-xs"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyQrCodeData}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      QR code data for Bitcoin wallet integration
                    </p>
                  </CardContent>
                </Card>

                {/* Expiry Timer */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Expiry</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-2xl font-mono font-bold text-orange-600">
                        {formatTimeRemaining(createdInvoice.expiresAt)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Time remaining to complete payment
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex space-x-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleCreateAnother}
                  >
                    Create Another Invoice
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={handleClose}
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
} 