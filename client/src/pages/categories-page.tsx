import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Tag, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CategoriesPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryType, setCategoryType] = useState<"income" | "expense" | "asset" | "liability">("expense");
  const [quickbooksAccount, setQuickbooksAccount] = useState("");
  
  // Edit state
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<"income" | "expense" | "asset" | "liability">("expense");
  const [editQuickbooksAccount, setEditQuickbooksAccount] = useState("");
  
  // Delete state
  const [deletingCategory, setDeletingCategory] = useState<any | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories, isLoading } = useQuery({
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

  // Add category mutation
  const addCategoryMutation = useMutation({
    mutationFn: async (newCategory: { name: string; categoryType: string; quickbooksAccount?: string }) => {
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch("/api/accounting/categories", {
        method: "POST",
        headers,
        credentials: 'include',
        body: JSON.stringify(newCategory),
      });
      if (!res.ok) throw new Error("Failed to add category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setIsAddDialogOpen(false);
      setCategoryName("");
      setQuickbooksAccount("");
      toast({
        title: "Category added",
        description: "New category has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add category",
        variant: "destructive",
      });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, name, categoryType, quickbooksAccount }: { id: number; name: string; categoryType: string; quickbooksAccount?: string }) => {
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch(`/api/accounting/categories/${id}`, {
        method: "PATCH",
        headers,
        credentials: 'include',
        body: JSON.stringify({ name, categoryType, quickbooksAccount }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update category");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setEditingCategory(null);
      setEditName("");
      setEditQuickbooksAccount("");
      toast({
        title: "Category updated",
        description: "Category has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update category",
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch(`/api/accounting/categories/${categoryId}`, {
        method: "DELETE",
        headers,
        credentials: 'include',
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete category");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setDeletingCategory(null);
      toast({
        title: "Category deleted",
        description: "Category has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Cannot delete category",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
    },
  });

  const handleAddCategory = () => {
    if (!categoryName) {
      toast({
        title: "Missing information",
        description: "Please provide a category name",
        variant: "destructive",
      });
      return;
    }

    addCategoryMutation.mutate({
      name: categoryName,
      categoryType,
      quickbooksAccount: quickbooksAccount || undefined,
    });
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setEditName(category.name);
    setEditType(category.categoryType);
    setEditQuickbooksAccount(category.quickbooksAccount || "");
  };

  const handleUpdateCategory = () => {
    if (!editName || !editingCategory) return;
    
    updateCategoryMutation.mutate({
      id: editingCategory.id,
      name: editName,
      categoryType: editType,
      quickbooksAccount: editQuickbooksAccount || undefined,
    });
  };

  const handleDeleteCategory = (category: any) => {
    setDeletingCategory(category);
  };

  const confirmDelete = () => {
    if (deletingCategory) {
      deleteCategoryMutation.mutate(deletingCategory.id);
    }
  };

  // Group categories by type
  const groupedCategories = categories?.reduce((acc: any, cat: any) => {
    if (!acc[cat.categoryType]) {
      acc[cat.categoryType] = [];
    }
    acc[cat.categoryType].push(cat);
    return acc;
  }, {});

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-gray-600">Manage transaction categories for QuickBooks</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Category</DialogTitle>
              <DialogDescription>
                Create a new category for organizing transactions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="categoryName">Category Name</Label>
                <Input
                  id="categoryName"
                  placeholder="e.g., Contractor Payments"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryType">Category Type</Label>
                <Select value={categoryType} onValueChange={(value: any) => setCategoryType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="asset">Asset</SelectItem>
                    <SelectItem value="liability">Liability</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quickbooksAccount">QuickBooks Account (Optional)</Label>
                <Input
                  id="quickbooksAccount"
                  placeholder="e.g., Operating Expenses"
                  value={quickbooksAccount}
                  onChange={(e) => setQuickbooksAccount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Map this category to a QuickBooks account for export
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddCategory} 
                disabled={addCategoryMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {addCategoryMutation.isPending ? "Adding..." : "Add Category"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories List */}
      {isLoading ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Loading categories...</p>
          </CardContent>
        </Card>
      ) : categories && categories.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedCategories || {}).map(([type, cats]: [string, any]) => (
            <Card key={type} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="capitalize">{type} Categories</CardTitle>
                <CardDescription>
                  {cats.length} {type} {cats.length === 1 ? 'category' : 'categories'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cats.map((category: any) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-orange-50 hover:border-orange-200 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <Tag className="h-5 w-5 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{category.name}</p>
                          {category.quickbooksAccount && (
                            <p className="text-sm text-muted-foreground">
                              QB: {category.quickbooksAccount}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {category.categoryType}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditCategory(category)}
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCategory(category)}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
            <p className="text-muted-foreground mb-4">
              Create categories to organize your Bitcoin transactions
            </p>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Category
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Category Dialog */}
      <Dialog open={editingCategory !== null} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editCategoryName">Category Name</Label>
              <Input
                id="editCategoryName"
                placeholder="e.g., Contractor Payments"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editCategoryType">Category Type</Label>
              <Select value={editType} onValueChange={(value: any) => setEditType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="asset">Asset</SelectItem>
                  <SelectItem value="liability">Liability</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editQuickbooksAccount">QuickBooks Account (Optional)</Label>
              <Input
                id="editQuickbooksAccount"
                placeholder="e.g., Operating Expenses"
                value={editQuickbooksAccount}
                onChange={(e) => setEditQuickbooksAccount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCategory(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateCategory} 
              disabled={updateCategoryMutation.isPending || !editName}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {updateCategoryMutation.isPending ? "Updating..." : "Update Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation */}
      <AlertDialog open={deletingCategory !== null} onOpenChange={(open) => !open && setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingCategory?.name}"? This action cannot be undone.
              {deletingCategory && (
                <span className="block mt-2 text-sm text-muted-foreground">
                  If this category is used by any transactions, deletion will be prevented.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
