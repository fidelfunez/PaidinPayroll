import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { useBtcRate } from "@/hooks/use-btc-rate-context";
import {
  BookOpen,
  Play,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  Shield,
  Zap,
  ArrowRight,
  Star,
  Award,
  Target
} from "lucide-react";

export default function BitcoinEducationPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { rate: btcRate } = useBtcRate();

  const courses = [
    {
      id: 1,
      title: "Bitcoin Fundamentals",
      description: "Learn the basics of Bitcoin, how it works, and why it matters for your business.",
      duration: "15 min",
      difficulty: "Beginner",
      completed: true,
      icon: BookOpen,
      color: "bg-blue-500"
    },
    {
      id: 2,
      title: "Lightning Network Explained",
      description: "Understand how Lightning Network enables fast, low-cost Bitcoin transactions.",
      duration: "20 min",
      difficulty: "Intermediate",
      completed: true,
      icon: Zap,
      color: "bg-orange-500"
    },
    {
      id: 3,
      title: "Bitcoin for Business",
      description: "Learn how to integrate Bitcoin payments into your business operations.",
      duration: "25 min",
      difficulty: "Intermediate",
      completed: false,
      icon: TrendingUp,
      color: "bg-green-500"
    },
    {
      id: 4,
      title: "Security Best Practices",
      description: "Essential security practices for managing Bitcoin in a business environment.",
      duration: "30 min",
      difficulty: "Advanced",
      completed: false,
      icon: Shield,
      color: "bg-red-500"
    }
  ];

  const achievements = [
    {
      id: 1,
      title: "Bitcoin Basics",
      description: "Completed Bitcoin Fundamentals course",
      icon: Star,
      earned: true
    },
    {
      id: 2,
      title: "Lightning Learner",
      description: "Completed Lightning Network course",
      icon: Zap,
      earned: true
    },
    {
      id: 3,
      title: "Business Bitcoiner",
      description: "Complete Bitcoin for Business course",
      icon: Target,
      earned: false
    },
    {
      id: 4,
      title: "Security Expert",
      description: "Complete Security Best Practices course",
      icon: Shield,
      earned: false
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16 lg:ml-16' : 'ml-16 lg:ml-64'}`}>
        <Header
          title="Bitcoin Education"
          subtitle="Learn about Bitcoin and how to use it effectively in your business"
        />

        <main className="p-4 lg:p-6 space-y-6">
          {/* Progress Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Courses Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2/4</div>
                <p className="text-xs text-muted-foreground">50% complete</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Time Spent</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">35 min</div>
                <p className="text-xs text-muted-foreground">Total learning time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Achievements</CardTitle>
                <Award className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2/4</div>
                <p className="text-xs text-muted-foreground">Badges earned</p>
              </CardContent>
            </Card>
          </div>

          {/* Course List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Learning Path
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courses.map((course, index) => {
                  const Icon = course.icon;
                  return (
                    <div key={course.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                      <div className={`w-12 h-12 ${course.color} rounded-lg flex items-center justify-center`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{course.title}</h3>
                          {course.completed && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{course.description}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {course.duration}
                          </Badge>
                          <Badge className={`text-xs ${getDifficultyColor(course.difficulty)}`}>
                            {course.difficulty}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {course.completed ? (
                          <Button variant="outline" size="sm">
                            <Play className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                        ) : (
                          <Button size="sm">
                            <Play className="h-4 w-4 mr-2" />
                            Start Course
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement) => {
                  const Icon = achievement.icon;
                  return (
                    <div key={achievement.id} className={`flex items-center gap-3 p-3 rounded-lg border ${
                      achievement.earned ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        achievement.earned ? 'bg-green-500' : 'bg-slate-300'
                      }`}>
                        <Icon className={`h-5 w-5 ${achievement.earned ? 'text-white' : 'text-slate-600'}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{achievement.title}</h4>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      </div>
                      {achievement.earned && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-auto p-4 justify-start">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Continue Learning</div>
                      <div className="text-sm text-muted-foreground">Resume your current course</div>
                    </div>
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </div>
                </Button>

                <Button variant="outline" className="h-auto p-4 justify-start">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Team Training</div>
                      <div className="text-sm text-muted-foreground">Set up training for your team</div>
                    </div>
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
