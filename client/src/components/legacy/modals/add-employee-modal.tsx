import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, UserPlus, Mail, DollarSign, Calendar, MapPin, Shield, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBtcRate } from "@/hooks/use-btc-rate-context";
import { useAuth } from "@/hooks/use-auth";

interface AddEmployeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmployeeAdded?: (employee: any) => void;
}

// Form validation schema
const employeeSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["employee", "admin", "super_admin"], {
    required_error: "Please select a role"
  }),
  department: z.string().min(2, "Department is required"),
  position: z.string().min(2, "Position is required"),
  monthlySalary: z.coerce.number().min(1000, "Salary must be at least $1,000").max(500000, "Salary cannot exceed $500,000"),
  currency: z.enum(["USD", "BTC"], {
    required_error: "Please select a currency"
  }),
  startDate: z.string().min(1, "Start date is required"),
  location: z.string().min(2, "Location is required"),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  sendWelcomeEmail: z.boolean().default(true),
  requirePasswordReset: z.boolean().default(true)
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
}

export function AddEmployeeModal({ open, onOpenChange, onEmployeeAdded }: AddEmployeeModalProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  console.log('AddEmployeeModal rendered, open:', open);
  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>([
    { id: 'validate', title: 'Validate Information', description: 'Check email availability and data integrity', icon: CheckCircle, status: 'pending' },
    { id: 'create', title: 'Create Account', description: 'Generate user account and set permissions', icon: UserPlus, status: 'pending' },
    { id: 'email', title: 'Send Invitation', description: 'Email welcome message and login credentials', icon: Mail, status: 'pending' },
    { id: 'setup', title: 'Setup Payroll', description: 'Configure salary and payment preferences', icon: DollarSign, status: 'pending' }
  ]);

  const { rate: btcRate } = useBtcRate();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
    trigger
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      role: "employee",
      department: "",
      position: "",
      monthlySalary: 5000,
      currency: "USD",
      startDate: new Date().toISOString().split('T')[0],
      location: "",
      phoneNumber: "",
      address: "",
      notes: "",
      sendWelcomeEmail: true,
      requirePasswordReset: true
    }
  });

  const watchedSalary = watch("monthlySalary");
  const watchedCurrency = watch("currency");

  // Calculate BTC equivalent
  const calculateBtcAmount = (usdAmount: number) => {
    return btcRate ? usdAmount / btcRate : 0;
  };

  const formatBtc = (amount: number) => {
    return `${amount.toFixed(8)} BTC`;
  };

  const formatUsd = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleNext = async () => {
    console.log('Next button clicked, current step:', currentStep);
    
    // For testing, let's just move to next step without validation
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      console.log('Moved to step:', currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const simulateOnboardingStep = async (stepId: string, duration: number = 1500) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setOnboardingSteps(prev => prev.map(step => 
          step.id === stepId 
            ? { ...step, status: 'completed' as const }
            : step
        ));
        resolve();
      }, duration);
    });
  };

  const onSubmit = async (data: EmployeeFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setCurrentStep(4); // Move to processing step

    try {
      // Simulate the onboarding process
      setOnboardingSteps(prev => prev.map(step => ({ ...step, status: 'pending' as const })));

      // Step 1: Validate Information
      setOnboardingSteps(prev => prev.map(step => 
        step.id === 'validate' ? { ...step, status: 'in-progress' as const } : step
      ));
      await simulateOnboardingStep('validate', 1000);

      // Step 2: Create Account
      setOnboardingSteps(prev => prev.map(step => 
        step.id === 'create' ? { ...step, status: 'in-progress' as const } : step
      ));
      await simulateOnboardingStep('create', 1200);

      // Step 3: Send Invitation
      setOnboardingSteps(prev => prev.map(step => 
        step.id === 'email' ? { ...step, status: 'in-progress' as const } : step
      ));
      await simulateOnboardingStep('email', 800);

      // Step 4: Setup Payroll
      setOnboardingSteps(prev => prev.map(step => 
        step.id === 'setup' ? { ...step, status: 'in-progress' as const } : step
      ));
      await simulateOnboardingStep('setup', 1000);

      // Simulate API call
      const newEmployee = {
        id: Date.now(),
        ...data,
        status: 'invited',
        invitedAt: new Date().toISOString(),
        monthlySalaryBtc: watchedCurrency === 'BTC' ? watchedSalary : calculateBtcAmount(watchedSalary || 0)
      };

      // Success
      toast({
        title: "Employee Added Successfully",
        description: `${data.firstName} ${data.lastName} has been invited to join the team.`,
      });

      onEmployeeAdded?.(newEmployee);
      handleClose();

    } catch (error) {
      console.error('Error adding employee:', error);
      setSubmitError("Failed to add employee. Please try again.");
      setOnboardingSteps(prev => prev.map(step => ({ ...step, status: 'error' as const })));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setCurrentStep(1);
    setSubmitError(null);
    setIsSubmitting(false);
    setOnboardingSteps(prev => prev.map(step => ({ ...step, status: 'pending' as const })));
    onOpenChange(false);
  };

  const getStepIcon = (step: OnboardingStep) => {
    const Icon = step.icon;
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in-progress':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  console.log('Modal rendering with open:', open);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-orange-500" />
            Add New Employee
          </DialogTitle>
        </DialogHeader>

        {currentStep < 4 ? (
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit)(e); }} className="space-y-6">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-orange-500" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        {...register("firstName")}
                        placeholder="Enter first name"
                        className={errors.firstName ? "border-red-500" : ""}
                        defaultValue="John"
                      />
                      {errors.firstName && (
                        <p className="text-sm text-red-600">{errors.firstName.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        {...register("lastName")}
                        placeholder="Enter last name"
                        className={errors.lastName ? "border-red-500" : ""}
                        defaultValue="Doe"
                      />
                      {errors.lastName && (
                        <p className="text-sm text-red-600">{errors.lastName.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder="employee@company.com"
                      className={errors.email ? "border-red-500" : ""}
                      defaultValue="john.doe@company.com"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        {...register("phoneNumber")}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        {...register("startDate")}
                        className={errors.startDate ? "border-red-500" : ""}
                      />
                      {errors.startDate && (
                        <p className="text-sm text-red-600">{errors.startDate.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      {...register("address")}
                      placeholder="Enter full address"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Role & Position */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-orange-500" />
                    Role & Position
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">Role *</Label>
                      <Select 
                        onValueChange={(value) => setValue("role", value as "employee" | "admin" | "super_admin")}
                        defaultValue="employee"
                      >
                        <SelectTrigger className={errors.role ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          {user?.role === 'super_admin' && (
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {errors.role && (
                        <p className="text-sm text-red-600">{errors.role.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="department">Department *</Label>
                      <Input
                        id="department"
                        {...register("department")}
                        placeholder="e.g., Engineering, Sales, Marketing"
                        className={errors.department ? "border-red-500" : ""}
                        defaultValue="Engineering"
                      />
                      {errors.department && (
                        <p className="text-sm text-red-600">{errors.department.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position">Position *</Label>
                    <Input
                      id="position"
                      {...register("position")}
                      placeholder="e.g., Software Engineer, Sales Manager"
                      className={errors.position ? "border-red-500" : ""}
                      defaultValue="Software Engineer"
                    />
                    {errors.position && (
                      <p className="text-sm text-red-600">{errors.position.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      {...register("location")}
                      placeholder="e.g., New York, NY or Remote"
                      className={errors.location ? "border-red-500" : ""}
                      defaultValue="San Francisco, CA"
                    />
                    {errors.location && (
                      <p className="text-sm text-red-600">{errors.location.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Compensation & Settings */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-orange-500" />
                    Compensation & Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency *</Label>
                      <Select 
                        onValueChange={(value) => setValue("currency", value as "USD" | "BTC")}
                        defaultValue="USD"
                      >
                        <SelectTrigger className={errors.currency ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="BTC">BTC</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.currency && (
                        <p className="text-sm text-red-600">{errors.currency.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="monthlySalary">Monthly Salary *</Label>
                      <Input
                        id="monthlySalary"
                        type="number"
                        {...register("monthlySalary")}
                        placeholder="5000"
                        className={errors.monthlySalary ? "border-red-500" : ""}
                      />
                      {errors.monthlySalary && (
                        <p className="text-sm text-red-600">{errors.monthlySalary.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Salary Display */}
                  {watchedSalary && watchedCurrency && (
                    <Card className="bg-orange-50 border-orange-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-orange-800">Salary Summary</h4>
                            <p className="text-sm text-orange-600">
                              {watchedCurrency === 'USD' ? formatUsd(watchedSalary) : `${formatBtc(watchedSalary)}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-orange-600">Equivalent:</p>
                            <p className="font-medium text-orange-800">
                              {watchedCurrency === 'USD' 
                                ? formatBtc(calculateBtcAmount(watchedSalary))
                                : formatUsd(watchedSalary * (btcRate || 118000))
                              }
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="space-y-4">
                    <h4 className="font-medium">Invitation Settings</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="sendWelcomeEmail">Send Welcome Email</Label>
                        <p className="text-sm text-muted-foreground">
                          Send a welcome email with login instructions
                        </p>
                      </div>
                      <Switch
                        id="sendWelcomeEmail"
                        checked={watch("sendWelcomeEmail")}
                        onCheckedChange={(checked) => setValue("sendWelcomeEmail", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="requirePasswordReset">Require Password Reset</Label>
                        <p className="text-sm text-muted-foreground">
                          Force password change on first login
                        </p>
                      </div>
                      <Switch
                        id="requirePasswordReset"
                        checked={watch("requirePasswordReset")}
                        onCheckedChange={(checked) => setValue("requirePasswordReset", checked)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      {...register("notes")}
                      placeholder="Additional notes about this employee..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error Display */}
            {submitError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            {/* Navigation */}
            <DialogFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    console.log('Next button clicked, preventing default');
                    handleNext();
                  }}
                  disabled={isSubmitting}
                >
                  Next
                </Button>
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding Employee...
                  </>
                ) : (
                  "Add Employee"
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          /* Processing Step */
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Setting Up Employee</h3>
              <p className="text-muted-foreground">
                We're creating the account and sending the invitation...
              </p>
            </div>

            <div className="space-y-4">
              {onboardingSteps.map((step) => (
                <div key={step.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  {getStepIcon(step)}
                  <div className="flex-1">
                    <h4 className="font-medium">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  <Badge 
                    variant={step.status === 'completed' ? 'default' : 
                           step.status === 'in-progress' ? 'secondary' : 
                           step.status === 'error' ? 'destructive' : 'outline'}
                  >
                    {step.status === 'completed' ? 'Complete' :
                     step.status === 'in-progress' ? 'Processing' :
                     step.status === 'error' ? 'Error' : 'Pending'}
                  </Badge>
                </div>
              ))}
            </div>

            {submitError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                onClick={handleClose}
                disabled={isSubmitting}
                variant="outline"
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
