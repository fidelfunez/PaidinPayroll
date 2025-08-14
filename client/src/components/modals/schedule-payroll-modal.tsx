import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

const payrollSchema = z.object({
  scheduledDate: z.string().min(1, "Scheduled date is required"),
  paymentType: z.string().min(1, "Payment type is required"),
  selectedEmployees: z.array(z.number()).min(1, "At least one employee must be selected"),
});

interface SchedulePayrollModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SchedulePayrollModal({ open, onOpenChange }: SchedulePayrollModalProps) {
  const { toast } = useToast();
  const [selectAll, setSelectAll] = useState(true);

  const { data: employees } = useQuery<User[]>({
    queryKey: ['/api/employees'],
    enabled: open,
  });

  const { data: btcRate } = useQuery<{ rate: number }>({
    queryKey: ['/api/btc-rate'],
    enabled: open,
  });

  const form = useForm({
    resolver: zodResolver(payrollSchema),
    defaultValues: {
      scheduledDate: new Date().toISOString().split('T')[0],
      paymentType: "monthly",
      selectedEmployees: employees?.map(emp => emp.id) || [],
    },
  });

  const selectedEmployees = form.watch("selectedEmployees");

  const schedulePayrollMutation = useMutation({
    mutationFn: async (data: z.infer<typeof payrollSchema>) => {
      const payrollPromises = data.selectedEmployees.map(async (employeeId) => {
        const employee = employees?.find(emp => emp.id === employeeId);
        if (!employee || !employee.monthlySalary) return;

        const amountUsd = parseFloat(employee.monthlySalary);
        
        return await apiRequest('POST', '/api/payroll', {
          userId: employeeId,
          amountUsd: amountUsd.toString(),
          scheduledDate: new Date(data.scheduledDate).toISOString(),
          status: 'pending'
        });
      });

      await Promise.all(payrollPromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payroll'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Payroll scheduled",
        description: "Salary payments have been successfully scheduled.",
      });
      onOpenChange(false);
      form.reset();
      setSelectAll(true);
    },
    onError: () => {
      toast({
        title: "Scheduling failed",
        description: "Failed to schedule payroll. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      form.setValue("selectedEmployees", employees?.map(emp => emp.id) || []);
    } else {
      form.setValue("selectedEmployees", []);
    }
  };

  const handleEmployeeToggle = (employeeId: number, checked: boolean) => {
    const current = form.getValues("selectedEmployees");
    if (checked) {
      form.setValue("selectedEmployees", [...current, employeeId]);
    } else {
      form.setValue("selectedEmployees", current.filter(id => id !== employeeId));
      setSelectAll(false);
    }
  };

  const totalUsd = selectedEmployees.reduce((sum, empId) => {
    const employee = employees?.find(emp => emp.id === empId);
    return sum + parseFloat(employee?.monthlySalary || '0');
  }, 0);

  const totalBtc = btcRate ? totalUsd / btcRate.rate : 0;

  const formatUsd = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '$0.00';
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatBtc = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '0.00000000 BTC';
    return `${amount.toFixed(8)} BTC`;
  };

  const onSubmit = (data: z.infer<typeof payrollSchema>) => {
    schedulePayrollMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Payroll</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly Salary</SelectItem>
                        <SelectItem value="bonus">Bonus Payment</SelectItem>
                        <SelectItem value="onetime">One-time Payment</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Select Employees</Label>
              <div className="border border-input rounded-lg p-4 max-h-48 overflow-y-auto mt-2">
                <div className="flex items-center space-x-2 p-2 border-b">
                  <Checkbox
                    id="select-all"
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all" className="text-sm font-medium">
                    All Employees
                  </Label>
                </div>
                
                {employees?.map((employee) => (
                  <div key={employee.id} className="flex items-center space-x-2 p-2">
                    <Checkbox
                      id={`employee-${employee.id}`}
                      checked={selectedEmployees.includes(employee.id)}
                      onCheckedChange={(checked) => 
                        handleEmployeeToggle(employee.id, checked as boolean)
                      }
                    />
                    <Label htmlFor={`employee-${employee.id}`} className="text-sm flex-1">
                      {employee.firstName} {employee.lastName} ({formatUsd(parseFloat(employee.monthlySalary || '0'))})
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-muted rounded-lg p-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Total USD Amount:</span>
                <span>{formatUsd(totalUsd)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Current BTC Rate:</span>
                <span>{btcRate ? formatUsd(btcRate.rate) : 'Loading...'}</span>
              </div>
              <div className="flex justify-between font-medium text-foreground">
                <span>Total BTC Required:</span>
                <span>{formatBtc(totalBtc)}</span>
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
                className="flex-1"
                disabled={schedulePayrollMutation.isPending || selectedEmployees.length === 0}
              >
                {schedulePayrollMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Schedule Payroll
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
