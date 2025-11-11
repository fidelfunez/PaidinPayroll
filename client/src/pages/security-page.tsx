import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Key, Eye, AlertTriangle, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";

export default function SecurityPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();

  const securityFeatures = [
    {
      title: "End-to-End Encryption",
      description: "All sensitive data is encrypted using AES-256 encryption",
      icon: Lock,
      status: "active"
    },
    {
      title: "Multi-Factor Authentication",
      description: "Optional 2FA using TOTP authenticator apps",
      icon: Key,
      status: "available"
    },
    {
      title: "Session Management",
      description: "Automatic session timeouts and secure cookie handling",
      icon: Eye,
      status: "active"
    },
    {
      title: "Bitcoin Wallet Security",
      description: "Cold storage and multi-signature wallet support",
      icon: Shield,
      status: "active"
    }
  ];

  const securityPractices = [
    "Regular security audits by third-party firms",
    "Continuous monitoring for suspicious activities",
    "Secure development lifecycle (SDLC) practices",
    "Employee background checks and security training",
    "Data backup and disaster recovery procedures",
    "Compliance with financial industry standards"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-background to-gray-50 flex">
      <Sidebar />
      <div className={`flex-1 flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16 lg:ml-16' : 'ml-16 lg:ml-64'}`}>
        <Header 
          title="Security" 
          subtitle="How we protect your Bitcoin and personal data"
        />
        
        <main className="p-4 lg:p-6 space-y-6">
          {/* Security Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-orange-500" />
                Security Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-6">
                Security is our top priority. We implement industry-leading security measures to protect 
                your Bitcoin assets and personal information. Our platform is designed with security-first 
                principles and undergoes regular security audits.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {securityFeatures.map((feature, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <feature.icon className="w-6 h-6 text-orange-500 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{feature.title}</h3>
                          <Badge 
                            variant={feature.status === 'active' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {feature.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Data Protection */}
          <Card>
            <CardHeader>
              <CardTitle>Data Protection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <h3 className="font-medium">GDPR Compliant</h3>
                  <p className="text-sm text-slate-600">Full compliance with EU data protection laws</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Shield className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <h3 className="font-medium">SOC 2 Type II</h3>
                  <p className="text-sm text-slate-600">Audited security controls and processes</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Lock className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <h3 className="font-medium">Zero Trust</h3>
                  <p className="text-sm text-slate-600">Never trust, always verify security model</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Practices */}
          <Card>
            <CardHeader>
              <CardTitle>Our Security Practices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {securityPractices.map((practice, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-600">{practice}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Incident Response */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
                Incident Response
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">
                In the unlikely event of a security incident, we have a comprehensive response plan:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
                  <div>
                    <h4 className="font-medium">Immediate Containment</h4>
                    <p className="text-sm text-slate-600">Isolate affected systems and prevent further damage</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
                  <div>
                    <h4 className="font-medium">User Notification</h4>
                    <p className="text-sm text-slate-600">Notify affected users within 24 hours</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-medium">3</div>
                  <div>
                    <h4 className="font-medium">Investigation & Recovery</h4>
                    <p className="text-sm text-slate-600">Conduct thorough investigation and implement fixes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-medium">4</div>
                  <div>
                    <h4 className="font-medium">Transparency Report</h4>
                    <p className="text-sm text-slate-600">Publish detailed incident report and preventive measures</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Security Team */}
          <Card>
            <CardHeader>
              <CardTitle>Report Security Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">
                If you discover a security vulnerability, please report it to our security team immediately.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="flex-1">
                  Report Security Issue
                </Button>
                <Button variant="outline" className="flex-1">
                  View Bug Bounty Program
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