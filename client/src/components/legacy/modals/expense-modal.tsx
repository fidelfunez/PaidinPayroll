import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const expenseSchema = z.object({
  category: z.string().min(1, "Category is required"),
  amountUsd: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Amount must be a positive number"
  ),
  description: z.string().min(1, "Description is required").min(10, "Description must be at least 10 characters"),
});

interface ExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExpenseModal({ open, onOpenChange }: ExpenseModalProps) {
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const form = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: "",
      amountUsd: "",
      description: "",
    },
  });

  const submitExpenseMutation = useMutation({
    mutationFn: async (data: z.infer<typeof expenseSchema>) => {
      // For now, we'll submit without file upload since the backend doesn't handle files yet
      // In a real implementation, you'd upload the file to a storage service and get a URL
      const expenseData = {
        ...data,
        receiptUrl: uploadedFile ? `receipt_${Date.now()}_${uploadedFile.name}` : null,
      };

      await apiRequest('POST', '/api/expenses', expenseData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Expense submitted",
        description: "Your expense claim has been submitted for review.",
      });
      onOpenChange(false);
      form.reset();
      setUploadedFile(null);
    },
    onError: (error: any) => {
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit expense. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.includes('image') || file.type.includes('pdf')) {
        setUploadedFile(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload an image or PDF file.",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.includes('image') || file.type.includes('pdf')) {
        setUploadedFile(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload an image or PDF file.",
          variant: "destructive",
        });
      }
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
  };

  const onSubmit = (data: z.infer<typeof expenseSchema>) => {
    submitExpenseMutation.mutate(data);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Expense</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expense Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="travel">Travel</SelectItem>
                        <SelectItem value="office-supplies">Office Supplies</SelectItem>
                        <SelectItem value="software">Software/Tools</SelectItem>
                        <SelectItem value="meals">Meals & Entertainment</SelectItem>
                        <SelectItem value="training">Training & Education</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amountUsd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (USD)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      className="h-24 resize-none" 
                      placeholder="Provide details about your expense..."
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Label className="text-sm font-medium">Receipt (Optional)</Label>
              <div className="mt-2">
                {!uploadedFile ? (
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                      dragActive 
                        ? 'border-primary bg-primary/5' 
                        : 'border-slate-300 hover:border-primary/50'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600 mb-2">
                      Drag and drop receipt or{' '}
                      <span className="text-primary hover:text-primary/80 cursor-pointer font-medium">
                        click to browse
                      </span>
                    </p>
                    <p className="text-xs text-slate-500">PNG, JPG, PDF up to 10MB</p>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                    />
                  </div>
                ) : (
                  <div className="border border-slate-300 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                          {uploadedFile.type.includes('pdf') ? (
                            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{uploadedFile.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(uploadedFile.size)}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeFile}
                        className="text-slate-500 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-blue-500 hover:bg-blue-600"
                disabled={submitExpenseMutation.isPending}
              >
                {submitExpenseMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Submit Expense
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
