import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Scale, AlertTriangle, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";

export default function TermsOfServicePage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <Header 
          title="Terms of Service" 
          subtitle="Legal terms and conditions for using PaidIn"
        />
        
        <main className="p-4 lg:p-6 space-y-6 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-orange-500" />
                Terms of Service
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <p className="text-slate-600 mb-6">
                <strong>Last updated:</strong> {new Date().toLocaleDateString()}
              </p>

              <div className="space-y-8">
                <section>
                  <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
                  <p className="text-slate-600 mb-4">
                    By accessing and using PaidIn ("the Service"), you agree to be bound by these Terms of Service 
                    and our Privacy Policy. If you disagree with any part of these terms, you may not access the Service.
                  </p>
                  <p className="text-slate-600">
                    These terms apply to all visitors, users, and others who access or use the Service.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-500" />
                    2. Description of Service
                  </h2>
                  <p className="text-slate-600 mb-4">
                    PaidIn is a Bitcoin-native payroll and expense reimbursement platform that enables:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-slate-600">
                    <li>Processing employee salaries in Bitcoin</li>
                    <li>Managing expense reimbursements with Bitcoin conversion</li>
                    <li>Real-time Bitcoin rate tracking and conversion</li>
                    <li>Financial reporting and analytics for Bitcoin transactions</li>
                    <li>Multi-user access with role-based permissions</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-4">3. User Accounts</h2>
                  <div className="space-y-4 text-slate-600">
                    <div>
                      <h3 className="font-medium text-slate-900 mb-2">Account Creation</h3>
                      <ul className="list-disc list-inside space-y-1">
                        <li>You must provide accurate and complete information when creating an account</li>
                        <li>You are responsible for maintaining the security of your account credentials</li>
                        <li>You must be at least 18 years old to use the Service</li>
                        <li>One account per person; multiple accounts are prohibited</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900 mb-2">Account Responsibilities</h3>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Notify us immediately of any unauthorized access to your account</li>
                        <li>Keep your Bitcoin wallet information secure and up-to-date</li>
                        <li>Comply with all applicable laws and regulations</li>
                        <li>Use the Service only for legitimate business purposes</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-4">4. Bitcoin Transactions</h2>
                  <div className="space-y-4 text-slate-600">
                    <div>
                      <h3 className="font-medium text-slate-900 mb-2">Transaction Processing</h3>
                      <ul className="list-disc list-inside space-y-1">
                        <li>All Bitcoin transactions are irreversible once confirmed on the blockchain</li>
                        <li>Transaction fees may apply and will be clearly disclosed</li>
                        <li>Processing times depend on Bitcoin network conditions</li>
                        <li>You are responsible for providing accurate wallet addresses</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900 mb-2">Exchange Rates</h3>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Bitcoin exchange rates are provided for reference only</li>
                        <li>Rates may fluctuate significantly and without notice</li>
                        <li>We are not responsible for losses due to rate changes</li>
                        <li>Historical rates are provided for informational purposes</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-4">5. Prohibited Uses</h2>
                  <p className="text-slate-600 mb-4">You may not use the Service:</p>
                  <ul className="list-disc list-inside space-y-2 text-slate-600">
                    <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
                    <li>To violate any international, federal, provincial, or state regulations or laws</li>
                    <li>To transmit, or procure the sending of, any advertising or promotional material</li>
                    <li>To impersonate or attempt to impersonate the company, employees, or other users</li>
                    <li>To upload or transmit viruses or any other type of malicious code</li>
                    <li>To interfere with or circumvent the security features of the Service</li>
                    <li>For money laundering, terrorist financing, or other illegal financial activities</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-orange-500" />
                    6. Intellectual Property Rights
                  </h2>
                  <p className="text-slate-600 mb-4">
                    The Service and its original content, features, and functionality are and will remain the 
                    exclusive property of PaidIn and its licensors. The Service is protected by copyright, 
                    trademark, and other laws.
                  </p>
                  <p className="text-slate-600">
                    You may not copy, modify, distribute, sell, or lease any part of our Services or included 
                    software, nor may you reverse engineer or attempt to extract the source code of that software.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-4">7. Privacy and Data Protection</h2>
                  <p className="text-slate-600 mb-4">
                    Your privacy is important to us. Please review our Privacy Policy, which also governs your 
                    use of the Service, to understand our practices.
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-slate-600">
                    <li>We collect and process personal data as described in our Privacy Policy</li>
                    <li>You consent to such processing and warrant that all data provided is accurate</li>
                    <li>We implement appropriate security measures to protect your information</li>
                    <li>You have rights regarding your personal data as outlined in our Privacy Policy</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    8. Disclaimers and Limitation of Liability
                  </h2>
                  <div className="space-y-4 text-slate-600">
                    <div>
                      <h3 className="font-medium text-slate-900 mb-2">Service Availability</h3>
                      <p>
                        The Service is provided "as is" and "as available" without warranties of any kind. 
                        We do not guarantee that the Service will be uninterrupted, secure, or error-free.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900 mb-2">Bitcoin Risks</h3>
                      <p>
                        Bitcoin transactions carry inherent risks including price volatility, network congestion, 
                        and regulatory changes. You acknowledge and accept these risks.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900 mb-2">Limitation of Liability</h3>
                      <p>
                        In no event shall PaidIn be liable for any indirect, incidental, special, consequential, 
                        or punitive damages arising from your use of the Service.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-4">9. Termination</h2>
                  <p className="text-slate-600 mb-4">
                    We may terminate or suspend your account and access to the Service immediately, without prior 
                    notice or liability, for any reason, including breach of these Terms.
                  </p>
                  <p className="text-slate-600">
                    Upon termination, your right to use the Service will cease immediately. If you wish to 
                    terminate your account, you may simply discontinue using the Service.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-4">10. Governing Law</h2>
                  <p className="text-slate-600">
                    These Terms shall be interpreted and governed by the laws of [Jurisdiction], without regard 
                    to its conflict of law provisions. Any disputes will be resolved in the courts of [Jurisdiction].
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-4">11. Changes to Terms</h2>
                  <p className="text-slate-600 mb-4">
                    We reserve the right to modify or replace these Terms at any time. If a revision is material, 
                    we will provide at least 30 days notice prior to any new terms taking effect.
                  </p>
                  <p className="text-slate-600">
                    What constitutes a material change will be determined at our sole discretion. By continuing 
                    to access or use our Service after revisions become effective, you agree to be bound by the revised terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-4">12. Contact Information</h2>
                  <p className="text-slate-600 mb-4">
                    If you have any questions about these Terms of Service, please contact us:
                  </p>
                  <div className="bg-slate-100 p-4 rounded-lg">
                    <p className="text-slate-900 font-medium">Legal Department</p>
                    <p className="text-slate-600">Email: legal@paidin.com</p>
                    <p className="text-slate-600">Address: [Company Address]</p>
                  </div>
                </section>
              </div>
            </CardContent>
          </Card>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}