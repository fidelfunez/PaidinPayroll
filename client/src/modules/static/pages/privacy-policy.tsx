import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
              <p className="text-gray-600">Last updated: January 2024</p>
            </div>

            <Card>
              <CardContent className="p-6 space-y-6">
                <section>
                  <h2 className="text-xl font-semibold mb-3">Information We Collect</h2>
                  <p className="text-gray-600 mb-4">
                    We collect information you provide directly to us, such as when you create an account, 
                    make a payment, or contact us for support.
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Account information (name, email, company details)</li>
                    <li>Payment and transaction information</li>
                    <li>Usage data and analytics</li>
                    <li>Communication records</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">How We Use Your Information</h2>
                  <p className="text-gray-600 mb-4">
                    We use the information we collect to provide, maintain, and improve our services.
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Process payments and transactions</li>
                    <li>Provide customer support</li>
                    <li>Send important updates and notifications</li>
                    <li>Improve our services and user experience</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">Data Security</h2>
                  <p className="text-gray-600">
                    We implement appropriate security measures to protect your personal information 
                    against unauthorized access, alteration, disclosure, or destruction.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
                  <p className="text-gray-600">
                    If you have any questions about this Privacy Policy, please contact us at 
                    privacy@paidin.com
                  </p>
                </section>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
} 