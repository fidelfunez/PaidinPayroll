import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Wallet, Bitcoin, CreditCard, Building2, AlertCircle, CheckCircle, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { useBtcRate } from "@/hooks/use-btc-rate-context";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

export default function WithdrawalMethodPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { rate: btcRate } = useBtcRate();
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<"bitcoin" | "bank_transfer" | "not_set">(user?.withdrawalMethod || "not_set");
  const [bitcoinAddress, setBitcoinAddress] = useState(user?.btcAddress || "");
  const [addressType, setAddressType] = useState("lightning");

  // Load user's current withdrawal method
  useEffect(() => {
    if (user) {
      setSelectedMethod(user.withdrawalMethod || "not_set");
      setBitcoinAddress(user.btcAddress || "");
    }
  }, [user]);

  // Mutation to update withdrawal method
  const updateWithdrawalMethodMutation = useMutation({
    mutationFn: async (data: { withdrawalMethod: string; btcAddress?: string }) => {
      return await apiRequest('PATCH', `/api/user/profile`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Withdrawal method updated",
        description: "Your withdrawal method has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update withdrawal method. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (selectedMethod === 'bitcoin' && !bitcoinAddress.trim()) {
      toast({
        title: "Bitcoin address required",
        description: "Please enter a valid Bitcoin or Lightning address.",
        variant: "destructive",
      });
      return;
    }

    updateWithdrawalMethodMutation.mutate({
      withdrawalMethod: selectedMethod,
      btcAddress: selectedMethod === 'bitcoin' ? bitcoinAddress.trim() : undefined
    });
  };

  const withdrawalMethods = [
    {
      id: "bitcoin",
      name: "Bitcoin Wallet",
      icon: Bitcoin,
      status: "active",
      description: "Direct Bitcoin payments to your wallet",
      fees: "Network fees only",
      processingTime: "10-60 minutes"
    },
    {
      id: "lightning",
      name: "Lightning Network",
      icon: Wallet,
      status: "coming-soon",
      description: "Instant Bitcoin payments via Lightning",
      fees: "Minimal routing fees",
      processingTime: "Instant"
    },
    {
      id: "bank",
      name: "Bank Transfer",
      icon: Building2,
      status: "available",
      description: "Convert to USD and transfer to bank",
      fees: "2.5% conversion fee",
      processingTime: "1-3 business days"
    },
    {
      id: "card",
      name: "Debit Card",
      icon: CreditCard,
      status: "available", 
      description: "Convert to USD on debit card",
      fees: "3% conversion fee",
      processingTime: "Instant"
    }
  ];

  const currentMethod = withdrawalMethods.find(m => m.id === selectedMethod);

  const validateBitcoinAddress = (address: string) => {
    if (!address) return false;
    // Basic Bitcoin address validation (simplified)
    const segwitRegex = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,87}$/;
    return segwitRegex.test(address);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Header 
          title="Withdrawal Method" 
          subtitle="Configure how you receive your Bitcoin payments"
          btcRate={btcRate}
        />
        
        <main className="p-4 lg:p-6 space-y-6">
          {/* Current Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Settings className="w-6 h-6 text-orange-500" />
                Current Withdrawal Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-lg">
                <Bitcoin className="w-8 h-8 text-orange-500" />
                <div className="flex-1">
                  <h3 className="font-medium">Bitcoin Wallet</h3>
                  <p className="text-sm text-slate-600">bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</p>
                </div>
                <Badge>Active</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Method Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Choose Withdrawal Method</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedMethod} onValueChange={(value) => setSelectedMethod(value as "bitcoin" | "bank_transfer" | "not_set")} className="space-y-4">
                {withdrawalMethods.map((method) => (
                  <div key={method.id} className="flex items-start space-x-3">
                    <RadioGroupItem 
                      value={method.id} 
                      id={method.id}
                      disabled={method.status === 'coming-soon'}
                      className="mt-1"
                    />
                    <div className="flex-1 border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <method.icon className="w-5 h-5 text-orange-500" />
                          <h3 className="font-medium">{method.name}</h3>
                        </div>
                        <Badge variant={
                          method.status === 'active' ? 'default' : 
                          method.status === 'coming-soon' ? 'secondary' : 'outline'
                        }>
                          {method.status === 'coming-soon' ? 'Coming Soon' : method.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{method.description}</p>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="font-medium">Fees: </span>
                          <span className="text-slate-600">{method.fees}</span>
                        </div>
                        <div>
                          <span className="font-medium">Processing: </span>
                          <span className="text-slate-600">{method.processingTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Configuration */}
          {selectedMethod === 'bitcoin' && (
            <Card>
              <CardHeader>
                <CardTitle>Bitcoin Wallet Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address-type">Address Type</Label>
                  <Select value={addressType} onValueChange={setAddressType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select address type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="segwit">SegWit (Recommended)</SelectItem>
                      <SelectItem value="legacy">Legacy</SelectItem>
                      <SelectItem value="taproot">Taproot</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-600 mt-1">
                    SegWit addresses offer lower transaction fees and faster processing
                  </p>
                </div>

                <div>
                  <Label htmlFor="bitcoin-address">Bitcoin Address</Label>
                  <Input
                    id="bitcoin-address"
                    placeholder="Enter your Bitcoin address"
                    value={bitcoinAddress}
                    onChange={(e) => setBitcoinAddress(e.target.value)}
                    className={validateBitcoinAddress(bitcoinAddress) ? "border-green-500" : ""}
                  />
                  {bitcoinAddress && (
                    <div className="flex items-center gap-2 mt-2">
                      {validateBitcoinAddress(bitcoinAddress) ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-600">Valid Bitcoin address</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-red-600">Invalid Bitcoin address format</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 mb-1">Security Notice</p>
                      <p className="text-blue-700">
                        Double-check your Bitcoin address before saving. Incorrect addresses 
                        may result in permanent loss of funds. Consider using a hardware wallet 
                        for maximum security.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedMethod === 'bank_transfer' && (
            <Card>
              <CardHeader>
                <CardTitle>Bank Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bank-name">Bank Name</Label>
                    <Input id="bank-name" placeholder="Enter bank name" />
                  </div>
                  <div>
                    <Label htmlFor="account-type">Account Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checking">Checking</SelectItem>
                        <SelectItem value="savings">Savings</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="routing-number">Routing Number</Label>
                    <Input id="routing-number" placeholder="9-digit routing number" />
                  </div>
                  <div>
                    <Label htmlFor="account-number">Account Number</Label>
                    <Input id="account-number" placeholder="Account number" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Save Configuration */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Ready to save changes?</h3>
                  <p className="text-sm text-slate-600">
                    Your new withdrawal method will be active for future payments
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline">Cancel</Button>
                  <Button 
                    onClick={handleSave}
                    disabled={updateWithdrawalMethodMutation.isPending}
                  >
                    {updateWithdrawalMethodMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}