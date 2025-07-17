import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Shield } from "lucide-react";

export default function AdminMessagesPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Messages</h1>
        <Button>
          <Shield className="h-4 w-4 mr-2" />
          System Message
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Admin Communication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Send system-wide messages and announcements to all team members. This feature is coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 