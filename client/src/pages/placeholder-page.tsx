import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Construction } from "lucide-react";
import { useSidebar } from "@/hooks/use-sidebar";

interface PlaceholderPageProps {
  title: string;
  subtitle: string;
  description?: string;
}

export default function PlaceholderPage({ title, subtitle, description }: PlaceholderPageProps) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className={`transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Header title={title} subtitle={subtitle} />
        
        <main className="p-6">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <Construction className="mx-auto h-16 w-16 text-orange-500 mb-4" />
                <CardTitle className="text-2xl">{title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-lg text-muted-foreground">{subtitle}</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {description || "This feature is currently under development. Check back soon for updates."}
                </p>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}