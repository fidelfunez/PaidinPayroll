import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PayslipsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payslips</h1>
        <Button>Generate Payslip</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payslip Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Generate and manage payslips for employees. This feature is coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 