import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, HelpCircle, Book, MessageSquare, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";

export default function HelpCenterPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();

  const helpCategories = [
    {
      title: "Getting Started",
      icon: Book,
      articles: [
        "How to set up your Bitcoin wallet",
        "Understanding Bitcoin payroll",
        "First-time login guide",
        "Account verification process"
      ]
    },
    {
      title: "Payroll & Payments",
      icon: HelpCircle,
      articles: [
        "How Bitcoin payroll works",
        "Payment schedules and timing",
        "Tax implications of Bitcoin payments",
        "Transaction fees explained"
      ]
    },
    {
      title: "Security",
      icon: Shield,
      articles: [
        "Keeping your wallet secure",
        "Two-factor authentication setup",
        "Recognizing phishing attempts",
        "Best practices for Bitcoin storage"
      ]
    },
    {
      title: "Support",
      icon: MessageSquare,
      articles: [
        "Contact support team",
        "Report a technical issue",
        "Request account changes",
        "Billing and subscription help"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-background to-gray-50 flex">
      <Sidebar />
      <div className={`flex-1 flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16 lg:ml-16' : 'ml-16 lg:ml-64'}`}>
        <Header 
          title="Help Center" 
          subtitle="Find answers to your questions about Bitcoin payroll"
        />
        
        <main className="p-4 lg:p-6 space-y-6">
          {/* Search Section */}
          <Card>
            <CardContent className="p-6">
              <div className="max-w-2xl mx-auto text-center space-y-4">
                <h2 className="text-2xl font-bold text-slate-900">How can we help you?</h2>
                <p className="text-slate-600">Search our knowledge base for quick answers</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input 
                    placeholder="Search for help articles..."
                    className="pl-10 py-3 text-lg"
                  />
                </div>
                <Button className="w-full sm:w-auto">Search Help Articles</Button>
              </div>
            </CardContent>
          </Card>

          {/* Help Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {helpCategories.map((category, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <category.icon className="w-6 h-6 text-orange-500" />
                    {category.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {category.articles.map((article, articleIndex) => (
                      <li key={articleIndex}>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start text-left h-auto p-2 text-slate-600 hover:text-slate-900"
                        >
                          {article}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Contact Support */}
          <Card>
            <CardHeader>
              <CardTitle>Still need help?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
                  <MessageSquare className="w-6 h-6 text-orange-500" />
                  <span className="font-medium">Live Chat</span>
                  <span className="text-sm text-slate-600">Chat with our support team</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
                  <HelpCircle className="w-6 h-6 text-orange-500" />
                  <span className="font-medium">Submit Ticket</span>
                  <span className="text-sm text-slate-600">Get help via email</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
                  <Book className="w-6 h-6 text-orange-500" />
                  <span className="font-medium">Documentation</span>
                  <span className="text-sm text-slate-600">Technical guides and API docs</span>
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