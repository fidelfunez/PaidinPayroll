import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, Database, UserCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";

export default function PrivacyPolicyPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();

  // Content component (shared for both authenticated and public views)
  const PrivacyContent = () => (
    <main className={`p-4 lg:p-6 space-y-6 max-w-4xl ${user ? '' : 'mx-auto mt-8'}`}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-orange-500" />
                Privacy Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <p className="text-slate-600 mb-6">
                <strong>Last updated:</strong> {new Date().toLocaleDateString()}
              </p>

              <div className="space-y-8">
                <section>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5 text-orange-500" />
                    Information We Collect
                  </h2>
                  <div className="space-y-4 text-slate-600">
                    <div>
                      <h3 className="font-medium text-slate-900 mb-2">Personal Information</h3>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Name, email address, and contact information</li>
                        <li>Employment details including role and salary information</li>
                        <li>Bitcoin wallet addresses for payment processing</li>
                        <li>Profile photos and biographical information (optional)</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900 mb-2">Financial Information</h3>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Payroll payment records and transaction history</li>
                        <li>Expense reimbursement requests and receipts</li>
                        <li>Bitcoin transaction data and wallet balances</li>
                        <li>Tax-related information for compliance purposes</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900 mb-2">Technical Information</h3>
                      <ul className="list-disc list-inside space-y-1">
                        <li>IP addresses, browser type, and device information</li>
                        <li>Usage patterns and feature interactions</li>
                        <li>Session data and authentication tokens</li>
                        <li>Error logs and performance metrics</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-orange-500" />
                    How We Use Your Information
                  </h2>
                  <div className="space-y-4 text-slate-600">
                    <div>
                      <h3 className="font-medium text-slate-900 mb-2">Core Services</h3>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Processing Bitcoin payroll payments to employees</li>
                        <li>Managing expense reimbursements and approvals</li>
                        <li>Providing real-time Bitcoin rate conversions</li>
                        <li>Generating financial reports and analytics</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900 mb-2">Communication</h3>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Sending payment notifications and confirmations</li>
                        <li>Providing account updates and security alerts</li>
                        <li>Delivering customer support and technical assistance</li>
                        <li>Sharing important service announcements</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900 mb-2">Legal Compliance</h3>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Meeting financial reporting requirements</li>
                        <li>Complying with anti-money laundering (AML) regulations</li>
                        <li>Fulfilling tax reporting obligations</li>
                        <li>Responding to lawful government requests</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-orange-500" />
                    Your Rights and Controls
                  </h2>
                  <div className="space-y-4 text-slate-600">
                    <div>
                      <h3 className="font-medium text-slate-900 mb-2">Access and Portability</h3>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Request a copy of all personal data we hold about you</li>
                        <li>Export your financial transaction history</li>
                        <li>Download account data in machine-readable formats</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900 mb-2">Correction and Deletion</h3>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Update personal information through your account settings</li>
                        <li>Request correction of inaccurate data</li>
                        <li>Delete your account and associated data (subject to legal requirements)</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900 mb-2">Communication Preferences</h3>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Opt out of non-essential email communications</li>
                        <li>Customize notification settings for different event types</li>
                        <li>Choose your preferred communication channels</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-4">Data Security</h2>
                  <p className="text-slate-600 mb-4">
                    We implement industry-standard security measures to protect your information:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-slate-600">
                    <li>End-to-end encryption for all sensitive data transmission</li>
                    <li>AES-256 encryption for data at rest</li>
                    <li>Regular security audits and penetration testing</li>
                    <li>Multi-factor authentication and session management</li>
                    <li>Secure Bitcoin wallet storage using cold storage techniques</li>
                    <li>Employee access controls and background checks</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-4">Data Retention</h2>
                  <p className="text-slate-600 mb-4">
                    We retain your information for as long as necessary to provide our services and comply with legal obligations:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-slate-600">
                    <li>Active account data: Retained while your account is active</li>
                    <li>Financial records: 7 years for tax and audit purposes</li>
                    <li>Transaction logs: 5 years for regulatory compliance</li>
                    <li>Support communications: 3 years for quality assurance</li>
                    <li>Marketing data: Until you opt out or request deletion</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-4">International Transfers</h2>
                  <p className="text-slate-600">
                    If you are located outside the United States, your information may be transferred to and 
                    processed in countries where we operate. We ensure appropriate safeguards are in place 
                    to protect your data in accordance with this privacy policy and applicable laws.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
                  <p className="text-slate-600 mb-4">
                    If you have questions about this privacy policy or how we handle your information, 
                    please contact us:
                  </p>
                  <div className="bg-slate-100 p-4 rounded-lg">
                    <p className="text-slate-900 font-medium">Data Protection Officer</p>
                    <p className="text-slate-600">Email: privacy@paidin.com</p>
                    <p className="text-slate-600">Address: [Company Address]</p>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-4">Policy Updates</h2>
                  <p className="text-slate-600">
                    We may update this privacy policy from time to time. We will notify you of any material 
                    changes by email and by posting the updated policy on our website. Your continued use 
                    of our services after such changes constitutes your acceptance of the updated policy.
                  </p>
                </section>
              </div>
            </CardContent>
          </Card>
        </main>
  );

  // If user is authenticated, show full app layout
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-background to-gray-50 flex">
        <Sidebar />
        <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16 lg:ml-16' : 'ml-16 lg:ml-64'}`}>
          <Header 
            title="Privacy Policy" 
            subtitle="How we collect, use, and protect your information"
          />
          <PrivacyContent />
        <Footer />
        </div>
      </div>
    );
  }

  // Public standalone version (no sidebar/header)
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-background to-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-600">How we collect, use, and protect your information</p>
        </div>
        <PrivacyContent />
      </div>
    </div>
  );
}