import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Banknote, Shield } from "lucide-react";

export default function AdminWithdrawalMethodsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Withdrawal Methods</h1>
        <Button>
          <Shield className="h-4 w-4 mr-2" />
          Admin Action
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Admin Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Manage all withdrawal methods for the organization. This feature is coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 