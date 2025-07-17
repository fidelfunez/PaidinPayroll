// Move the existing profile-page.tsx content here
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { ProfileForm } from "@/components/profile/profile-form";

export default function ProfilePage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      
      <div className={`flex-1 transition-all duration-300 ${
        isCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        <Header 
          title="Profile Settings" 
          subtitle="Manage your personal information and preferences"
        />
        
        <main className="max-w-7xl mx-auto px-6 py-8">
          <ProfileForm title="Edit Profile" showCard={true} />
        </main>
        
        <Footer />
      </div>
    </div>
  );
} 