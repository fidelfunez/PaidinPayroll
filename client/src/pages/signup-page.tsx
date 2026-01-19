import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle, Eye, EyeOff, Mail, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PasswordStrength } from "@/components/ui/password-strength";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 
      "Password must contain at least 1 uppercase letter, 1 number, and 1 special character"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  companyName: z.string().min(1, "Company name is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Get plan from URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const planParam = urlParams.get('plan') || 'free';
  const validPlans = ['free', 'starter', 'growth', 'scale'];
  const selectedPlan = validPlans.includes(planParam) ? planParam : 'free';

  const form = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
      companyName: "",
    },
  });

  // Caps lock detection
  useEffect(() => {
    const handleKeyEvent = (event: KeyboardEvent) => {
      if (event.getModifierState && event.getModifierState('CapsLock')) {
        setCapsLockOn(true);
      } else {
        setCapsLockOn(false);
      }
    };

    document.addEventListener('keyup', handleKeyEvent);
    document.addEventListener('keydown', handleKeyEvent);

    return () => {
      document.removeEventListener('keyup', handleKeyEvent);
      document.removeEventListener('keydown', handleKeyEvent);
    };
  }, []);

  const onSubmit = async (data: z.infer<typeof signupSchema>) => {
    setIsSubmitting(true);

    try {
      const response = await apiRequest("POST", "/api/signup", {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        username: data.username,
        password: data.password,
        companyName: data.companyName,
        plan: selectedPlan,
      });

      if (response.ok) {
        const result = await response.json();
        setUserEmail(data.email);
        
        // Wallet creation moved to dashboard (after email verification)
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account and complete setup.",
        });
        setSignupSuccess(true);
      } else {
        const error = await response.json();
        toast({
          title: "Signup failed",
          description: error.message || "Unable to create account. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Signup failed",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (signupSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/20">
        <Card className="w-full max-w-md border-white/50 bg-white/70 backdrop-blur-xl shadow-2xl">
          <CardContent className="pt-12 pb-8 px-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                <Mail className="h-10 w-10 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Check your email!</h2>
            <p className="text-gray-600 mb-6">
              We've sent a verification link to <strong>{userEmail}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Click the link in the email to verify your account and complete your registration. 
              The link will expire in 24 hours.
            </p>
            <Button
              onClick={() => setLocation("/auth")}
              variant="outline"
              className="w-full"
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgb(0,0,0) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}></div>
      </div>

      {/* Centered container */}
      <div className="max-w-lg mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl"></div>
              <div className="relative bg-white rounded-full p-3 shadow-lg border border-gray-100">
                <img 
                  src="/favicon/paidin-logo.png" 
                  alt="PaidIn Logo" 
                  className="w-14 h-14 rounded-full object-cover"
                />
              </div>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-3">
            Create your <span className="text-primary">PaidIn</span> account
          </h1>
          <p className="text-gray-600 text-base mb-4">
            Bitcoin accounting for small businesses. Reconcile transactions with QuickBooks.
          </p>
          {selectedPlan !== 'free' && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-sm text-primary font-medium">
              <span>14-day free trial</span>
              <span>•</span>
              <span className="capitalize">{selectedPlan} plan</span>
            </div>
          )}
          {selectedPlan === 'free' && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-100 border border-gray-200 rounded-full text-sm text-gray-700 font-medium">
              Free forever plan
            </div>
          )}
        </div>

        {/* Form Card */}
        <Card className="border border-gray-200 bg-white shadow-xl">
          <CardHeader className="space-y-1 pb-6 pt-8 px-8">
            <CardTitle className="text-xl font-semibold text-gray-900">Company Information</CardTitle>
            <p className="text-sm text-gray-500 font-normal">
              {selectedPlan === 'free' 
                ? "Free forever plan - up to 3 employees"
                : `Starting your ${selectedPlan} plan trial`}
            </p>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  {/* Company Name */}
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Company Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Acme Corp" 
                            {...field}
                            className="bg-white border-gray-300 focus:border-primary focus:ring-primary/20 h-11"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">First Name *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Satoshi" 
                              {...field}
                              className="bg-white border-gray-300 focus:border-primary focus:ring-primary/20 h-11"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Last Name *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Nakamoto" 
                              {...field}
                              className="bg-white border-gray-300 focus:border-primary focus:ring-primary/20 h-11"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Email *</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="satoshi@company.com" 
                            {...field}
                            className="bg-white border-gray-300 focus:border-primary focus:ring-primary/20 h-11"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Username *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="satoshi" 
                            {...field}
                            className="bg-white border-gray-300 focus:border-primary focus:ring-primary/20 h-11"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Password *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="••••••••" 
                              {...field} 
                              className="bg-white border-gray-300 focus:border-primary focus:ring-primary/20 pr-10 h-11"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                              {capsLockOn && (
                                <AlertTriangle className="h-4 w-4 text-amber-500 animate-pulse" />
                              )}
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors p-1 rounded hover:bg-gray-100/50"
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                        </FormControl>
                        {capsLockOn && (
                          <p className="text-sm text-amber-600 flex items-center gap-1.5 mt-1.5 font-medium">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Caps Lock is on
                          </p>
                        )}
                        <FormMessage />
                        <PasswordStrength password={field.value || ""} className="mt-2" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Confirm Password *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showConfirmPassword ? "text" : "password"} 
                              placeholder="••••••••" 
                              {...field} 
                              className="bg-white border-gray-300 focus:border-primary focus:ring-primary/20 pr-10 h-11"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                              {capsLockOn && (
                                <AlertTriangle className="h-4 w-4 text-amber-500 animate-pulse" />
                              )}
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors p-1 rounded hover:bg-gray-100/50"
                              >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                        </FormControl>
                        {capsLockOn && (
                          <p className="text-sm text-amber-600 flex items-center gap-1.5 mt-1.5 font-medium">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Caps Lock is on
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-200 mt-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>

                <p className="text-xs text-center text-gray-500 pt-2">
                  By signing up, you agree to our{" "}
                  <a href="/terms-of-service" className="text-primary hover:underline">Terms of Service</a>
                  {" "}and{" "}
                  <a href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</a>
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{" "}
          <a href="/auth" className="text-primary hover:underline font-medium">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
