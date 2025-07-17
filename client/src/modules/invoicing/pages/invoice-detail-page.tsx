import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Share, Edit, Loader2, AlertCircle, Copy, Check, RefreshCw } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { invoicingApi, type Invoice } from "@/lib/api/invoicing-api";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const statusColors = {
  paid: "bg-green-100 text-green-800",
  sent: "bg-blue-100 text-blue-800",
  pending: "bg-yellow-100 text-yellow-800",
  overdue: "bg-red-100 text-red-800",
  draft: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800"
};

interface PaymentStatus {
  status: 'pending' | 'paid' | 'expired';
  btcAmount?: number;
  paymentUrl?: string;
  qrCode?: string;
  expiresAt?: string;
  transactions?: Array<{
    id: string;
    amount: number;
    confirmations: number;
    txid: string;
    timestamp: string;
  }>;
}

export default function InvoiceDetailPage() {
  return <div>Invoice Detail Page (placeholder)</div>;
} 