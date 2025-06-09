import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Search, Download, Filter, User, DollarSign, Settings, Shield } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";

interface AuditLog {
  id: number;
  timestamp: string;
  userId: number;
  userName: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export default function AuditLogsPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");

  // Mock audit logs data
  const auditLogs: AuditLog[] = [
    {
      id: 1,
      timestamp: "2024-03-15 09:30:25",
      userId: 1,
      userName: "fidelf",
      action: "LOGIN",
      resource: "AUTH",
      details: "User logged in successfully",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      severity: "low"
    },
    {
      id: 2,
      timestamp: "2024-03-15 10:15:42",
      userId: 1,
      userName: "fidelf",
      action: "PAYROLL_PROCESS",
      resource: "PAYROLL",
      details: "Processed payroll for employee ID: 2, Amount: $6000.00",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      severity: "high"
    },
    {
      id: 3,
      timestamp: "2024-03-15 11:22:18",
      userId: 2,
      userName: "danielacerna25",
      action: "EXPENSE_SUBMIT",
      resource: "EXPENSES",
      details: "Submitted expense claim: Business travel - $450.00",
      ipAddress: "192.168.1.105",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      severity: "medium"
    },
    {
      id: 4,
      timestamp: "2024-03-15 14:45:33",
      userId: 1,
      userName: "fidelf",
      action: "USER_SETTINGS_UPDATE",
      resource: "USERS",
      details: "Updated user settings for employee: danielacerna25",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      severity: "medium"
    },
    {
      id: 5,
      timestamp: "2024-03-15 16:10:07",
      userId: 1,
      userName: "fidelf",
      action: "SECURITY_CONFIG",
      resource: "SECURITY",
      details: "Modified security configuration: 2FA settings",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      severity: "critical"
    }
  ];

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === "all" || log.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Low</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return <User className="w-4 h-4" />;
    if (action.includes('PAYROLL') || action.includes('EXPENSE')) return <DollarSign className="w-4 h-4" />;
    if (action.includes('SECURITY')) return <Shield className="w-4 h-4" />;
    return <Settings className="w-4 h-4" />;
  };

  const exportLogs = () => {
    // In a real application, this would generate and download a CSV file
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Timestamp,User,Action,Resource,Details,IP Address,Severity\n" +
      filteredLogs.map(log => 
        `${log.timestamp},${log.userName},${log.action},${log.resource},"${log.details}",${log.ipAddress},${log.severity}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "audit_logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-72'}`}>
        <Header 
          title="Audit Logs" 
          subtitle="Track system changes and security events"
        />
        
        <main className="flex-1 p-4 lg:p-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
              <p className="text-muted-foreground mt-1">Monitor all system activities and security events</p>
            </div>
            <Button onClick={exportLogs} className="bg-primary hover:bg-primary/90">
              <Download className="w-4 h-4 mr-2" />
              Export Logs
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search logs by user, action, or details..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audit Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>System Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Severity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {log.timestamp}
                        </TableCell>
                        <TableCell className="font-medium">
                          {log.userName}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getActionIcon(log.action)}
                            <span className="text-sm">{log.action}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.resource}</Badge>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="text-sm text-gray-600 truncate" title={log.details}>
                            {log.details}
                          </p>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.ipAddress}
                        </TableCell>
                        <TableCell>
                          {getSeverityBadge(log.severity)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {filteredLogs.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No audit logs found matching your criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}