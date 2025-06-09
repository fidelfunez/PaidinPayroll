import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Bell, Bitcoin, CreditCard, AlertTriangle, CheckCircle, Settings, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";

export default function NotificationsPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();

  const notifications = [
    {
      id: 1,
      type: "payment",
      title: "Bitcoin Payment Received",
      message: "Your salary payment of 0.045 BTC has been processed successfully",
      timestamp: "2 hours ago",
      read: false,
      icon: Bitcoin,
      iconColor: "text-orange-500"
    },
    {
      id: 2,
      type: "expense",
      title: "Expense Approved",
      message: "Your travel expense of $250 has been approved and will be paid in Bitcoin",
      timestamp: "1 day ago",
      read: false,
      icon: CheckCircle,
      iconColor: "text-green-500"
    },
    {
      id: 3,
      type: "security",
      title: "Security Alert",
      message: "New login detected from San Francisco, CA",
      timestamp: "2 days ago",
      read: true,
      icon: AlertTriangle,
      iconColor: "text-red-500"
    },
    {
      id: 4,
      type: "system",
      title: "Bitcoin Rate Alert",
      message: "Bitcoin price reached your target of $65,000",
      timestamp: "3 days ago",
      read: true,
      icon: Bitcoin,
      iconColor: "text-orange-500"
    },
    {
      id: 5,
      type: "payment",
      title: "Payment Schedule Updated",
      message: "Your next payroll payment is scheduled for December 15th",
      timestamp: "1 week ago",
      read: true,
      icon: CreditCard,
      iconColor: "text-blue-500"
    }
  ];

  const [notificationSettings, setNotificationSettings] = useState({
    emailPayments: true,
    emailExpenses: true,
    emailSecurity: true,
    pushPayments: true,
    pushExpenses: false,
    pushSecurity: true,
    smsPayments: false,
    smsExpenses: false,
    smsSecurity: true
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: number) => {
    // In a real app, this would make an API call
    console.log(`Marking notification ${id} as read`);
  };

  const deleteNotification = (id: number) => {
    // In a real app, this would make an API call
    console.log(`Deleting notification ${id}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <Header 
          title="Notifications" 
          subtitle={`${unreadCount} unread notifications`}
        />
        
        <main className="p-4 lg:p-6 space-y-6">
          {/* Notifications List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <Bell className="w-6 h-6 text-orange-500" />
                  Recent Notifications
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Mark All Read</Button>
                  <Button variant="outline" size="sm">Clear All</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                      notification.read ? 'bg-white' : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <notification.icon className={`w-6 h-6 ${notification.iconColor} mt-1`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium truncate">{notification.title}</h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.read && (
                            <Badge variant="default" className="text-xs">New</Badge>
                          )}
                          <span className="text-xs text-slate-500">{notification.timestamp}</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                      <div className="flex items-center gap-2 mt-3">
                        {!notification.read && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                          >
                            Mark as Read
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Settings className="w-6 h-6 text-orange-500" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Email Notifications */}
                <div>
                  <h3 className="font-medium mb-4">Email Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Payment Updates</p>
                        <p className="text-sm text-slate-600">Bitcoin payments and salary notifications</p>
                      </div>
                      <Switch 
                        checked={notificationSettings.emailPayments}
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({...prev, emailPayments: checked}))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Expense Updates</p>
                        <p className="text-sm text-slate-600">Expense approvals and reimbursements</p>
                      </div>
                      <Switch 
                        checked={notificationSettings.emailExpenses}
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({...prev, emailExpenses: checked}))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Security Alerts</p>
                        <p className="text-sm text-slate-600">Login attempts and security notifications</p>
                      </div>
                      <Switch 
                        checked={notificationSettings.emailSecurity}
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({...prev, emailSecurity: checked}))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Push Notifications */}
                <div>
                  <h3 className="font-medium mb-4">Push Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Payment Updates</p>
                        <p className="text-sm text-slate-600">Instant notifications for Bitcoin payments</p>
                      </div>
                      <Switch 
                        checked={notificationSettings.pushPayments}
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({...prev, pushPayments: checked}))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Expense Updates</p>
                        <p className="text-sm text-slate-600">Real-time expense status updates</p>
                      </div>
                      <Switch 
                        checked={notificationSettings.pushExpenses}
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({...prev, pushExpenses: checked}))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Security Alerts</p>
                        <p className="text-sm text-slate-600">Immediate security notifications</p>
                      </div>
                      <Switch 
                        checked={notificationSettings.pushSecurity}
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({...prev, pushSecurity: checked}))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* SMS Notifications */}
                <div>
                  <h3 className="font-medium mb-4">SMS Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Payment Updates</p>
                        <p className="text-sm text-slate-600">SMS alerts for large Bitcoin payments</p>
                      </div>
                      <Switch 
                        checked={notificationSettings.smsPayments}
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({...prev, smsPayments: checked}))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Security Alerts</p>
                        <p className="text-sm text-slate-600">Critical security notifications only</p>
                      </div>
                      <Switch 
                        checked={notificationSettings.smsSecurity}
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({...prev, smsSecurity: checked}))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button>Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}