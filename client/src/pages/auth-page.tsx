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

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
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
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData, {
      onSuccess: () => setLocation("/"),
    });
  };

  return (
    <div className="h-screen flex animate-fade-in overflow-hidden">
      {/* Left side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-3 bg-gradient-to-br from-gray-50 via-background to-gray-50">
        <div className="w-full max-w-md space-y-2 sm:space-y-3 animate-slide-up">
          <div className="text-center">
            <div className="flex justify-center mb-3 relative">
              {/* Logo with subtle glow effect */}
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-lg blur-lg"></div>
                <div className="relative bg-white rounded-lg p-1.5 shadow-lg border border-gray-100">
                  <img 
                    src="/paidin - logos/Logo Designs (Transparent)/paidin-icon-logo.png" 
                    alt="PaidIn Logo" 
                    className="w-10 h-10 sm:w-14 sm:h-14"
                  />
                </div>
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
              Welcome to Paid<span className="text-primary">In</span>
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Bitcoin-native business platform for modern teams</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100/50 p-1 rounded-lg">
              <TabsTrigger value="login" className="transition-all duration-200 data-[state=active]:shadow-sm text-sm">Sign In</TabsTrigger>
              <TabsTrigger value="register" className="transition-all duration-200 data-[state=active]:shadow-sm text-sm">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="animate-scale-in">
              <Card className="border-gray-200/80 bg-gradient-card shadow-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold">Sign In</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-2.5">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username or Email</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your username or email" {...field} />
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
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showLoginPassword ? "text" : "password"} 
                                  placeholder="Enter your password" 
                                  {...field} 
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                  {capsLockOn && (
                                    <AlertTriangle className="h-4 w-4 text-yellow-500 animate-pulse" />
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                                    className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors duration-200 p-1 rounded hover:bg-gray-100"
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
                              <p className="text-sm text-yellow-600 flex items-center gap-1 mt-1">
                                <AlertTriangle className="h-3 w-3" />
                                Caps Lock is on
                              </p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full"
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

            <TabsContent value="register" className="animate-scale-in">
              <Card className="border-gray-200/80 bg-gradient-card shadow-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold">Create Account</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <FormField
                          control={registerForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Satoshi" {...field} />
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
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Nakamoto" {...field} />
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
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="satoshi" {...field} />
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
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="satoshi@company.com" {...field} />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">
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
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showRegisterPassword ? "text" : "password"} 
                                  placeholder="••••••••" 
                                  {...field} 
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                  {capsLockOn && (
                                    <AlertTriangle className="h-4 w-4 text-yellow-500 animate-pulse" />
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                    className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors duration-200 p-1 rounded hover:bg-gray-100"
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
                              <p className="text-sm text-yellow-600 flex items-center gap-1 mt-1">
                                <AlertTriangle className="h-3 w-3" />
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
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showConfirmPassword ? "text" : "password"} 
                                  placeholder="••••••••" 
                                  {...field} 
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                  {capsLockOn && (
                                    <AlertTriangle className="h-4 w-4 text-yellow-500 animate-pulse" />
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors duration-200 p-1 rounded hover:bg-gray-100"
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
                              <p className="text-sm text-yellow-600 flex items-center gap-1 mt-1">
                                <AlertTriangle className="h-3 w-3" />
                                Caps Lock is on
                              </p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full"
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
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 items-center justify-center p-6 relative overflow-hidden">
        {/* Multi-layer background with animated floating elements */}
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
        
        <div className="max-w-lg text-center space-y-4 relative z-10 animate-slide-up">
          {/* Main Bitcoin logo with premium glow effect */}
          <div className="relative">
            <div className="absolute inset-0 w-32 h-32 mx-auto bg-white/20 rounded-2xl blur-2xl"></div>
            <div className="relative w-32 h-32 mx-auto bg-white/25 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-2xl border-2 border-white/30">
              <img 
                src="/app - graphic designs/Bitcoin - logo.png" 
                alt="Bitcoin Logo" 
                className="w-28 h-28 drop-shadow-2xl"
              />
            </div>
            <div className="absolute -inset-3 w-32 h-32 mx-auto bg-gradient-to-br from-white/20 to-transparent rounded-2xl blur-xl"></div>
          </div>
          
          {/* Main heading */}
          <div className="space-y-3">
            <h3 className="text-3xl lg:text-4xl font-bold text-white leading-tight tracking-tight">
              Bitcoin-Native
              <span className="block mt-1">Business Platform</span>
            </h3>
            <p className="text-orange-50 text-sm lg:text-base leading-relaxed max-w-xl mx-auto text-center font-light">
              The complete Bitcoin business suite for modern companies. From payroll and invoicing 
              to reporting and compliance, everything you need to run your business on Bitcoin.
            </p>
          </div>
          
          {/* Feature list - Enhanced styling */}
          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/25 shadow-2xl">
            <div className="flex justify-center">
              <div className="space-y-3 text-left">
                <div className="flex items-center space-x-3 group">
                  <div className="w-2 h-2 bg-orange-200 rounded-full flex-shrink-0 shadow-lg group-hover:scale-125 transition-transform duration-200"></div>
                  <span className="text-white font-semibold text-sm">Complete payroll & HR management</span>
                </div>
                <div className="flex items-center space-x-3 group">
                  <div className="w-2 h-2 bg-orange-200 rounded-full flex-shrink-0 shadow-lg group-hover:scale-125 transition-transform duration-200"></div>
                  <span className="text-white font-semibold text-sm">Invoice generation & payment tracking</span>
                </div>
                <div className="flex items-center space-x-3 group">
                  <div className="w-2 h-2 bg-orange-200 rounded-full flex-shrink-0 shadow-lg group-hover:scale-125 transition-transform duration-200"></div>
                  <span className="text-white font-semibold text-sm">Real-time Bitcoin price integration</span>
                </div>
                <div className="flex items-center space-x-3 group">
                  <div className="w-2 h-2 bg-orange-200 rounded-full flex-shrink-0 shadow-lg group-hover:scale-125 transition-transform duration-200"></div>
                  <span className="text-white font-semibold text-sm">Business analytics & compliance tools</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Trust indicator - Enhanced */}
          <div className="flex items-center justify-center space-x-2 text-orange-50 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-semibold">Secure • Transparent • Lightning Fast</span>
          </div>
        </div>
      </div>
    </div>
  );
}
