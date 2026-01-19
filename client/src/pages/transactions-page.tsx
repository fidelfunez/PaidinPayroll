import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowDownRight, ArrowUpRight, Search, ExternalLink, ArrowRightLeft, ChevronLeft, ChevronRight, Wallet, ArrowUpDown } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { getQueryFn } from "@/lib/queryClient";

const TRANSACTIONS_PER_PAGE = 50;
const SHOW_ALL_LIMIT = 9999;

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterWallet, setFilterWallet] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterWalletStatus, setFilterWalletStatus] = useState(() => {
    // Load preference from localStorage
    const saved = localStorage.getItem('transactionsWalletStatus');
    return saved || "all";
  });
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(() => {
    // Load preference from localStorage
    const saved = localStorage.getItem('transactionsShowAll');
    return saved === 'true';
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Save showAll preference to localStorage
  useEffect(() => {
    localStorage.setItem('transactionsShowAll', showAll.toString());
    // Reset to page 1 when toggling showAll
    setPage(1);
  }, [showAll]);

  // Save wallet status preference to localStorage
  useEffect(() => {
    localStorage.setItem('transactionsWalletStatus', filterWalletStatus);
  }, [filterWalletStatus]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterType, filterWallet, filterCategory, filterWalletStatus]);

  // Check if any filters are active (needed to determine fetch strategy)
  const hasActiveFilters = searchTerm.trim() !== "" || 
                          filterType !== "all" || 
                          filterWallet !== "all" || 
                          filterCategory !== "all" ||
                          filterWalletStatus !== "all";

  // Fetch transactions with pagination
  // When filters are active, fetch ALL transactions so filtering works correctly
  // Include 'page' in queryKey when using server-side pagination so pagination triggers refetch
  const { data: transactionsResponse, isLoading: transactionsLoading } = useQuery({
    queryKey: hasActiveFilters || showAll 
      ? ["transactions", showAll, hasActiveFilters]
      : ["transactions", showAll, hasActiveFilters, page],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // If filters are active or showAll, fetch all transactions
      // Otherwise use server-side pagination
      const limit = (showAll || hasActiveFilters) ? SHOW_ALL_LIMIT : TRANSACTIONS_PER_PAGE;
      const fetchPage = (showAll || hasActiveFilters) ? 1 : page;
      
      const res = await fetch(`/api/accounting/transactions?page=${fetchPage}&limit=${limit}`, {
        headers,
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
  });

  const allTransactions = transactionsResponse?.data || [];
  const serverPagination = transactionsResponse?.pagination || { total: 0, totalPages: 0, page: 1, limit: 50 };

  // Fetch wallets for filter (including archived wallets for display purposes)
  const { data: wallets } = useQuery({
    queryKey: ["/api/accounting/wallets?includeArchived=true"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch("/api/accounting/categories", {
        headers,
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  // Get wallet by ID
  const getWallet = (walletId: number) => {
    return wallets?.find((w: any) => w.id === walletId);
  };

  // Check if wallet is archived
  const isWalletArchived = (walletId: number) => {
    const wallet = getWallet(walletId);
    return wallet ? !wallet.isActive : false;
  };

  // Filter transactions (client-side filtering)
  const filteredTransactions = allTransactions.filter((tx: any) => {
    const matchesSearch = tx.txId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tx.memo?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || tx.txType === filterType;
    const matchesWallet = filterWallet === "all" || tx.walletId.toString() === filterWallet;
    const matchesCategory = filterCategory === "all" || 
                           (filterCategory === "uncategorized" && !tx.categoryId) ||
                           (filterCategory !== "uncategorized" && tx.categoryId?.toString() === filterCategory);
    
    // Wallet status filter
    let matchesWalletStatus = true;
    if (filterWalletStatus === "active") {
      matchesWalletStatus = !isWalletArchived(tx.walletId);
    } else if (filterWalletStatus === "archived") {
      matchesWalletStatus = isWalletArchived(tx.walletId);
    }
    // "all" means no filter (matchesWalletStatus stays true)
    
    return matchesSearch && matchesType && matchesWallet && matchesCategory && matchesWalletStatus;
  });

  // Paginate filtered results client-side when filters are active
  const totalFiltered = filteredTransactions.length;
  const clientTotalPages = Math.ceil(totalFiltered / TRANSACTIONS_PER_PAGE);
  
  // If filters are active, paginate client-side. Otherwise, use server pagination results
  const displayTransactions = (hasActiveFilters && !showAll) 
    ? filteredTransactions.slice((page - 1) * TRANSACTIONS_PER_PAGE, page * TRANSACTIONS_PER_PAGE)
    : filteredTransactions;
  
  // Pagination metadata
  const pagination = hasActiveFilters ? {
    total: totalFiltered,
    totalPages: clientTotalPages,
    page: page,
    limit: TRANSACTIONS_PER_PAGE,
    hasNextPage: page < clientTotalPages,
    hasPrevPage: page > 1,
  } : {
    ...serverPagination,
    page: page,
    hasNextPage: page < serverPagination.totalPages,
    hasPrevPage: page > 1,
  };

  const getTransactionIcon = (txType: string) => {
    if (txType === 'received') return ArrowDownRight;
    if (txType === 'sent') return ArrowUpRight;
    return ArrowRightLeft; // For 'self' transactions
  };

  const getTransactionColor = (txType: string) => {
    if (txType === 'received') return 'text-green-600';
    if (txType === 'sent') return 'text-red-600';
    return 'text-blue-600';
  };

  const truncateTxHash = (hash: string) => {
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  const getMempoolLink = (txId: string, network: string) => {
    const baseUrl = network === 'testnet' 
      ? 'https://mempool.space/testnet/tx' 
      : 'https://mempool.space/tx';
    return `${baseUrl}/${txId}`;
  };

  // Get wallet name by ID
  const getWalletName = (walletId: number) => {
    const wallet = getWallet(walletId);
    return wallet?.name || 'Unknown Wallet';
  };

  // Get wallet network by ID
  const getWalletNetwork = (walletId: number) => {
    const wallet = getWallet(walletId);
    return wallet?.network || 'mainnet';
  };

  // Get category name by ID
  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId || !categories) return null;
    const category = categories.find((c: any) => c.id === categoryId);
    return category?.name || null;
  };

  // Mutation to update transaction category
  const updateTransactionCategory = useMutation({
    mutationFn: async ({ transactionId, categoryId }: { transactionId: number; categoryId: number | null }) => {
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch(`/api/accounting/transactions/${transactionId}`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify({ categoryId }),
      });
      if (!res.ok) throw new Error("Failed to update transaction category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast({
        title: "Category updated",
        description: "Transaction category has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update transaction category.",
        variant: "destructive",
      });
    },
  });

  // Pagination helpers
  const startIndex = showAll ? 1 : (page - 1) * TRANSACTIONS_PER_PAGE + 1;
  const endIndex = showAll ? totalFiltered : Math.min(page * TRANSACTIONS_PER_PAGE, totalFiltered);

  // Generate page numbers to display (show 5 pages at a time)
  const getPageNumbers = () => {
    const total = pagination.totalPages;
    const current = pagination.page;
    const pages: (number | string)[] = [];
    
    if (total <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);
      
      if (current > 3) {
        pages.push('...');
      }
      
      // Show pages around current
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (current < total - 2) {
        pages.push('...');
      }
      
      // Show last page
      pages.push(total);
    }
    
    return pages;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transactions</h1>
        <p className="text-gray-600">View and categorize your Bitcoin transactions</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Search Transactions</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by transaction ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Transaction Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Transaction type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="self">Self</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Wallet Status</label>
              <Select value={filterWalletStatus} onValueChange={setFilterWalletStatus}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Wallet status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Wallets</SelectItem>
                  <SelectItem value="active">Active Wallets Only</SelectItem>
                  <SelectItem value="archived">Archived Wallets Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Wallet</label>
              <Select value={filterWallet} onValueChange={setFilterWallet}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All wallets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Wallets</SelectItem>
                  {wallets?.filter((w: any) => w.isActive).map((wallet: any) => (
                    <SelectItem key={wallet.id} value={wallet.id.toString()}>
                      {wallet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="uncategorized">Uncategorized</SelectItem>
                  {categories?.map((category: any) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showAll"
                  checked={showAll}
                  onCheckedChange={(checked) => setShowAll(checked === true)}
                />
                <label
                  htmlFor="showAll"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  View All on One Page
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            {showAll 
              ? `${totalFiltered} transaction(s) found` 
              : `Showing ${startIndex}-${endIndex} of ${hasActiveFilters ? totalFiltered : pagination.total} transaction(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading transactions...</p>
          ) : displayTransactions.length > 0 ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Wallet</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">BTC Amount</TableHead>
                      <TableHead className="text-right">USD Value</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayTransactions.map((tx: any) => {
                      const TxIcon = getTransactionIcon(tx.txType);
                      const txColor = getTransactionColor(tx.txType);
                      const network = getWalletNetwork(tx.walletId);
                      const isArchived = isWalletArchived(tx.walletId);
                      
                      return (
                        <TableRow 
                          key={tx.id}
                          className={isArchived ? "bg-gray-50/50 hover:bg-gray-50" : ""}
                        >
                          <TableCell className="font-medium">
                            {new Date(tx.timestamp).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{getWalletName(tx.walletId)}</span>
                              {isArchived && (
                                <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-600">
                                  Archived
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <TxIcon className={`h-4 w-4 ${txColor}`} />
                              <span className="capitalize">{tx.txType}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={tx.categoryId?.toString() || "none"}
                              onValueChange={(value) => {
                                updateTransactionCategory.mutate({
                                  transactionId: tx.id,
                                  categoryId: value === "none" ? null : parseInt(value),
                                });
                              }}
                            >
                              <SelectTrigger className="w-[150px] h-8">
                                <SelectValue>
                                  {tx.categoryId ? getCategoryName(tx.categoryId) : "Uncategorized"}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Uncategorized</SelectItem>
                                {categories?.map((category: any) => (
                                  <SelectItem key={category.id} value={category.id.toString()}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="font-mono text-right">
                            {parseFloat(tx.amountBtc).toFixed(8)} BTC
                          </TableCell>
                          <TableCell className="font-medium text-right">
                            ${parseFloat(tx.usdValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            <a
                              href={getMempoolLink(tx.txId, network)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-mono text-xs"
                            >
                              {truncateTxHash(tx.txId)}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </TableCell>
                          <TableCell>
                            <Badge variant={tx.status === "confirmed" ? "default" : "secondary"}>
                              {tx.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {!showAll && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex}-{endIndex} of {hasActiveFilters ? totalFiltered : pagination.total} transactions
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={!pagination.hasPrevPage}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((pageNum, index) => {
                        if (pageNum === '...') {
                          return (
                            <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                              ...
                            </span>
                          );
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === pagination.page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNum as number)}
                            className="min-w-[40px]"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={!pagination.hasNextPage}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <ArrowUpDown className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900">No transactions found</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                {allTransactions?.length === 0 
                  ? "Connect a wallet and fetch transactions to get started with Bitcoin accounting"
                  : "Try adjusting your filters to see more results"}
              </p>
              {allTransactions?.length === 0 && (
                <Button asChild className="bg-orange-600 hover:bg-orange-700 text-white">
                  <Link href="/accounting/wallets">
                    <Wallet className="h-4 w-4 mr-2" />
                    Connect a Wallet
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
