import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { useBtcRate } from "@/hooks/use-btc-rate-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { 
  FileText, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  Shield, 
  Globe, 
  Users,
  TrendingUp,
  Clock,
  DollarSign,
  FileCheck,
  Settings,
  Bell
} from "lucide-react";

interface ComplianceStatus {
  id: string;
  title: string;
  status: 'compliant' | 'warning' | 'non-compliant';
  dueDate: string;
  lastUpdated: string;
  description: string;
}

interface TaxDocument {
  id: string;
  type: 'W-2' | '1099' | '941' | 'International';
  employeeName: string;
  year: number;
  status: 'draft' | 'generated' | 'filed' | 'approved';
  dueDate: string;
  amount: number;
  btcAmount: number;
}

interface AuditLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export default function TaxComplianceDashboardPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { rate: btcRate } = useBtcRate();

  // Mock compliance status data
  const complianceStatuses: ComplianceStatus[] = [
    {
      id: '1',
      title: 'Quarterly Tax Payments',
      status: 'compliant',
      dueDate: '2025-04-15',
      lastUpdated: '2025-01-15',
      description: 'Q4 2024 taxes paid on time'
    },
    {
      id: '2',
      title: 'W-2 Generation',
      status: 'warning',
      dueDate: '2025-01-31',
      lastUpdated: '2025-01-20',
      description: 'Due in 11 days - 15 employees pending'
    },
    {
      id: '3',
      title: 'International Compliance',
      status: 'non-compliant',
      dueDate: '2025-02-28',
      lastUpdated: '2025-01-10',
      description: 'Remote worker tax forms required for 3 countries'
    },
    {
      id: '4',
      title: 'Bitcoin Transaction Reporting',
      status: 'compliant',
      dueDate: '2025-01-31',
      lastUpdated: '2025-01-25',
      description: 'All BTC transactions properly documented'
    }
  ];

  // Mock tax documents
  const taxDocuments: TaxDocument[] = [
    {
      id: '1',
      type: 'W-2',
      employeeName: 'Sarah Johnson',
      year: 2024,
      status: 'generated',
      dueDate: '2025-01-31',
      amount: 85000,
      btcAmount: btcRate ? 85000 / btcRate : 0.72
    },
    {
      id: '2',
      type: '1099',
      employeeName: 'Contractor ABC',
      year: 2024,
      status: 'draft',
      dueDate: '2025-01-31',
      amount: 25000,
      btcAmount: btcRate ? 25000 / btcRate : 0.21
    },
    {
      id: '3',
      type: 'International',
      employeeName: 'Remote Worker EU',
      year: 2024,
      status: 'filed',
      dueDate: '2025-02-28',
      amount: 60000,
      btcAmount: btcRate ? 60000 / btcRate : 0.51
    }
  ];

  // Mock audit logs
  const auditLogs: AuditLog[] = [
    {
      id: '1',
      action: 'Tax Document Generated',
      user: 'Admin User',
      timestamp: '2025-01-25 14:30:00',
      details: 'Generated W-2 for Sarah Johnson',
      severity: 'medium'
    },
    {
      id: '2',
      action: 'Compliance Check Failed',
      user: 'System',
      timestamp: '2025-01-24 09:15:00',
      details: 'International tax compliance check failed for 3 employees',
      severity: 'high'
    },
    {
      id: '3',
      action: 'Document Filed',
      user: 'Admin User',
      timestamp: '2025-01-23 16:45:00',
      details: 'Filed quarterly tax return for Q4 2024',
      severity: 'medium'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'non-compliant': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'non-compliant': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatBtc = (amount: number) => {
    return `${amount.toFixed(8)} BTC`;
  };

  const formatUsd = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const complianceScore = 75; // Mock compliance score

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className={`transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Header 
          title="Tax & Compliance" 
          subtitle="Manage tax documents, compliance tracking, and audit preparation"
          btcRate={btcRate}
        />
        
        <main className="p-6 space-y-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Compliance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{complianceScore}%</div>
                  <div className="flex items-center space-x-2 mt-2">
                    <Progress value={complianceScore} className="flex-1" />
                    <Badge className={complianceScore >= 80 ? "bg-green-100 text-green-800" : complianceScore >= 60 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}>
                      {complianceScore >= 80 ? "Excellent" : complianceScore >= 60 ? "Good" : "Needs Attention"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Documents Due</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">Next due: Jan 31, 2025</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tax Liability</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$170,000</div>
                  <p className="text-xs text-muted-foreground">
                    {btcRate ? formatBtc(170000 / btcRate) : "Loading..."}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Countries</CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4</div>
                  <p className="text-xs text-muted-foreground">US, Canada, UK, Germany</p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="compliance" className="space-y-6">
              <TabsList>
                <TabsTrigger value="compliance">Compliance Status</TabsTrigger>
                <TabsTrigger value="documents">Tax Documents</TabsTrigger>
                <TabsTrigger value="audit">Audit Trail</TabsTrigger>
                <TabsTrigger value="settings">Compliance Settings</TabsTrigger>
              </TabsList>

              {/* Compliance Status Tab */}
              <TabsContent value="compliance" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Compliance Items */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-orange-500" />
                        Compliance Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {complianceStatuses.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(item.status)}
                            <div>
                              <h4 className="font-medium">{item.title}</h4>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(item.status)}>
                              {item.status.replace('-', ' ')}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">Due: {item.dueDate}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Upcoming Deadlines */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-orange-500" />
                        Upcoming Deadlines
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div>
                            <h4 className="font-medium text-yellow-800">W-2 Generation</h4>
                            <p className="text-sm text-yellow-600">15 employees pending</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-yellow-800">Jan 31</p>
                            <Badge className="bg-yellow-100 text-yellow-800">11 days</Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                          <div>
                            <h4 className="font-medium text-red-800">International Forms</h4>
                            <p className="text-sm text-red-600">3 countries pending</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-red-800">Feb 28</p>
                            <Badge className="bg-red-100 text-red-800">39 days</Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <div>
                            <h4 className="font-medium text-green-800">Q1 Tax Payment</h4>
                            <p className="text-sm text-green-600">Estimated $45,000</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-green-800">Apr 15</p>
                            <Badge className="bg-green-100 text-green-800">85 days</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Tax Documents Tab */}
              <TabsContent value="documents" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-orange-500" />
                      Tax Documents
                    </CardTitle>
                    <Button>
                      <Download className="w-4 h-4 mr-2" />
                      Generate All
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {taxDocuments.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                              <h4 className="font-medium">{doc.type} - {doc.employeeName}</h4>
                              <p className="text-sm text-muted-foreground">Tax Year: {doc.year}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="font-medium">{formatUsd(doc.amount)}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatBtc(doc.btcAmount)}
                              </p>
                            </div>
                            <Badge className={getStatusColor(doc.status)}>
                              {doc.status}
                            </Badge>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Audit Trail Tab */}
              <TabsContent value="audit" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-orange-500" />
                      Audit Trail
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            log.severity === 'critical' ? 'bg-red-100 text-red-600' :
                            log.severity === 'high' ? 'bg-orange-100 text-orange-600' :
                            log.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            {log.severity === 'critical' || log.severity === 'high' ? 
                              <AlertTriangle className="w-4 h-4" /> : 
                              <CheckCircle className="w-4 h-4" />
                            }
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{log.action}</h4>
                              <Badge className={
                                log.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                log.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                log.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }>
                                {log.severity}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{log.details}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {log.user} • {log.timestamp}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Compliance Settings Tab */}
              <TabsContent value="settings" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-orange-500" />
                        Tax Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tax Year</label>
                        <select className="w-full p-2 border rounded-md">
                          <option value="2024">2024</option>
                          <option value="2025">2025</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Default Currency</label>
                        <select className="w-full p-2 border rounded-md">
                          <option value="USD">USD</option>
                          <option value="BTC">BTC</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Auto-generate Documents</label>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" defaultChecked />
                          <span className="text-sm">Enable automatic document generation</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-orange-500" />
                        Notifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Deadline Reminders</span>
                        <input type="checkbox" className="rounded" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Compliance Alerts</span>
                        <input type="checkbox" className="rounded" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Audit Notifications</span>
                        <input type="checkbox" className="rounded" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Tax Rate Changes</span>
                        <input type="checkbox" className="rounded" defaultChecked />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
