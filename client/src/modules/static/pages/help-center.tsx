import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function HelpCenterPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Help Center</h1>
              <p className="text-gray-600">Find answers to common questions about PaidIn</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Getting Started</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible>
                    <AccordionItem value="item-1">
                      <AccordionTrigger>How do I create my first invoice?</AccordionTrigger>
                      <AccordionContent>
                        Navigate to the Invoices section and click "Create Invoice". Fill in the client details, amount, and description. The system will automatically generate a Bitcoin payment address for your client.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger>How do I set up integrations?</AccordionTrigger>
                      <AccordionContent>
                        Go to the Integrations section and click "Add Integration". Choose from Slack, QuickBooks, Zapier, BTCPay, or LNbits. Follow the setup instructions for each integration type.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                      <AccordionTrigger>How do I create onboarding flows?</AccordionTrigger>
                      <AccordionContent>
                        Navigate to Onboarding and click "Create Flow". Define the flow name, department, and add tasks that new employees need to complete. You can then assign this flow to new hires.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bitcoin Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible>
                    <AccordionItem value="item-4">
                      <AccordionTrigger>How do Bitcoin payments work?</AccordionTrigger>
                      <AccordionContent>
                        When you create an invoice, PaidIn generates a unique Bitcoin address for that invoice. Your client can pay using any Bitcoin wallet. The payment is automatically detected and the invoice status is updated.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-5">
                      <AccordionTrigger>What Bitcoin payment methods are supported?</AccordionTrigger>
                      <AccordionContent>
                        We support Lightning Network payments through LNbits integration and on-chain Bitcoin payments through BTCPay Server. You can configure these in the Integrations section.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-6">
                      <AccordionTrigger>How do I withdraw Bitcoin payments?</AccordionTrigger>
                      <AccordionContent>
                        Configure your withdrawal methods in the Settings section. You can set up automatic withdrawals to your Bitcoin wallet or manual withdrawals through the admin panel.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
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
```
