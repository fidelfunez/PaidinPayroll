import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { useBtcRate } from "@/hooks/use-btc-rate-context";
import {
  CheckCircle,
  ArrowRight,
  Play,
  BookOpen,
  Users,
  Wallet,
  DollarSign,
  Shield,
  Zap,
  Clock,
  Target,
  Star
} from "lucide-react";

export default function GettingStartedPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { rate: btcRate } = useBtcRate();

  const steps = [
    {
      id: 1,
      title: "Complete Company Setup",
      description: "Finish setting up your company profile and admin account",
      completed: true,
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      id: 2,
      title: "Fund Your Wallet",
      description: "Add Bitcoin to your company wallet to start making payments",
      completed: false,
      icon: Wallet,
      color: "text-orange-600"
    },
    {
      id: 3,
      title: "Add Your First Employee",
      description: "Invite team members and set up their profiles",
      completed: false,
      icon: Users,
      color: "text-blue-600"
    },
    {
      id: 4,
      title: "Run Your First Payroll",
      description: "Process your first Bitcoin payroll payment",
      completed: false,
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      id: 5,
      title: "Learn Bitcoin Basics",
      description: "Complete the Bitcoin education course",
      completed: false,
      icon: BookOpen,
      color: "text-purple-600"
    }
  ];

  const quickActions = [
    {
      title: "Fund Wallet",
      description: "Add Bitcoin to your company wallet",
      icon: Wallet,
      href: "/wallet",
      color: "bg-orange-500"
    },
    {
      title: "Add Employee",
      description: "Invite your first team member",
      icon: Users,
      href: "/employees",
      color: "bg-blue-500"
    },
    {
      title: "Bitcoin Education",
      description: "Learn about Bitcoin and best practices",
      icon: BookOpen,
      href: "/bitcoin-education",
      color: "bg-purple-500"
    },
    {
      title: "Run Payroll",
      description: "Process your first Bitcoin payment",
      icon: DollarSign,
      href: "/payroll",
      color: "bg-green-500"
    }
  ];

  const tips = [
    {
      title: "Start Small",
      description: "Begin with small Bitcoin amounts to get comfortable with the system",
      icon: Target
    },
    {
      title: "Use Lightning",
      description: "Lightning Network enables fast, low-cost Bitcoin transactions",
      icon: Zap
    },
    {
      title: "Keep Learning",
      description: "Bitcoin is constantly evolving - stay updated with new features",
      icon: BookOpen
    },
    {
      title: "Security First",
      description: "Always follow security best practices when handling Bitcoin",
      icon: Shield
    }
  ];

  const completedSteps = steps.filter(step => step.completed).length;
  const progress = (completedSteps / steps.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16 lg:ml-16' : 'ml-16 lg:ml-64'}`}>
        <Header
          title="Getting Started"
          subtitle="Complete your setup and start using PaidIn effectively"
        />

        <main className="p-4 lg:p-6 space-y-6">
          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Setup Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">{completedSteps}/{steps.length} steps completed</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {progress === 100 ? "🎉 Congratulations! You're all set up!" : 
                   `You're ${Math.round(progress)}% complete with your setup.`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Setup Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Setup Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        step.completed ? 'bg-green-100' : 'bg-slate-100'
                      }`}>
                        {step.completed ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <span className="text-sm font-medium text-slate-600">{step.id}</span>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold">{step.title}</h3>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {step.completed ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Completed
                          </Badge>
                        ) : (
                          <Button size="sm" variant="outline">
                            <ArrowRight className="h-4 w-4 mr-2" />
                            Start
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-center gap-3 hover:bg-slate-50"
                    >
                      <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{action.title}</div>
                        <div className="text-xs text-muted-foreground">{action.description}</div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Tips & Best Practices */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Tips & Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tips.map((tip, index) => {
                  const Icon = tip.icon;
                  return (
                    <div key={index} className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">{tip.title}</h4>
                        <p className="text-sm text-muted-foreground">{tip.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Support */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <h4 className="font-medium">Get Support</h4>
                  <p className="text-sm text-muted-foreground">
                    Our team is here to help you get started with PaidIn
                  </p>
                </div>
                <Button>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
