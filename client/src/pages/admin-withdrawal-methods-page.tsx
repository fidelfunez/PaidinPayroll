import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, Settings, Users, AlertTriangle, Bitcoin, Building2, CreditCard } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";

export default function AdminWithdrawalMethodsPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();

  const employeePayoutMethods = [
    {
      id: 1,
      employeeName: "Sarah Johnson",
      email: "sarah@company.com",
      method: "Bitcoin Wallet",
      address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      status: "verified",
      lastUpdated: "2024-01-15"
    },
    {
      id: 2,
      employeeName: "Mike Chen",
      email: "mike@company.com", 
      method: "Bitcoin Wallet",
      address: "bc1qw8wcdqr4zy8h7a2l6k9j8h7g6f5d4s3a2q1w0e9r8t7y6",
      status: "verified",
      lastUpdated: "2024-01-10"
    },
    {
      id: 3,
      employeeName: "Alex Rodriguez",
      email: "alex@company.com",
      method: "Bank Transfer",
      address: "****1234",
      status: "pending",
      lastUpdated: "2024-01-20"
    }
  ];

  const companySettings = {
    defaultMethod: "bitcoin",
    allowBankTransfers: true,
    allowLightning: false,
    minimumThreshold: 0.001,
    processingSchedule: "weekly"
  };

  const paymentStats = {
    totalEmployees: 15,
    bitcoinUsers: 12,
    bankUsers: 3,
    pendingSetup: 2
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Header 
          title="Employee Withdrawal Methods" 
          subtitle="Manage how employees receive Bitcoin payments"
        />
        
        <main className="p-4 lg:p-6 space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                    <p className="text-2xl font-bold">{paymentStats.totalEmployees}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Bitcoin Users</p>
                    <p className="text-2xl font-bold">{paymentStats.bitcoinUsers}</p>
                  </div>
                  <Bitcoin className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Bank Users</p>
                    <p className="text-2xl font-bold">{paymentStats.bankUsers}</p>
                  </div>
                  <Building2 className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Setup</p>
                    <p className="text-2xl font-bold">{paymentStats.pendingSetup}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="employees" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="employees">Employee Methods</TabsTrigger>
              <TabsTrigger value="settings">Company Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="employees" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Wallet className="w-6 h-6 text-orange-500" />
                    Employee Withdrawal Methods
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {employeePayoutMethods.map((employee) => (
                      <div key={employee.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-medium">{employee.employeeName}</h3>
                            <p className="text-sm text-slate-600">{employee.email}</p>
                          </div>
                          <Badge variant={
                            employee.status === 'verified' ? 'default' : 
                            employee.status === 'pending' ? 'secondary' : 'outline'
                          }>
                            {employee.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Method: </span>
                            <span className="text-slate-600">{employee.method}</span>
                          </div>
                          <div>
                            <span className="font-medium">Address: </span>
                            <span className="text-slate-600 font-mono text-xs">
                              {employee.address}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Last Updated: </span>
                            <span className="text-slate-600">{employee.lastUpdated}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <Button size="sm" variant="outline">View Details</Button>
                          <Button size="sm" variant="outline">Contact Employee</Button>
                          {employee.status === 'pending' && (
                            <Button size="sm">Approve</Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Settings className="w-6 h-6 text-orange-500" />
                    Company Withdrawal Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="default-method">Default Payment Method</Label>
                      <Select value={companySettings.defaultMethod}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bitcoin">Bitcoin Wallet</SelectItem>
                          <SelectItem value="lightning">Lightning Network</SelectItem>
                          <SelectItem value="bank">Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="processing-schedule">Processing Schedule</Label>
                      <Select value={companySettings.processingSchedule}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Bi-weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="minimum-threshold">Minimum Threshold (BTC)</Label>
                      <Input 
                        id="minimum-threshold"
                        type="number"
                        step="0.00001"
                        defaultValue={companySettings.minimumThreshold}
                      />
                    </div>

                    <div>
                      <Label htmlFor="backup-method">Backup Payment Method</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select backup method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank">Bank Transfer</SelectItem>
                          <SelectItem value="check">Paper Check</SelectItem>
                          <SelectItem value="paypal">PayPal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-900 mb-1">Payment Processing Notice</p>
                        <p className="text-blue-700">
                          Changes to payment settings will take effect with the next payroll cycle. 
                          Employees will be notified of any changes to their withdrawal methods.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button>Save Settings</Button>
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