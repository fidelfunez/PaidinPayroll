import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckSquare, Clock, DollarSign, Receipt, User, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";

export default function AdminApprovalsPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();

  const { data: allExpenses } = useQuery({
    queryKey: ['/api/expenses']
  });

  const { data: employees } = useQuery({
    queryKey: ['/api/employees']
  });

  const pendingExpenses = Array.isArray(allExpenses) ? allExpenses.filter((expense: any) => expense.status === 'pending') : [];

  const pendingPayrollApprovals = [
    {
      id: 1,
      employeeName: "Sarah Johnson",
      type: "Bonus Payment",
      amount: 0.025,
      amountUsd: 2500,
      requestDate: "2024-01-20",
      reason: "Exceptional performance on Q4 project delivery"
    },
    {
      id: 2,
      employeeName: "Mike Chen",
      type: "Salary Adjustment",
      amount: 0.15,
      amountUsd: 15000,
      requestDate: "2024-01-18",
      reason: "Promotion to Senior Developer"
    }
  ];

  const timeOffRequests = [
    {
      id: 1,
      employeeName: "Alex Rodriguez",
      type: "Vacation",
      startDate: "2024-02-15",
      endDate: "2024-02-22",
      days: 6,
      requestDate: "2024-01-19",
      reason: "Family vacation"
    },
    {
      id: 2,
      employeeName: "Sarah Johnson", 
      type: "Sick Leave",
      startDate: "2024-01-25",
      endDate: "2024-01-26",
      days: 2,
      requestDate: "2024-01-24",
      reason: "Medical appointment"
    }
  ];

  const approveExpense = (expenseId: number) => {
    console.log(`Approving expense ${expenseId}`);
  };

  const rejectExpense = (expenseId: number) => {
    console.log(`Rejecting expense ${expenseId}`);
  };

  const formatBtc = (amount: number) => `${amount.toFixed(8)} BTC`;
  const formatUsd = (amount: number) => `$${amount.toLocaleString()}`;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Header 
          title="Approvals" 
          subtitle="Review and approve employee requests"
        />
        
        <main className="p-4 lg:p-6 space-y-6">
          {/* Approval Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Expenses</p>
                    <p className="text-2xl font-bold">{pendingExpenses?.length || 0}</p>
                  </div>
                  <Receipt className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Payroll Requests</p>
                    <p className="text-2xl font-bold">{pendingPayrollApprovals.length}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Time Off Requests</p>
                    <p className="text-2xl font-bold">{timeOffRequests.length}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Pending</p>
                    <p className="text-2xl font-bold">
                      {(pendingExpenses?.length || 0) + pendingPayrollApprovals.length + timeOffRequests.length}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="expenses" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="expenses">Expense Reimbursements</TabsTrigger>
              <TabsTrigger value="payroll">Payroll Requests</TabsTrigger>
              <TabsTrigger value="timeoff">Time Off</TabsTrigger>
            </TabsList>

            <TabsContent value="expenses" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Receipt className="w-6 h-6 text-orange-500" />
                    Pending Expense Reimbursements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingExpenses && pendingExpenses.length > 0 ? (
                    <div className="space-y-4">
                      {pendingExpenses.map((expense: any) => (
                        <div key={expense.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <User className="w-5 h-5 text-slate-500" />
                              <div>
                                <h3 className="font-medium">
                                  {Array.isArray(employees) ? 
                                    (() => {
                                      const emp = employees.find((emp: any) => emp.id === expense.userId);
                                      return emp ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() : 'Employee';
                                    })()
                                    : 'Employee'}
                                </h3>
                                <p className="text-sm text-slate-600">{expense.description}</p>
                              </div>
                            </div>
                            <Badge variant="secondary">Pending</Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                            <div>
                              <span className="font-medium">Amount: </span>
                              <span className="text-slate-600">{formatUsd(parseFloat(expense.amountUsd))}</span>
                            </div>
                            <div>
                              <span className="font-medium">Category: </span>
                              <span className="text-slate-600">{expense.category || 'General'}</span>
                            </div>
                            <div>
                              <span className="font-medium">Submitted: </span>
                              <span className="text-slate-600">{new Date(expense.submittedAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => approveExpense(expense.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => rejectExpense(expense.id)}
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              Reject
                            </Button>
                            <Button size="sm" variant="outline">View Receipt</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      No pending expense reimbursements
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payroll" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <DollarSign className="w-6 h-6 text-orange-500" />
                    Payroll Adjustment Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingPayrollApprovals.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-medium">{request.employeeName}</h3>
                            <p className="text-sm text-slate-600">{request.type}</p>
                          </div>
                          <Badge variant="secondary">Pending</Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                          <div>
                            <span className="font-medium">Amount: </span>
                            <span className="text-slate-600">
                              {formatBtc(request.amount)} ({formatUsd(request.amountUsd)})
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Requested: </span>
                            <span className="text-slate-600">{request.requestDate}</span>
                          </div>
                          <div>
                            <span className="font-medium">Type: </span>
                            <span className="text-slate-600">{request.type}</span>
                          </div>
                        </div>

                        <div className="mb-4">
                          <span className="font-medium text-sm">Reason: </span>
                          <p className="text-sm text-slate-600 mt-1">{request.reason}</p>
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                            Reject
                          </Button>
                          <Button size="sm" variant="outline">Request Details</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeoff" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Calendar className="w-6 h-6 text-orange-500" />
                    Time Off Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {timeOffRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-medium">{request.employeeName}</h3>
                            <p className="text-sm text-slate-600">{request.type}</p>
                          </div>
                          <Badge variant="secondary">Pending</Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 text-sm">
                          <div>
                            <span className="font-medium">Start Date: </span>
                            <span className="text-slate-600">{request.startDate}</span>
                          </div>
                          <div>
                            <span className="font-medium">End Date: </span>
                            <span className="text-slate-600">{request.endDate}</span>
                          </div>
                          <div>
                            <span className="font-medium">Days: </span>
                            <span className="text-slate-600">{request.days}</span>
                          </div>
                          <div>
                            <span className="font-medium">Requested: </span>
                            <span className="text-slate-600">{request.requestDate}</span>
                          </div>
                        </div>

                        <div className="mb-4">
                          <span className="font-medium text-sm">Reason: </span>
                          <p className="text-sm text-slate-600 mt-1">{request.reason}</p>
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                            Reject
                          </Button>
                          <Button size="sm" variant="outline">View Calendar</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}