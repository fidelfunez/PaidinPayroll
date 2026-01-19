import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Coins, TrendingUp, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PurchasesPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [amountBtc, setAmountBtc] = useState("");
  const [costBasisUsd, setCostBasisUsd] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [source, setSource] = useState("");
  
  // Edit state
  const [editingPurchase, setEditingPurchase] = useState<any | null>(null);
  const [editAmountBtc, setEditAmountBtc] = useState("");
  const [editCostBasisUsd, setEditCostBasisUsd] = useState("");
  const [editPurchaseDate, setEditPurchaseDate] = useState("");
  const [editSource, setEditSource] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch purchases
  const { data: purchases, isLoading } = useQuery({
    queryKey: ["purchases"],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch("/api/accounting/purchases", {
        headers,
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to fetch purchases");
      return res.json();
    },
  });

  // Add purchase mutation
  const addPurchaseMutation = useMutation({
    mutationFn: async (newPurchase: { amountBtc: number; costBasisUsd: number; purchaseDate: string; source?: string }) => {
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch("/api/accounting/purchases", {
        method: "POST",
        headers,
        credentials: 'include',
        body: JSON.stringify(newPurchase),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to add purchase");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      setIsAddDialogOpen(false);
      setAmountBtc("");
      setCostBasisUsd("");
      setPurchaseDate("");
      setSource("");
      toast({
        title: "Purchase added",
        description: "New purchase has been recorded successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add purchase",
        variant: "destructive",
      });
    },
  });

  // Update purchase mutation
  const updatePurchaseMutation = useMutation({
    mutationFn: async ({ id, amountBtc, costBasisUsd, purchaseDate, source }: { id: number; amountBtc: number; costBasisUsd: number; purchaseDate: string; source?: string }) => {
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch(`/api/accounting/purchases/${id}`, {
        method: "PATCH",
        headers,
        credentials: 'include',
        body: JSON.stringify({ amountBtc, costBasisUsd, purchaseDate, source }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update purchase");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      setEditingPurchase(null);
      setEditAmountBtc("");
      setEditCostBasisUsd("");
      setEditPurchaseDate("");
      setEditSource("");
      toast({
        title: "Purchase updated",
        description: "Purchase has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update purchase",
        variant: "destructive",
      });
    },
  });

  const handleAddPurchase = () => {
    if (!amountBtc || !costBasisUsd || !purchaseDate) {
      toast({
        title: "Missing information",
        description: "Please provide BTC amount, cost basis USD, and purchase date",
        variant: "destructive",
      });
      return;
    }

    addPurchaseMutation.mutate({
      amountBtc: parseFloat(amountBtc),
      costBasisUsd: parseFloat(costBasisUsd),
      purchaseDate,
      source: source || undefined,
    });
  };

  const handleEditPurchase = (purchase: any) => {
    setEditingPurchase(purchase);
    setEditAmountBtc(purchase.amountBtc.toString());
    setEditCostBasisUsd(purchase.costBasisUsd.toString());
    const date = new Date(purchase.purchaseDate);
    setEditPurchaseDate(date.toISOString().split('T')[0]);
    setEditSource(purchase.source || "");
  };

  const handleUpdatePurchase = () => {
    if (!editAmountBtc || !editCostBasisUsd || !editPurchaseDate || !editingPurchase) return;
    
    updatePurchaseMutation.mutate({
      id: editingPurchase.id,
      amountBtc: parseFloat(editAmountBtc),
      costBasisUsd: parseFloat(editCostBasisUsd),
      purchaseDate: editPurchaseDate,
      source: editSource || undefined,
    });
  };

  // Calculate stats
  const totalBtcPurchased = purchases?.reduce((sum: number, p: any) => sum + parseFloat(p.amountBtc.toString()), 0) || 0;
  const totalCostBasis = purchases?.reduce((sum: number, p: any) => sum + parseFloat(p.costBasisUsd.toString()), 0) || 0;
  const totalRemainingBtc = purchases?.reduce((sum: number, p: any) => sum + parseFloat(p.remainingBtc.toString()), 0) || 0;
  const averagePricePerBtc = totalBtcPurchased > 0 ? totalCostBasis / totalBtcPurchased : 0;
  const btcConsumed = totalBtcPurchased - totalRemainingBtc;
  const consumptionPercentage = totalBtcPurchased > 0 ? (btcConsumed / totalBtcPurchased) * 100 : 0;

  // Helper to calculate price per BTC
  const getPricePerBtc = (purchase: any) => {
    const btc = parseFloat(purchase.amountBtc.toString());
    const usd = parseFloat(purchase.costBasisUsd.toString());
    return btc > 0 ? usd / btc : 0;
  };

  // Helper to check if purchase is partially consumed
  const isPartiallyConsumed = (purchase: any) => {
    const remaining = parseFloat(purchase.remainingBtc.toString());
    const original = parseFloat(purchase.amountBtc.toString());
    return remaining > 0 && remaining < original;
  };

  // Helper to check if purchase is fully consumed
  const isFullyConsumed = (purchase: any) => {
    const remaining = parseFloat(purchase.remainingBtc.toString());
    return remaining <= 0;
  };

  // Get consumption percentage for a purchase
  const getConsumptionPercentage = (purchase: any) => {
    const remaining = parseFloat(purchase.remainingBtc.toString());
    const original = parseFloat(purchase.amountBtc.toString());
    if (original === 0) return 0;
    return ((original - remaining) / original) * 100;
  };

  // Set today's date as default for purchase date
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Purchase Tracking</h1>
          <p className="text-gray-600">Track your Bitcoin purchases for FIFO cost basis calculation</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Purchase
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Purchase</DialogTitle>
              <DialogDescription>
                Record a Bitcoin purchase for cost basis tracking
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amountBtc">BTC Amount *</Label>
                <Input
                  id="amountBtc"
                  type="number"
                  step="0.00000001"
                  placeholder="0.00000000"
                  value={amountBtc}
                  onChange={(e) => setAmountBtc(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the amount of Bitcoin purchased (minimum 0.00000001 BTC)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="costBasisUsd">Cost Basis (USD) *</Label>
                <Input
                  id="costBasisUsd"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={costBasisUsd}
                  onChange={(e) => setCostBasisUsd(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the total USD amount paid for this Bitcoin purchase
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date *</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  max={today}
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Date when the Bitcoin was purchased (cannot be in the future)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Source (Optional)</Label>
                <Input
                  id="source"
                  placeholder="e.g., Coinbase, Strike, Manual Entry"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Where the Bitcoin was purchased or acquired
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddPurchase} 
                disabled={addPurchaseMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {addPurchaseMutation.isPending ? "Adding..." : "Add Purchase"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Total BTC Purchased</p>
            </div>
            <p className="text-2xl font-bold">{totalBtcPurchased.toFixed(8)} BTC</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <p className="text-sm font-medium">Total Cost Basis</p>
            </div>
            <p className="text-2xl font-bold text-green-600">
              ${totalCostBasis.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-medium">Remaining BTC</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">{totalRemainingBtc.toFixed(8)} BTC</p>
            <p className="text-xs text-muted-foreground mt-1">
              {consumptionPercentage.toFixed(1)}% used
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <p className="text-sm font-medium">Avg Price/BTC</p>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              ${averagePricePerBtc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Purchases Table */}
      {isLoading ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Loading purchases...</p>
          </CardContent>
        </Card>
      ) : purchases && purchases.length > 0 ? (
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>Purchase History</CardTitle>
            <CardDescription>
              Purchases sorted by date (oldest first) for FIFO cost basis calculation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">BTC Amount</TableHead>
                    <TableHead className="text-right">Cost Basis (USD)</TableHead>
                    <TableHead className="text-right">Price per BTC</TableHead>
                    <TableHead className="text-right">Remaining BTC</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase: any) => {
                    const pricePerBtc = getPricePerBtc(purchase);
                    const consumptionPct = getConsumptionPercentage(purchase);
                    const isPartiallyUsed = isPartiallyConsumed(purchase);
                    const isFullyUsed = isFullyConsumed(purchase);

                    return (
                      <TableRow 
                        key={purchase.id}
                        className={
                          isFullyUsed ? "bg-gray-50/50" : 
                          isPartiallyUsed ? "bg-blue-50/30" : ""
                        }
                      >
                        <TableCell className="font-medium">
                          {new Date(purchase.purchaseDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-mono text-right">
                          {parseFloat(purchase.amountBtc.toString()).toFixed(8)} BTC
                        </TableCell>
                        <TableCell className="text-right">
                          ${parseFloat(purchase.costBasisUsd.toString()).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="font-mono text-right">
                          ${pricePerBtc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="font-mono text-right">
                          {parseFloat(purchase.remainingBtc.toString()).toFixed(8)} BTC
                        </TableCell>
                        <TableCell>
                          {purchase.source || (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {isFullyUsed ? (
                              <Badge variant="secondary" className="bg-gray-200 text-gray-600">
                                Fully Used
                              </Badge>
                            ) : isPartiallyUsed ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                                {consumptionPct.toFixed(0)}% Used
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                Available
                              </Badge>
                            )}
                            {!isFullyUsed && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditPurchase(purchase)}
                                className="h-8 w-8"
                                title="Edit purchase"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No purchases yet</h3>
            <p className="text-muted-foreground mb-4">
              Record your Bitcoin purchases to enable FIFO cost basis calculation
            </p>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Purchase
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Purchase Dialog */}
      <Dialog open={editingPurchase !== null} onOpenChange={(open) => !open && setEditingPurchase(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Purchase</DialogTitle>
            <DialogDescription>
              Update purchase information. Note: Purchases used in cost basis calculations cannot be edited.
            </DialogDescription>
          </DialogHeader>
          {editingPurchase && isPartiallyConsumed(editingPurchase) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ This purchase is partially consumed. Editing may affect cost basis calculations.
              </p>
            </div>
          )}
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editAmountBtc">BTC Amount *</Label>
              <Input
                id="editAmountBtc"
                type="number"
                step="0.00000001"
                placeholder="0.00000000"
                value={editAmountBtc}
                onChange={(e) => setEditAmountBtc(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editCostBasisUsd">Cost Basis (USD) *</Label>
              <Input
                id="editCostBasisUsd"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={editCostBasisUsd}
                onChange={(e) => setEditCostBasisUsd(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPurchaseDate">Purchase Date *</Label>
              <Input
                id="editPurchaseDate"
                type="date"
                max={today}
                value={editPurchaseDate}
                onChange={(e) => setEditPurchaseDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editSource">Source (Optional)</Label>
              <Input
                id="editSource"
                placeholder="e.g., Coinbase, Strike"
                value={editSource}
                onChange={(e) => setEditSource(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPurchase(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdatePurchase} 
              disabled={updatePurchaseMutation.isPending || !editAmountBtc || !editCostBasisUsd || !editPurchaseDate}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {updatePurchaseMutation.isPending ? "Updating..." : "Update Purchase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
