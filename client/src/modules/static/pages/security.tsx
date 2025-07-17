import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, Key } from "lucide-react";

export default function SecurityPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Security</h1>
              <p className="text-gray-600">Learn about our security practices and how we protect your data</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Shield className="h-6 w-6 text-blue-600" />
                    <CardTitle>Data Protection</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    We use industry-standard encryption to protect all sensitive data. Your information is encrypted both in transit and at rest.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• AES-256 encryption for data at rest</li>
                    <li>• TLS 1.3 for data in transit</li>
                    <li>• Regular security audits</li>
                    <li>• GDPR compliance</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Lock className="h-6 w-6 text-green-600" />
                    <CardTitle>Authentication</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Secure authentication with multiple layers of protection to keep your account safe.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Multi-factor authentication (MFA)</li>
                    <li>• Session management</li>
                    <li>• Password requirements</li>
                    <li>• Account lockout protection</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Eye className="h-6 w-6 text-purple-600" />
                    <CardTitle>Privacy</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    We respect your privacy and are committed to protecting your personal information.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• No data sharing with third parties</li>
                    <li>• Minimal data collection</li>
                    <li>• Right to data deletion</li>
                    <li>• Transparent privacy policy</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Key className="h-6 w-6 text-orange-600" />
                    <CardTitle>Bitcoin Security</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Advanced security measures for Bitcoin transactions and wallet management.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Secure key management</li>
                    <li>• Multi-signature wallets</li>
                    <li>• Cold storage options</li>
                    <li>• Transaction monitoring</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
} 