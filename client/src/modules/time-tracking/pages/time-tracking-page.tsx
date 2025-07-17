import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Play, Pause, Square } from "lucide-react";

export default function TimeTrackingPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Time Tracking</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Play className="h-4 w-4 mr-2" />
            Start Timer
          </Button>
          <Button variant="outline" size="sm">
            <Pause className="h-4 w-4 mr-2" />
            Pause
          </Button>
          <Button variant="outline" size="sm">
            <Square className="h-4 w-4 mr-2" />
            Stop
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Current Session
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-mono font-bold text-orange-600 mb-4">
              00:00:00
            </div>
            <p className="text-muted-foreground">No active timer</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Today's Time</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Time tracking features are coming soon. This will allow employees to track their work hours.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 