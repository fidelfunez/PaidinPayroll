import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Gift, Heart, Umbrella, GraduationCap, Car, Home, Zap, Check } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";

export default function BenefitsPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();

  const benefits = [
    {
      title: "Health Insurance",
      icon: Heart,
      status: "active",
      coverage: "100%",
      description: "Comprehensive health, dental, and vision coverage",
      details: [
        "Medical insurance with $0 deductible",
        "Dental and vision included",
        "Mental health support",
        "Annual health stipend: $2,000"
      ]
    },
    {
      title: "Bitcoin Education",
      icon: GraduationCap,
      status: "active", 
      coverage: "Unlimited",
      description: "Learn about Bitcoin and financial sovereignty",
      details: [
        "Bitcoin certification courses",
        "Conference attendance budget",
        "Monthly Bitcoin meetups",
        "Technical training resources"
      ]
    },
    {
      title: "Remote Work Stipend",
      icon: Home,
      status: "active",
      coverage: "$3,000/year",
      description: "Home office setup and equipment",
      details: [
        "Initial setup: $2,000",
        "Annual refresh: $1,000", 
        "Internet reimbursement",
        "Ergonomic equipment"
      ]
    },
    {
      title: "Bitcoin Savings Match",
      icon: Zap,
      status: "active",
      coverage: "50% match",
      description: "Company matches your Bitcoin savings",
      details: [
        "Up to 10% of salary matched",
        "Immediate vesting",
        "Cold storage support",
        "DCA strategy guidance"
      ]
    },
    {
      title: "Transportation",
      icon: Car,
      status: "available",
      coverage: "$500/month",
      description: "Transit passes and bike-to-work programs",
      details: [
        "Public transit passes",
        "Bike purchase reimbursement",
        "Parking allowance",
        "Electric vehicle incentives"
      ]
    },
    {
      title: "Life Insurance",
      icon: Umbrella,
      status: "active",
      coverage: "2x salary",
      description: "Life and disability insurance coverage",
      details: [
        "Life insurance: 2x annual salary",
        "Short-term disability",
        "Long-term disability",
        "Accidental death coverage"
      ]
    }
  ];

  const wellnessPrograms = [
    {
      name: "Bitcoin Wellness Fridays",
      participants: 87,
      description: "Weekly sessions on financial health and Bitcoin fundamentals"
    },
    {
      name: "Mental Health Support", 
      participants: 45,
      description: "Counseling sessions and stress management"
    },
    {
      name: "Fitness Reimbursement",
      participants: 62,
      description: "Gym memberships and fitness equipment"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-background to-gray-50 flex">
      <Sidebar />
      <div className={`flex-1 flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16 lg:ml-16' : 'ml-16 lg:ml-64'}`}>
        <Header 
          title="Benefits" 
          subtitle="Your comprehensive benefits package"
        />
        
        <main className="p-4 lg:p-6 space-y-6">
          {/* Benefits Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Gift className="w-6 h-6 text-orange-500" />
                Benefits Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">95%</div>
                  <div className="text-sm text-slate-600">Coverage Rate</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">$8,500</div>
                  <div className="text-sm text-slate-600">Annual Value</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">6</div>
                  <div className="text-sm text-slate-600">Active Benefits</div>
                </div>
              </div>
              <p className="text-slate-600">
                Our comprehensive benefits package is designed to support your financial sovereignty 
                and well-being while embracing the Bitcoin standard.
              </p>
            </CardContent>
          </Card>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <benefit.icon className="w-6 h-6 text-orange-500" />
                      <CardTitle className="text-lg">{benefit.title}</CardTitle>
                    </div>
                    <Badge variant={benefit.status === 'active' ? 'default' : 'secondary'}>
                      {benefit.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Coverage</span>
                    <span className="text-sm font-bold text-orange-600">{benefit.coverage}</span>
                  </div>
                  <p className="text-slate-600 text-sm">{benefit.description}</p>
                  <ul className="space-y-1">
                    {benefit.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-start gap-2 text-sm text-slate-600">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full" disabled>
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Wellness Programs */}
          <Card>
            <CardHeader>
              <CardTitle>Wellness Programs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {wellnessPrograms.map((program, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{program.name}</h3>
                        <p className="text-sm text-slate-600">{program.description}</p>
                      </div>
                      <Badge variant="outline">{program.participants} enrolled</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Participation Rate</span>
                        <span>{Math.round((program.participants / 120) * 100)}%</span>
                      </div>
                      <Progress value={(program.participants / 120) * 100} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Benefits Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button className="h-auto p-4 flex flex-col gap-2" disabled>
                  <Heart className="w-6 h-6" />
                  <span>Update Healthcare</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col gap-2" disabled>
                  <GraduationCap className="w-6 h-6" />
                  <span>Education Credits</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col gap-2" disabled>
                  <Gift className="w-6 h-6" />
                  <span>Benefits Support</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}