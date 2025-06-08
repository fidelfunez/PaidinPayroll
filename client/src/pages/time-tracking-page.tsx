import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Clock, Play, Square, Plus } from "lucide-react";
import { useSidebar } from "@/hooks/use-sidebar";

export default function TimeTrackingPage() {
  const { isCollapsed } = useSidebar();
  const [isTracking, setIsTracking] = useState(false);
  const [currentTime, setCurrentTime] = useState("00:00:00");

  const timeEntries = [
    { id: 1, date: "2024-12-08", project: "Bitcoin Platform", hours: 8.5, description: "Frontend development" },
    { id: 2, date: "2024-12-07", project: "Bitcoin Platform", hours: 7.75, description: "API integration" },
    { id: 3, date: "2024-12-06", project: "Bitcoin Platform", hours: 8.0, description: "Database optimization" },
  ];

  const toggleTracking = () => {
    setIsTracking(!isTracking);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className={`transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Header title="Time Tracking" subtitle="Track your working hours" />
        
        <main className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Time Tracker */}
            <Card>
              <CardHeader>
                <CardTitle>Current Session</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl font-mono font-bold text-orange-600">
                      {currentTime}
                    </div>
                    <div className="space-y-2">
                      <Input placeholder="Project name" className="w-64" />
                      <Input placeholder="Task description" className="w-64" />
                    </div>
                  </div>
                  <Button
                    onClick={toggleTracking}
                    size="lg"
                    className={isTracking ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                  >
                    {isTracking ? (
                      <>
                        <Square className="h-5 w-5 mr-2" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5 mr-2" />
                        Start
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Manual Entry */}
            <Card>
              <CardHeader>
                <CardTitle>Manual Time Entry</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" />
                  </div>
                  <div>
                    <Label htmlFor="hours">Hours</Label>
                    <Input id="hours" type="number" step="0.25" placeholder="8.0" />
                  </div>
                  <div>
                    <Label htmlFor="project">Project</Label>
                    <Input id="project" placeholder="Project name" />
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Entry
                    </Button>
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" placeholder="What did you work on?" />
                </div>
              </CardContent>
            </Card>

            {/* Time Entries */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Time Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{entry.date}</TableCell>
                        <TableCell>{entry.project}</TableCell>
                        <TableCell>{entry.hours}h</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">Edit</Button>
                            <Button variant="outline" size="sm">Delete</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Weekly Summary */}
            <Card>
              <CardHeader>
                <CardTitle>This Week's Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">24.25</div>
                    <div className="text-sm text-muted-foreground">Hours Worked</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">3</div>
                    <div className="text-sm text-muted-foreground">Days Active</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">8.08</div>
                    <div className="text-sm text-muted-foreground">Avg. Hours/Day</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}