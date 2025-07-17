import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Bitcoin, Clock, CheckCircle, XCircle } from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";

interface PayrollPayment {
  id: number;
  employeeId: number;
  employeeName: string;
  amountUsd: number;
  amountBtc: number;
  btcRate: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  paidDate?: string;
  transactionHash?: string;
}

export default function PayrollPage() {
  const { data: payments, isLoading, error } = useQuery<PayrollPayment[]>({
    queryKey: ["/api/payroll"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Payroll</h2>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payroll</h1>
        <Button>Create Payment</Button>
      </div>

      <div className="grid gap-6">
        {payments?.map((payment) => (
          <Card key={payment.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{payment.employeeName}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge 
                  variant={
                    payment.status === 'completed' ? 'default' : 
                    payment.status === 'pending' ? 'secondary' : 'destructive'
                  }
                >
                  {payment.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">${payment.amountUsd.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bitcoin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">₿{payment.amountBtc.toFixed(8)}</span>
                </div>
              </div>
              {payment.transactionHash && (
                <p className="text-xs text-muted-foreground mt-2">
                  TX: {payment.transactionHash}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 