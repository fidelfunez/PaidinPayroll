import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { User, Settings, Shield, Bell, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    payrollReminders: true,
    expenseUpdates: true,
    rateAlerts: false,
    weeklyReports: true,
  });

  const [profile, setProfile] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    btcAddress: user?.btcAddress || "",
  });

  const handleSaveProfile = () => {
    // TODO: Implement profile update API call
    console.log("Saving profile:", profile);
  };

  const handleSaveNotifications = () => {
    // TODO: Implement notification settings API call
    console.log("Saving notifications:", notifications);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:pl-72">
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
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">
                          {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{user?.firstName} {user?.lastName}</h3>
                        <p className="text-muted-foreground">{user?.email}</p>
                        <Badge variant={user?.role === 'admin' ? 'default' : 'secondary'} className="mt-1">
                          {user?.role}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={profile.firstName}
                          onChange={(e) => setProfile({...profile, firstName: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={profile.lastName}
                          onChange={(e) => setProfile({...profile, lastName: e.target.value})}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({...profile, email: e.target.value})}
                      />
                    </div>

                    <div>
                      <Label htmlFor="btcAddress">Bitcoin Address</Label>
                      <Input
                        id="btcAddress"
                        placeholder="Enter your Bitcoin address for payments"
                        value={profile.btcAddress}
                        onChange={(e) => setProfile({...profile, btcAddress: e.target.value})}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        This address will be used for salary and reimbursement payments
                      </p>
                    </div>

                    <Button onClick={handleSaveProfile} className="w-full">
                      Save Profile Changes
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="payroll-reminders">Payroll Reminders</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified about upcoming payroll payments
                        </p>
                      </div>
                      <Switch
                        id="payroll-reminders"
                        checked={notifications.payrollReminders}
                        onCheckedChange={(checked) => 
                          setNotifications({...notifications, payrollReminders: checked})
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="expense-updates">Expense Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications about expense approval status
                        </p>
                      </div>
                      <Switch
                        id="expense-updates"
                        checked={notifications.expenseUpdates}
                        onCheckedChange={(checked) => 
                          setNotifications({...notifications, expenseUpdates: checked})
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="rate-alerts">Bitcoin Rate Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Get alerts for significant Bitcoin price changes
                        </p>
                      </div>
                      <Switch
                        id="rate-alerts"
                        checked={notifications.rateAlerts}
                        onCheckedChange={(checked) => 
                          setNotifications({...notifications, rateAlerts: checked})
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="weekly-reports">Weekly Reports</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive weekly summary reports via email
                        </p>
                      </div>
                      <Switch
                        id="weekly-reports"
                        checked={notifications.weeklyReports}
                        onCheckedChange={(checked) => 
                          setNotifications({...notifications, weeklyReports: checked})
                        }
                      />
                    </div>

                    <Button onClick={handleSaveNotifications} className="w-full">
                      Save Notification Settings
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label>Change Password</Label>
                      <p className="text-sm text-muted-foreground mb-3">
                        Update your password to keep your account secure
                      </p>
                      <div className="space-y-3">
                        <Input type="password" placeholder="Current password" />
                        <Input type="password" placeholder="New password" />
                        <Input type="password" placeholder="Confirm new password" />
                      </div>
                      <Button className="mt-3">Update Password</Button>
                    </div>

                    <Separator />

                    <div>
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground mb-3">
                        Add an extra layer of security to your account
                      </p>
                      <Badge variant="outline" className="mb-3">Not Enabled</Badge>
                      <br />
                      <Button variant="outline">Enable 2FA</Button>
                    </div>

                    <Separator />

                    <div>
                      <Label>Active Sessions</Label>
                      <p className="text-sm text-muted-foreground mb-3">
                        Manage where you're signed in
                      </p>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Current Session</p>
                            <p className="text-sm text-muted-foreground">Chrome on macOS • Active now</p>
                          </div>
                          <Badge variant="secondary">Current</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preferences" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Application Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select defaultValue="utc">
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="utc">UTC</SelectItem>
                          <SelectItem value="est">Eastern Time</SelectItem>
                          <SelectItem value="pst">Pacific Time</SelectItem>
                          <SelectItem value="cet">Central European Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="currency">Default Currency Display</Label>
                      <Select defaultValue="usd">
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="usd">USD ($)</SelectItem>
                          <SelectItem value="btc">BTC (₿)</SelectItem>
                          <SelectItem value="both">Both USD & BTC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="dateformat">Date Format</Label>
                      <Select defaultValue="mm-dd-yyyy">
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select date format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mm-dd-yyyy">MM/DD/YYYY</SelectItem>
                          <SelectItem value="dd-mm-yyyy">DD/MM/YYYY</SelectItem>
                          <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button className="w-full">Save Preferences</Button>
                  </CardContent>
                </Card>

                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-600 flex items-center gap-2">
                      <Trash2 className="w-5 h-5" />
                      Danger Zone
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">Delete Account</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete your account and remove all your data from our servers.
                            This action cannot be undone.
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
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}