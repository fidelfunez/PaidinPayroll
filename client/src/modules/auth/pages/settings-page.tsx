// Move the existing settings-page.tsx content here
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { User, Settings, Shield, Bell, Trash2 } from "lucide-react";
import { ProfileForm } from "@/components/profile/profile-form";

export default function SettingsPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  
  const [notifications, setNotifications] = useState({
    payrollReminders: true,
    expenseUpdates: true,
    rateAlerts: false,
    weeklyReports: true,
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Header 
          title="Settings" 
          subtitle="Manage your account preferences and security settings"
        />
        
        <main className="py-8 px-6">
          <div className="max-w-4xl mx-auto">
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="preferences" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Preferences
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-6">
                <ProfileForm title="Profile Information" showCard={true} />
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Payroll Reminders</h4>
                        <p className="text-sm text-muted-foreground">Get notified about upcoming payroll schedules</p>
                      </div>
                      <Switch 
                        checked={notifications.payrollReminders}
                        onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, payrollReminders: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Expense Updates</h4>
                        <p className="text-sm text-muted-foreground">Notifications about expense reimbursement status</p>
                      </div>
                      <Switch 
                        checked={notifications.expenseUpdates}
                        onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, expenseUpdates: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Bitcoin Rate Alerts</h4>
                        <p className="text-sm text-muted-foreground">Get alerts for significant Bitcoin price changes</p>
                      </div>
                      <Switch 
                        checked={notifications.rateAlerts}
                        onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, rateAlerts: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Weekly Reports</h4>
                        <p className="text-sm text-muted-foreground">Receive weekly financial summaries</p>
                      </div>
                      <Switch 
                        checked={notifications.weeklyReports}
                        onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, weeklyReports: checked }))}
                      />
                    </div>

                    <Button className="w-full" disabled>Save Notification Settings</Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <Button variant="outline" className="w-full justify-start" disabled>
                        Change Password
                      </Button>
                      <Button variant="outline" className="w-full justify-start" disabled>
                        Enable Two-Factor Authentication
                      </Button>
                      <Button variant="outline" className="w-full justify-start" disabled>
                        View Login Activity
                      </Button>
                      <Button variant="outline" className="w-full justify-start" disabled>
                        Download Account Data
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-600">Danger Zone</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Account
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your account
                            and remove your data from our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                            Delete Account
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preferences" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Application Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Default Currency Display</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <Button variant="outline" className="justify-start" disabled>
                            USD Primary
                          </Button>
                          <Button variant="outline" className="justify-start" disabled>
                            BTC Primary
                          </Button>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Date Format</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <Button variant="outline" className="justify-start" disabled>
                            MM/DD/YYYY
                          </Button>
                          <Button variant="outline" className="justify-start" disabled>
                            DD/MM/YYYY
                          </Button>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Theme</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <Button variant="outline" className="justify-start" disabled>
                            Light Mode
                          </Button>
                          <Button variant="outline" className="justify-start" disabled>
                            Dark Mode
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
} 