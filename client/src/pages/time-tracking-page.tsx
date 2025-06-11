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

  const timeEntries: any[] = [];

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
                    disabled
                    className="bg-slate-400 hover:bg-slate-400 cursor-not-allowed"
                  >
                    <Clock className="h-5 w-5 mr-2" />
                    Coming Soon
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
                    <Button className="w-full" disabled>
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
                    {timeEntries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <Clock className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 max-w-sm mx-auto">
                            <p className="text-orange-800 font-medium">Coming Soon</p>
                            <p className="text-orange-700 text-sm mt-1">Time tracking functionality will be available in the next release.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      timeEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>{entry.date}</TableCell>
                          <TableCell>{entry.project}</TableCell>
                          <TableCell>{entry.hours}h</TableCell>
                          <TableCell>{entry.description}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" disabled>Edit</Button>
                              <Button variant="outline" size="sm" disabled>Delete</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
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