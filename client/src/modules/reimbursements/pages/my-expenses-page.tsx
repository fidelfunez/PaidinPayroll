import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, Plus } from "lucide-react";

export default function MyExpensesPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Expenses</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Submit Expense
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            My Expense History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            View and manage your personal expense submissions. This feature is coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 