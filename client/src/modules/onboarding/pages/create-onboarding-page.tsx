import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

// Mock task types
const taskTypes = [
  { value: "form", label: "Form Completion", description: "Employee fills out required forms" },
  { value: "document", label: "Document Upload", description: "Employee uploads required documents" },
  { value: "video", label: "Video Training", description: "Employee watches training videos" },
  { value: "quiz", label: "Quiz/Assessment", description: "Employee completes knowledge check" },
  { value: "meeting", label: "Meeting", description: "Schedule a meeting with HR or manager" },
  { value: "system", label: "System Access", description: "Set up system accounts and access" }
];

export default function CreateOnboardingPage() {
  const { user } = useAuth();
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    department: "",
    tasks: []
  });

  const addTask = () => {
    setFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, {
        id: Date.now(),
        title: "",
        type: "form",
        description: "",
        required: true,
        order: prev.tasks.length + 1
      }]
    }));
  };

  const updateTask = (taskId: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.map(task => 
        task.id === taskId ? { ...task, [field]: value } : task
      )
    }));
  };

  const removeTask = (taskId: number) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.id !== taskId)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Creating onboarding flow:", formData);
    // TODO: Implement API call
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <Link to="/onboarding">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Onboarding Flow</h1>
                <p className="text-gray-600">Design a custom onboarding process for new employees</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="name">Flow Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Software Engineer Onboarding"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe what this onboarding flow covers..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Select value={formData.department} onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="engineering">Engineering</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="hr">Human Resources</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="operations">Operations</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Tasks */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Onboarding Tasks</CardTitle>
                      <Button type="button" onClick={addTask} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Task
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {formData.tasks.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No tasks added yet</p>
                        <p className="text-sm">Click "Add Task" to get started</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {formData.tasks.map((task, index) => (
                          <div key={task.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-500">Task {index + 1}</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeTask(task.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <Label>Task Title</Label>
                                <Input
                                  value={task.title}
                                  onChange={(e) => updateTask(task.id, 'title', e.target.value)}
                                  placeholder="e.g., Complete I-9 Form"
                                />
                              </div>
                              <div>
                                <Label>Task Type</Label>
                                <Select value={task.type} onValueChange={(value) => updateTask(task.id, 'type', value)}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {taskTypes.map(type => (
                                      <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="mt-3">
                              <Label>Description</Label>
                              <Textarea
                                value={task.description}
                                onChange={(e) => updateTask(task.id, 'description', e.target.value)}
                                placeholder="Describe what the employee needs to do..."
                                rows={2}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-4 mt-6">
                <Link to="/onboarding">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Create Onboarding Flow
                </Button>
              </div>
            </form>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
} 