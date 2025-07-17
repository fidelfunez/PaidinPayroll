import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle, FileText, Video, MessageSquare, Settings } from "lucide-react";
import { useState } from "react";

// Mock onboarding progress data
const mockOnboardingFlow = {
  id: "1",
  name: "Software Engineer Onboarding",
  employee: "John Doe",
  startDate: "2024-01-15",
  progress: 65,
  tasks: [
    {
      id: "1",
      title: "Complete I-9 Form",
      type: "form",
      status: "completed",
      completedAt: "2024-01-15T10:30:00Z",
      description: "Fill out the I-9 employment eligibility verification form"
    },
    {
      id: "2",
      title: "Upload ID Documents",
      type: "document",
      status: "completed",
      completedAt: "2024-01-15T11:15:00Z",
      description: "Upload a copy of your driver's license or passport"
    },
    {
      id: "3",
      title: "Watch Company Overview Video",
      type: "video",
      status: "in_progress",
      description: "Watch the 15-minute company overview and values video"
    },
    {
      id: "4",
      title: "Complete Security Training",
      type: "quiz",
      status: "pending",
      description: "Complete the mandatory security awareness training quiz"
    },
    {
      id: "5",
      title: "Meet with HR",
      type: "meeting",
      status: "pending",
      description: "Schedule and attend a 30-minute meeting with HR"
    },
    {
      id: "6",
      title: "Set up Development Environment",
      type: "system",
      status: "pending",
      description: "Get access to development tools and set up your workspace"
    }
  ]
};

const taskTypeIcons = {
  form: FileText,
  document: FileText,
  video: Video,
  quiz: AlertCircle,
  meeting: MessageSquare,
  system: Settings
};

const statusConfig = {
  completed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
  in_progress: { color: "bg-blue-100 text-blue-800", icon: Clock },
  pending: { color: "bg-gray-100 text-gray-800", icon: Clock }
};

export default function OnboardingProgressPage() {
  const { user } = useAuth();
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const [selec 