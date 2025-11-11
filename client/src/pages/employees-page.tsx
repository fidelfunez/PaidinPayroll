import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AddEmployeeModal } from "@/components/modals/add-employee-modal";
import { Plus, Edit, Trash2, Mail, DollarSign, Search, Filter, MoreHorizontal, Users, UserCheck, UserX, Clock, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { useBtcRate } from "@/hooks/use-btc-rate-context";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

export default function EmployeesPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { rate: btcRate } = useBtcRate();
  const { toast } = useToast();

  // State management
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  // Mock enhanced employee data with status tracking
  const mockEmployees = [
    {
      id: 1,
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.johnson@company.com",
      role: "employee" as const,
      department: "Engineering",
      position: "Senior Developer",
      monthlySalary: "8500",
      status: "active",
      invitationStatus: "accepted",
      lastLogin: "2025-01-25T10:30:00Z",
      startDate: "2024-06-15",
      location: "San Francisco, CA",
      isActive: true
    },
    {
      id: 2,
      firstName: "Mike",
      lastName: "Chen",
      email: "mike.chen@company.com",
      role: "employee" as const,
      department: "Marketing",
      position: "Marketing Manager",
      monthlySalary: "7200",
      status: "active",
      invitationStatus: "accepted",
      lastLogin: "2025-01-24T14:20:00Z",
      startDate: "2024-08-01",
      location: "New York, NY",
      isActive: true
    },
    {
      id: 3,
      firstName: "Emily",
      lastName: "Rodriguez",
      email: "emily.rodriguez@company.com",
      role: "employee" as const,
      department: "Sales",
      position: "Account Executive",
      monthlySalary: "6800",
      status: "pending",
      invitationStatus: "pending",
      lastLogin: null,
      startDate: "2025-02-01",
      location: "Remote",
      isActive: false
    },
    {
      id: 4,
      firstName: "David",
      lastName: "Kim",
      email: "david.kim@company.com",
      role: "employee" as const,
      department: "Engineering",
      position: "DevOps Engineer",
      monthlySalary: "9200",
      status: "active",
      invitationStatus: "accepted",
      lastLogin: "2025-01-25T09:15:00Z",
      startDate: "2024-05-20",
      location: "Seattle, WA",
      isActive: true
    }
  ];

  const employees = mockEmployees;

  // Role change mutation
  const roleChangeMutation = useMutation({
    mutationFn: async ({ userId, newRole, reason }: { userId: number; newRole: string; reason?: string }) => {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole, reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update role');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Role Updated",
        description: data.message,
      });
      // In a real app, you'd invalidate the employees query here
      // queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle role change
  const handleRoleChange = async (userId: number, newRole: string) => {
    // Add confirmation dialog here later
    const confirmed = window.confirm(
      `Are you sure you want to change this user's role to ${newRole}?`
    );
    
    if (confirmed) {
      roleChangeMutation.mutate({ userId, newRole });
    }
  };

  // Filter employees based on search and filters
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = searchTerm === "" || 
      `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || employee.status === statusFilter;
    const matchesDepartment = departmentFilter === "all" || employee.department === departmentFilter;

    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const handleEmployeeAdded = (newEmployee: any) => {
    console.log('Employee added:', newEmployee);
    toast({
      title: "Employee Added",
      description: `${newEmployee.firstName} ${newEmployee.lastName} has been invited successfully.`,
    });
    // In a real app, you would refetch the employees data here
  };

  const handleAddEmployeeClick = () => {
    console.log('Add employee button clicked');
    setIsAddModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getInvitationStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800">Accepted</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const formatSalary = (salary: string | null) => {
    if (!salary) return 'Not set';
    const usdAmount = parseFloat(salary);
    const btcAmount = btcRate ? usdAmount / btcRate : 0;
    return (
      <div>
        <div className="font-medium">${usdAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        {btcRate && (
          <div className="text-xs text-muted-foreground">
            {btcAmount.toFixed(8)} BTC
          </div>
        )}
      </div>
    );
  };

  const formatLastLogin = (lastLogin: string | null) => {
    if (!lastLogin) return <span className="text-muted-foreground">Never</span>;
    const date = new Date(lastLogin);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return date.toLocaleDateString();
  };

  // Calculate statistics
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(emp => emp.status === 'active').length;
  const pendingEmployees = employees.filter(emp => emp.status === 'pending').length;
  const departments = [...new Set(employees.map(emp => emp.department))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-background to-gray-50 flex">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16 lg:ml-16' : 'ml-16 lg:ml-64'}`}>
        <Header title="Employee Management" subtitle="Manage your team members" btcRate={btcRate} />
        
        <main className="p-4 lg:p-6 space-y-6 animate-fade-in">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Enhanced Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-6">
              <Card className="border-gray-200/80 bg-gradient-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total Employees</div>
                      <div className="text-3xl font-bold text-foreground mt-2 tracking-tight">{totalEmployees}</div>
                      <p className="text-xs text-muted-foreground mt-2">All team members</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center shadow-lg border border-blue-300/50">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200/80 bg-gradient-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Active</div>
                      <div className="text-3xl font-bold text-green-600 mt-2 tracking-tight">{activeEmployees}</div>
                      <p className="text-xs text-muted-foreground mt-2">Currently active</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center shadow-lg border border-green-300/50">
                      <UserCheck className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200/80 bg-gradient-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Pending</div>
                      <div className="text-3xl font-bold text-yellow-600 mt-2 tracking-tight">{pendingEmployees}</div>
                      <p className="text-xs text-muted-foreground mt-2">Invitation pending</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl flex items-center justify-center shadow-lg border border-yellow-300/50">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200/80 bg-gradient-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Departments</div>
                      <div className="text-3xl font-bold text-foreground mt-2 tracking-tight">{departments.length}</div>
                      <p className="text-xs text-muted-foreground mt-2">Active departments</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center shadow-lg border border-purple-300/50">
                      <Filter className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatSalary(
                      employees?.reduce((sum, emp) => sum + parseFloat(emp.monthlySalary || '0'), 0).toString() || '0'
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Total monthly cost</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {employees?.filter(emp => emp.role === 'admin').length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Administrative access</p>
                </CardContent>
              </Card>
            </div>

            {/* Employee Table */}
            <Card className="border-gray-200/80">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-xl font-bold">Team Members</CardTitle>
                <Button 
                  onClick={handleAddEmployeeClick}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Employee
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Monthly Salary</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees?.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-300 flex items-center justify-center">
                              {employee.profilePhoto ? (
                                <img 
                                  src={employee.profilePhoto} 
                                  alt="Profile" 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-semibold">
                                  {employee.firstName[0]}{employee.lastName[0]}
                                </span>
                              )}
                            </div>
                            <div>
                              <div>{employee.firstName} {employee.lastName}</div>
                              <div className="text-sm text-muted-foreground">@{employee.username}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>
                          {(user?.role === 'admin' || user?.role === 'super_admin') ? (
                            <Select
                              value={employee.role}
                              onValueChange={(newRole) => handleRoleChange(employee.id, newRole)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="employee">Employee</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                {user?.role === 'super_admin' && (
                                  <SelectItem value="super_admin">Super Admin</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant={employee.role === 'admin' || employee.role === 'super_admin' ? 'default' : 'secondary'}>
                              {employee.role}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatSalary(employee.monthlySalary)}</TableCell>
                        <TableCell>
                          <Badge className={employee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {employee.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )) || (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No employees found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>

      {/* Add Employee Modal */}
      <AddEmployeeModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onEmployeeAdded={handleEmployeeAdded}
      />
    </div>
  );
}