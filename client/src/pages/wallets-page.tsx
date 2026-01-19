import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Wallet, Plus, Archive, Key, Bitcoin, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryFn } from "@/lib/queryClient";

interface WalletData {
  id: number;
  name: string;
  walletType: string;
  walletData: string;
  network: string;
  createdAt: number;
}

export default function WalletsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [walletName, setWalletName] = useState("");
  const [walletInput, setWalletInput] = useState("");
  const [validationError, setValidationError] = useState("");
  const [archiveWalletId, setArchiveWalletId] = useState<number | null>(null);
  const [fetchingWalletId, setFetchingWalletId] = useState<number | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch wallets
  const { data: wallets, isLoading } = useQuery<WalletData[]>({
    queryKey: ["/api/accounting/wallets"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Add wallet mutation
  const addWalletMutation = useMutation({
    mutationFn: async (newWallet: { name: string; input: string }) => {
      const res = await apiRequest("POST", "/api/accounting/wallets", newWallet);
      const data = await res.json();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounting/wallets"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      setIsAddDialogOpen(false);
      setWalletName("");
      setWalletInput("");
      setValidationError("");
      toast({
        title: "Wallet connected",
        description: "Your Bitcoin wallet has been connected successfully.",
      });
    },
    onError: (error: any) => {
      setValidationError(error.message);
    },
  });

  // Archive wallet mutation (soft delete)
  const archiveWalletMutation = useMutation({
    mutationFn: async (walletId: number) => {
      const res = await apiRequest("PATCH", `/api/accounting/wallets/${walletId}/archive`);
      const data = await res.json();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounting/wallets"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      setArchiveWalletId(null);
      toast({
        title: "Wallet archived",
        description: "The wallet has been archived. All transactions are preserved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to archive wallet",
        variant: "destructive",
      });
    },
  });

  // Fetch transactions mutation
  // Note: This mutation will continue even if the component unmounts (React Query handles this)
  const fetchTransactionsMutation = useMutation({
    mutationFn: async (walletId: number) => {
      // Use fetch directly instead of apiRequest to ensure it doesn't get cancelled
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Use apiRequest helper to ensure consistent URL handling
      // But use fetch directly to avoid AbortController cancellation
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const fullUrl = `${backendUrl}/api/accounting/wallets/${walletId}/fetch-transactions`;
      
      console.log('🚀 Fetching transactions for wallet:', walletId);
      console.log('🚀 Backend URL:', backendUrl || '(using relative path)');
      console.log('🚀 Full URL:', fullUrl);
      
      const res = await fetch(fullUrl, {
        method: 'POST',
        headers,
        credentials: 'include',
        // Don't use AbortController - let the request complete even if component unmounts
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to fetch transactions' }));
        throw new Error(errorData.error || 'Failed to fetch transactions');
      }
      
      return await res.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch all transaction queries (different pages use different query keys)
      // Use predicate to match any query that starts with "transactions" or "/api/accounting/transactions"
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && (
            key[0] === "transactions" || 
            (typeof key[0] === "string" && key[0].includes("/api/accounting/transactions"))
          );
        }
      });
      // Force immediate refetch
      queryClient.refetchQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && (
            key[0] === "transactions" || 
            (typeof key[0] === "string" && key[0].includes("/api/accounting/transactions"))
          );
        }
      });
      setFetchingWalletId(null);
      
      const { stats } = data;
      toast({
        title: "Transactions fetched",
        description: `Added ${stats.added} new transaction(s). ${stats.skipped} duplicates skipped.`,
      });
    },
    onError: (error: any) => {
      setFetchingWalletId(null);
      toast({
        title: "Error fetching transactions",
        description: error.message || "Failed to fetch transactions",
        variant: "destructive",
      });
    },
  });

  const handleAddWallet = () => {
    setValidationError("");
    
    if (!walletName.trim() || !walletInput.trim()) {
      setValidationError("Please provide both wallet name and address/xpub");
      return;
    }

    addWalletMutation.mutate({
      name: walletName.trim(),
      input: walletInput.trim(),
    });
  };

  const handleFetchTransactions = (walletId: number) => {
    setFetchingWalletId(walletId);
    fetchTransactionsMutation.mutate(walletId);
  };

  const truncateAddress = (address: string, startChars = 12, endChars = 8) => {
    if (address.length <= startChars + endChars) return address;
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  };

  const getWalletIcon = (walletData: string) => {
    const xpubPrefixes = ['xpub', 'ypub', 'zpub', 'tpub', 'upub', 'vpub'];
    const isXpub = xpubPrefixes.some(prefix => walletData.startsWith(prefix));
    return isXpub ? Key : Bitcoin;
  };

  const getWalletType = (walletData: string) => {
    const xpubPrefixes = ['xpub', 'ypub', 'zpub', 'tpub', 'upub', 'vpub'];
    const isXpub = xpubPrefixes.some(prefix => walletData.startsWith(prefix));
    return isXpub ? 'Extended Public Key' : 'Address';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bitcoin Wallets</h1>
          <p className="text-gray-600">Connect and manage your Bitcoin wallets</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            setWalletName("");
            setWalletInput("");
            setValidationError("");
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Wallet
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Bitcoin Wallet</DialogTitle>
              <DialogDescription>
                Connect a Bitcoin wallet by entering an address or extended public key (xpub, ypub, zpub)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="walletName">Wallet Name</Label>
                <Input
                  id="walletName"
                  placeholder="e.g., Business Wallet"
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="walletInput">Bitcoin Address or xpub</Label>
                <Input
                  id="walletInput"
                  placeholder="bc1q... or xpub..."
                  value={walletInput}
                  onChange={(e) => setWalletInput(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Supports all address types (Legacy, P2SH, SegWit, Taproot) and extended public keys (xpub, ypub, zpub)
                </p>
              </div>
              {validationError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{validationError}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddWallet} 
                disabled={addWalletMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {addWalletMutation.isPending ? "Adding..." : "Add Wallet"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Wallets List */}
      {isLoading ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Loading wallets...</p>
          </CardContent>
        </Card>
      ) : wallets && wallets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {wallets.map((wallet) => {
            const WalletIcon = getWalletIcon(wallet.walletData);
            return (
              <Card key={wallet.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <WalletIcon className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <CardTitle>{wallet.name}</CardTitle>
                        <CardDescription>
                          {getWalletType(wallet.walletData)}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setArchiveWalletId(wallet.id)}
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      title="Archive wallet"
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Address/xpub</p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded block break-all">
                      {truncateAddress(wallet.walletData)}
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Network</p>
                      <Badge 
                        variant={wallet.network === 'mainnet' ? 'default' : 'secondary'}
                        className="mt-1"
                      >
                        {wallet.network}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Added</p>
                      <p className="text-sm font-medium mt-1">
                        {new Date(wallet.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="pt-3 border-t space-y-2">
                    <Button
                      onClick={() => handleFetchTransactions(wallet.id)}
                      disabled={fetchingWalletId === wallet.id}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                      size="sm"
                    >
                      {fetchingWalletId === wallet.id ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          {getWalletType(wallet.walletData) === 'Address' 
                            ? 'Fetching Transactions...' 
                            : 'Scanning Addresses...'}
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Fetch Transactions
                        </>
                      )}
                    </Button>
                    {fetchingWalletId === wallet.id && (
                      <div className="space-y-1.5">
                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full bg-orange-600 rounded-full animate-pulse" style={{
                            width: '60%',
                            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                          }}></div>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          {getWalletType(wallet.walletData) === 'Address' 
                            ? 'Retrieving transaction history from blockchain...'
                            : 'Scanning external and internal address chains. This may take 30-60 seconds...'}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No wallets connected</h3>
            <p className="text-muted-foreground mb-4">
              Connect your first Bitcoin wallet to start tracking transactions
            </p>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Wallet
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={archiveWalletId !== null} onOpenChange={(open) => !open && setArchiveWalletId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Wallet?</AlertDialogTitle>
            <AlertDialogDescription>
              This will hide the wallet from your list. All transactions will be preserved for historical records. You can restore it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => archiveWalletId && archiveWalletMutation.mutate(archiveWalletId)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {archiveWalletMutation.isPending ? "Archiving..." : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
