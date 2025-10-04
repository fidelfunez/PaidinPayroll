import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { useBtcRate } from "@/hooks/use-btc-rate-context";
import {
  Search,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  MessageCircle,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  X
} from "lucide-react";
import { useState } from "react";

export default function FAQPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { rate: btcRate } = useBtcRate();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<number[]>([]);

  const faqCategories = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: "🚀",
      questions: [
        {
          id: 1,
          question: "How do I set up my company on PaidIn?",
          answer: "Setting up your company is easy! Complete the onboarding process by providing your company details, creating an admin account, and selecting your preferred features. You can always modify these settings later from your dashboard."
        },
        {
          id: 2,
          question: "What information do I need to get started?",
          answer: "You'll need your company name, industry, team size, and basic contact information. We also recommend having your company logo ready for branding purposes."
        },
        {
          id: 3,
          question: "Can I invite team members during setup?",
          answer: "Yes! During the onboarding process, you can invite up to 5 team members. You can invite more team members later from your dashboard."
        }
      ]
    },
    {
      id: "bitcoin",
      title: "Bitcoin & Payments",
      icon: "₿",
      questions: [
        {
          id: 4,
          question: "How do Bitcoin payments work in PaidIn?",
          answer: "PaidIn uses Bitcoin as the native currency for all transactions. You can fund your company wallet with Bitcoin and pay employees, process reimbursements, and handle all financial operations using Bitcoin. We support both Lightning Network and on-chain transactions."
        },
        {
          id: 5,
          question: "What is Lightning Network and why should I use it?",
          answer: "Lightning Network is a second-layer solution for Bitcoin that enables instant, low-cost transactions. It's perfect for regular payroll payments and small transactions, while on-chain Bitcoin is better for larger amounts."
        },
        {
          id: 6,
          question: "How do I fund my company wallet?",
          answer: "You can fund your wallet by sending Bitcoin to your company's Bitcoin address. We'll provide you with a unique address for your company. You can also set up automatic funding from external wallets."
        },
        {
          id: 7,
          question: "Are Bitcoin payments secure?",
          answer: "Yes! Bitcoin payments are highly secure. We use industry-standard security practices, and Bitcoin's cryptographic nature makes transactions tamper-proof. We also provide audit logs for all transactions."
        }
      ]
    },
    {
      id: "payroll",
      title: "Payroll & Employees",
      icon: "👥",
      questions: [
        {
          id: 8,
          question: "How do I add new employees?",
          answer: "Go to the Employees section in your dashboard and click 'Add Employee'. You'll need their name, email, and role. They'll receive an invitation to join your company."
        },
        {
          id: 9,
          question: "Can employees choose their payment method?",
          answer: "Yes! Employees can choose to receive payments in Bitcoin or USD. They can also set up their preferred withdrawal methods, including Bitcoin wallets or bank transfers."
        },
        {
          id: 10,
          question: "How do I process payroll?",
          answer: "Navigate to the Payroll section, select the employees you want to pay, enter the amounts, and confirm the payment. The system will automatically handle the Bitcoin transactions."
        },
        {
          id: 11,
          question: "Can I process bulk payroll payments?",
          answer: "Absolutely! Our bulk payroll feature allows you to process payments for multiple employees at once, saving you time and transaction fees."
        }
      ]
    },
    {
      id: "security",
      title: "Security & Compliance",
      icon: "🔒",
      questions: [
        {
          id: 12,
          question: "How is my data protected?",
          answer: "We use enterprise-grade security measures including encryption, secure data storage, and regular security audits. Your Bitcoin is stored in secure, multi-signature wallets."
        },
        {
          id: 13,
          question: "Do you provide audit logs?",
          answer: "Yes! All transactions and activities are logged and can be accessed through the Audit Logs section. This helps with compliance and transparency."
        },
        {
          id: 14,
          question: "What compliance features do you offer?",
          answer: "We provide tax calculation, compliance reporting, and integration with accounting systems. Our platform helps you stay compliant with local regulations."
        }
      ]
    },
    {
      id: "billing",
      title: "Billing & Plans",
      icon: "💳",
      questions: [
        {
          id: 15,
          question: "What are your pricing plans?",
          answer: "We offer three plans: Starter (up to 10 employees), Growth (up to 50 employees), and Scale (unlimited employees). Each plan includes different features and support levels."
        },
        {
          id: 16,
          question: "How do you charge for transactions?",
          answer: "We charge a small percentage fee on Bitcoin transactions, which is typically lower than traditional payment processors. Lightning Network transactions have even lower fees."
        },
        {
          id: 17,
          question: "Can I change my plan later?",
          answer: "Yes! You can upgrade or downgrade your plan at any time from your settings. Changes take effect immediately, and we'll prorate any billing differences."
        }
      ]
    }
  ];

  const toggleExpanded = (id: number) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16 lg:ml-16' : 'ml-16 lg:ml-64'}`}>
        <Header
          title="Frequently Asked Questions"
          subtitle="Find answers to common questions about PaidIn"
        />

        <main className="p-4 lg:p-6 space-y-6">
          {/* Search */}
          <Card>
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search FAQ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* FAQ Categories */}
          <div className="space-y-6">
            {filteredCategories.map((category) => (
              <Card key={category.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{category.icon}</span>
                    {category.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {category.questions.map((item) => {
                      const isExpanded = expandedItems.includes(item.id);
                      return (
                        <div key={item.id} className="border rounded-lg">
                          <button
                            onClick={() => toggleExpanded(item.id)}
                            className="w-full p-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                          >
                            <span className="font-medium">{item.question}</span>
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                          {isExpanded && (
                            <div className="px-4 pb-4">
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {item.answer}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Contact Support */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Still Need Help?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Live Chat</h4>
                    <p className="text-sm text-muted-foreground">Get instant help</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Mail className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Email Support</h4>
                    <p className="text-sm text-muted-foreground">support@paidin.io</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Phone className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Phone Support</h4>
                    <p className="text-sm text-muted-foreground">Mon-Fri 9AM-6PM EST</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="font-medium text-orange-800">Response Times</span>
                </div>
                <div className="text-sm text-orange-700">
                  <p>• Live Chat: Instant response</p>
                  <p>• Email: Within 2 hours during business hours</p>
                  <p>• Phone: Immediate during business hours</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
