import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";

export default function TermsOfServicePage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
              <p className="text-gray-600">Last updated: January 2024</p>
            </div>

            <Card>
              <CardContent className="p-6 space-y-6">
                <section>
                  <h2 className="text-xl font-semibold mb-3">Acceptance of Terms</h2>
                  <p className="text-gray-600">
                    By accessing and using PaidIn, you accept and agree to be bound by the terms 
                    and provisi 