import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

// Mock task types
const taskTypes = [
  { value: "form", label: "Form Completion", description: "Employee fills out required forms" },
  { value: "document", label: "Document Upload", description: "Employee uploads required documents" },
  { value: "video", label: "Video Training", description: "Employee watches training videos" },
  { value: "quiz", label: "Quiz/Assessment", description: "Employee completes knowledge check" },
  { value: "meeting", label: "Meeting", description: "Schedule a meeting with HR or manager" },
  { value: "system", label: "System Access", description: "Set up system accounts and access" }
];

export default function CreateOnboardingPage() {
  return <div>Create Onboarding Page (placeholder)</div>;
} 