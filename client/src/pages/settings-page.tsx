import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Settings, Shield, Bell, Eye, EyeOff } from "lucide-react";
import { ProfileForm } from "@/components/profile/profile-form";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('profile');
  
  // Password change state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [notifications, setNotifications] = useState({
    transactionAlerts: true,
    walletUpdates: true,
    rateAlerts: false,
    weeklyReports: true,
  });

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      const token = localStorage.getItem('authToken');
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to change password");
      }
      return res.json();
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error changing password",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    },
  });

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Missing information",
        description: "Please fill in all password fields",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation must match",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and security settings</p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
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
          <Card className="hover:shadow-lg transition-shadow max-w-2xl">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Transaction Alerts</h4>
                    <p className="text-sm text-muted-foreground">Get notified about new transactions</p>
                  </div>
                  <Switch 
                    checked={notifications.transactionAlerts}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, transactionAlerts: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Wallet Updates</h4>
                    <p className="text-sm text-muted-foreground">Notifications about wallet changes</p>
                  </div>
                  <Switch 
                    checked={notifications.walletUpdates}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, walletUpdates: checked }))}
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
                    <p className="text-sm text-muted-foreground">Receive weekly accounting summaries</p>
                  </div>
                  <Switch 
                    checked={notifications.weeklyReports}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, weeklyReports: checked }))}
                  />
                </div>

                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white" disabled>Save Notification Preferences</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="hover:shadow-lg transition-shadow max-w-2xl">
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Change Password</h4>
                    <p className="text-sm text-muted-foreground mb-4">Update your password to keep your account secure</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password (min 8 characters)"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Must be at least 8 characters long</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <Button
                      onClick={handleChangePassword}
                      disabled={changePasswordMutation.isPending || !currentPassword || !newPassword || !confirmPassword}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </div>

                <div className="pt-6 border-t space-y-2">
                  <h4 className="font-medium">Two-Factor Authentication</h4>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                  <Button variant="outline" className="mt-2" disabled>Enable 2FA</Button>
                </div>

                <div className="pt-6 border-t space-y-2">
                  <h4 className="font-medium">Active Sessions</h4>
                  <p className="text-sm text-muted-foreground">Manage your active sessions across devices</p>
                  <Button variant="outline" className="mt-2" disabled>View Sessions</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card className="hover:shadow-lg transition-shadow max-w-2xl">
              <CardHeader>
                <CardTitle>Application Preferences</CardTitle>
                <CardDescription>Customize your experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h4 className="font-medium">Language</h4>
                  <p className="text-sm text-muted-foreground">Select your preferred language</p>
                  <Button variant="outline" className="w-full justify-start mt-2" disabled>
                    English (US)
                  </Button>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Timezone</h4>
                  <p className="text-sm text-muted-foreground">Set your timezone for accurate timestamps</p>
                  <Button variant="outline" className="w-full justify-start mt-2" disabled>
                    UTC (Coordinated Universal Time)
                  </Button>
                </div>

                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white" disabled>Save Preferences</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}
