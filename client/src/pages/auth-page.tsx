import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PasswordStrength } from "@/components/ui/password-strength";

const loginSchema = z.object({
  username: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = insertUserSchema
  .omit({ companyId: true, monthlySalary: true })
  .extend({
  confirmPassword: z.string().min(1, "Please confirm your password"),
    monthlySalary: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      btcAddress: "",
    },
  });

  // Caps lock detection
  const handleKeyEvent = (event: KeyboardEvent) => {
    if (event.getModifierState && event.getModifierState('CapsLock')) {
      setCapsLockOn(true);
    } else {
      setCapsLockOn(false);
    }
  };

  // Add caps lock detection on password fields
  useEffect(() => {
    const handleKeyUp = (event: KeyboardEvent) => handleKeyEvent(event);
    const handleKeyDown = (event: KeyboardEvent) => handleKeyEvent(event);
    
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const onLogin = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data, {
      onSuccess: () => setLocation("/"),
    });
  };

  const onRegister = (data: z.infer<typeof registerSchema>) => {
    const { confirmPassword, monthlySalary, ...registerData } = data;
    // Backend handles companyId assignment automatically
    registerMutation.mutate({
      ...registerData,
      monthlySalary: monthlySalary ? parseFloat(monthlySalary) : null,
    }, {
      onSuccess: () => setLocation("/"),
    });
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,146,60,0.1),transparent_50%)] animate-pulse"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(245,158,11,0.08),transparent_50%)] animate-pulse" style={{ animationDelay: '1s', animationDuration: '3s' }}></div>
      </div>

      {/* Geometric pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgb(0,0,0) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Left side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-6 relative">
              {/* Logo with glow effect */}
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-2xl animate-pulse"></div>
                <div className="relative bg-white/80 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-white/50">
                  <img 
                    src="/paidin - logos/Logo Designs (Transparent)/paidin-icon-logo.png" 
                    alt="PaidIn Logo" 
                    className="w-16 h-16 drop-shadow-lg"
                  />
                </div>
              </div>
            </div>
            <h2 className="text-4xl font-bold text-foreground tracking-tight">
              Welcome to Paid<span className="text-primary bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">In</span>
            </h2>
            <p className="mt-3 text-lg text-muted-foreground font-light">Bitcoin-native business platform for modern teams</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/60 backdrop-blur-sm p-1 rounded-xl border border-white/50 shadow-lg">
              <TabsTrigger 
                value="login" 
                className="rounded-lg transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary font-medium"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                className="rounded-lg transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary font-medium"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="animate-fade-in">
              <Card className="border-white/50 bg-white/70 backdrop-blur-xl shadow-2xl hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.3)] transition-all duration-300">
                <CardHeader className="space-y-1 pb-4">
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    Sign In
                  </CardTitle>
                  <p className="text-sm text-muted-foreground font-light">Welcome back! Please enter your credentials.</p>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-5">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Username or Email</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your username or email" 
                                {...field}
                                className="bg-white/80 border-gray-200/80 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showLoginPassword ? "text" : "password"} 
                                  placeholder="Enter your password" 
                                  {...field} 
                                  className="bg-white/80 border-gray-200/80 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200 pr-10"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                  {capsLockOn && (
                                    <AlertTriangle className="h-4 w-4 text-amber-500 animate-pulse" />
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                                    className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors duration-200 p-1 rounded hover:bg-gray-100/50"
                                  >
                                    {showLoginPassword ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
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
                        className="w-full h-11 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sign In
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register" className="animate-fade-in">
              <Card className="border-white/50 bg-white/70 backdrop-blur-xl shadow-2xl hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.3)] transition-all duration-300">
                <CardHeader className="space-y-1 pb-4">
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    Create Account
                  </CardTitle>
                  <p className="text-sm text-muted-foreground font-light">Join thousands of businesses using Bitcoin payroll.</p>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">First Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Satoshi" 
                                  {...field}
                                  className="bg-white/80 border-gray-200/80 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Last Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Nakamoto" 
                                  {...field}
                                  className="bg-white/80 border-gray-200/80 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="satoshi" 
                                {...field}
                                className="bg-white/80 border-gray-200/80 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="satoshi@company.com" 
                                {...field}
                                className="bg-white/80 border-gray-200/80 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground font-light mt-1.5">
                              Note: Each email address can only be used for one account
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showRegisterPassword ? "text" : "password"} 
                                  placeholder="••••••••" 
                                  {...field} 
                                  className="bg-white/80 border-gray-200/80 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200 pr-10"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                  {capsLockOn && (
                                    <AlertTriangle className="h-4 w-4 text-amber-500 animate-pulse" />
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                    className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors duration-200 p-1 rounded hover:bg-gray-100/50"
                                  >
                                    {showRegisterPassword ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
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
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Confirm Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showConfirmPassword ? "text" : "password"} 
                                  placeholder="••••••••" 
                                  {...field} 
                                  className="bg-white/80 border-gray-200/80 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200 pr-10"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                  {capsLockOn && (
                                    <AlertTriangle className="h-4 w-4 text-amber-500 animate-pulse" />
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors duration-200 p-1 rounded hover:bg-gray-100/50"
                                  >
                                    {showConfirmPassword ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
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
                        className="w-full h-11 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Account
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero section */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 items-center justify-center p-12 relative overflow-hidden">
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-400/50 via-orange-500/80 to-amber-700/50"></div>
        
        {/* Animated floating circles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
          <div className="absolute top-1/3 left-8 w-24 h-24 bg-white/15 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 right-1/3 w-40 h-40 bg-white/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }}></div>
          <div className="absolute bottom-10 left-10 w-20 h-20 bg-white/12 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '0.5s' }}></div>
          <div className="absolute top-1/2 right-1/4 w-28 h-28 bg-white/10 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '5.5s', animationDelay: '1.5s' }}></div>
        </div>

        {/* Geometric pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        <div className="max-w-lg text-center relative z-10 animate-fade-in px-8 py-12">
          {/* Main Bitcoin logo with premium glow effect */}
          <div className="relative mb-10">
            <div className="absolute inset-0 w-32 h-32 mx-auto bg-white/20 rounded-3xl blur-3xl animate-pulse"></div>
            <div className="relative w-32 h-32 mx-auto bg-white/25 backdrop-blur-md rounded-3xl flex items-center justify-center shadow-2xl border-2 border-white/30">
              <img 
                src="/app - graphic designs/Bitcoin - logo.png" 
                alt="Bitcoin Logo" 
                className="w-28 h-28 drop-shadow-2xl"
              />
            </div>
            <div className="absolute -inset-4 w-32 h-32 mx-auto bg-gradient-to-br from-white/20 to-transparent rounded-3xl blur-xl"></div>
          </div>
          
          {/* Main heading */}
          <div className="space-y-5 mb-10">
            <h3 className="text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight px-4">
              Bitcoin-Native
              <span className="block mt-3">Business Platform</span>
            </h3>
            <p className="text-orange-50 text-base lg:text-lg leading-relaxed max-w-md mx-auto text-center font-light px-2">
              The complete Bitcoin business suite for modern companies. From payroll and invoicing 
              to reporting and compliance, everything you need to run your business on Bitcoin.
            </p>
          </div>
          
          {/* Feature list - Enhanced styling */}
          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-8 border border-white/25 shadow-2xl">
            <div className="flex justify-center">
              <div className="space-y-4 text-left w-full max-w-sm">
                <div className="flex items-center space-x-4 group">
                  <div className="w-2.5 h-2.5 bg-orange-200 rounded-full flex-shrink-0 shadow-lg group-hover:scale-125 transition-transform duration-200"></div>
                  <span className="text-white font-medium text-sm leading-relaxed">Complete payroll & HR management</span>
                </div>
                <div className="flex items-center space-x-4 group">
                  <div className="w-2.5 h-2.5 bg-orange-200 rounded-full flex-shrink-0 shadow-lg group-hover:scale-125 transition-transform duration-200"></div>
                  <span className="text-white font-medium text-sm leading-relaxed">Invoice generation & payment tracking</span>
                </div>
                <div className="flex items-center space-x-4 group">
                  <div className="w-2.5 h-2.5 bg-orange-200 rounded-full flex-shrink-0 shadow-lg group-hover:scale-125 transition-transform duration-200"></div>
                  <span className="text-white font-medium text-sm leading-relaxed">Real-time Bitcoin price integration</span>
                </div>
                <div className="flex items-center space-x-4 group">
                  <div className="w-2.5 h-2.5 bg-orange-200 rounded-full flex-shrink-0 shadow-lg group-hover:scale-125 transition-transform duration-200"></div>
                  <span className="text-white font-medium text-sm leading-relaxed">Business analytics & compliance tools</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
