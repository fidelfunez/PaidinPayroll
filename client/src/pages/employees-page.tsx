import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Plus, Edit, Trash2, Mail, DollarSign } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import type { User } from "@shared/schema";

export default function EmployeesPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();

  const { data: employees } = useQuery<User[]>({
    queryKey: ['/api/employees'],
    enabled: user?.role === 'admin',
  });

  const formatSalary = (salary: string | null) => {
    if (!salary) return 'Not set';
    return `$${parseFloat(salary).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className={`transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Header title="Employee Management" subtitle="Manage your team members" />
        
        <main className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{employees?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">Active team members</p>
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Team Members</CardTitle>
                <Button>
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
                          <Badge variant={employee.role === 'admin' ? 'default' : 'secondary'}>
                            {employee.role}
                          </Badge>
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
    </div>
  );
}