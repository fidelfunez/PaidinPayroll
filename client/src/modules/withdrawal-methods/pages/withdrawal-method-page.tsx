import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Banknote, Plus } from "lucide-react";

export default function WithdrawalMethodPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Withdrawal Methods</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Method
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Manage Withdrawal Methods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Add, edit, or remove withdrawal methods for payroll and reimbursements. This feature is coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 