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
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const integrationTypes = [
  { value: "slack", label: "Slack", description: "Send notifications to Slack channels" },
  { value: "quickbooks", label: "QuickBooks", description: "Sync invoices and payments" },
  { value: "zapier", label: "Zapier", description: "Automate workflows with Zapier" },
  { value: "btcpay", label: "BTCPay Server", description: "Accept Bitcoin payments" },
  { value: "lnbits", label: "LNbits", description: "Lightning Network payments" }
];

export default function CreateIntegrationPage() {
  return <div>Create Integration Page (placeholder)</div>;
} 