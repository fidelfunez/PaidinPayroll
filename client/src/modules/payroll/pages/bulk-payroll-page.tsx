import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BulkPayrollPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Bulk Payroll</h1>
        <Button>Process Bulk Payment</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bulk Payment Processing</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Process multiple payroll payments at once. This feature is coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 