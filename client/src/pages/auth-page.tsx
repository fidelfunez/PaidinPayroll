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
  username: z.string().min(1, "Username is required"),
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
    <div className="min-h-screen flex">
      {/* Left side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <img 
                src="/paidin - logos/Logo Designs (Transparent)/paidin-icon-logo.png" 
                alt="PaidIn Logo" 
                className="w-16 h-16"
              />
            </div>
            <h2 className="text-3xl font-bold text-foreground">
              Welcome to Paid<span className="text-orange-500">In</span>
            </h2>
            <p className="mt-2 text-muted-foreground">Bitcoin-native business platform for modern teams</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Sign In</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your username" {...field} />
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
                                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                                    className="text-gray-500 hover:text-gray-700 focus:outline-none"
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

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
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
                            <p className="text-sm text-muted-foreground">
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
                                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                    className="text-gray-500 hover:text-gray-700 focus:outline-none"
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
                                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="text-gray-500 hover:text-gray-700 focus:outline-none"
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
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 items-center justify-center p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-20 h-20 bg-white rounded-full"></div>
          <div className="absolute top-1/3 left-8 w-12 h-12 bg-white rounded-full"></div>
          <div className="absolute bottom-20 right-1/3 w-16 h-16 bg-white rounded-full"></div>
          <div className="absolute bottom-10 left-10 w-8 h-8 bg-white rounded-full"></div>
        </div>
        
        <div className="max-w-lg text-center space-y-8 relative z-10">
          {/* Main Bitcoin logo with glow effect */}
          <div className="relative">
            <div className="w-36 h-36 mx-auto bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-2xl border border-white/30">
              <img 
                src="/app - graphic designs/Bitcoin - logo.png" 
                alt="Bitcoin Logo" 
                className="w-32 h-32 drop-shadow-lg"
              />
            </div>
            <div className="absolute inset-0 w-36 h-36 mx-auto bg-white/10 rounded-3xl blur-xl"></div>
          </div>
          
          {/* Main heading */}
          <div className="space-y-4">
            <h3 className="text-4xl font-bold text-white leading-tight">
              Bitcoin-Native
              <span className="block text-white ">Business Platform</span>
            </h3>
            <p className="text-orange-100 text-lg leading-relaxed max-w-xl mx-auto text-center">
              The complete Bitcoin business suite for modern companies. From payroll and invoicing 
              to reporting and compliance, Everything you need to run your business on Bitcoin.
            </p>
          </div>
          
          {/* Feature list - properly centered */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex justify-center">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 bg-orange-200 rounded-full flex-shrink-0"></div>
                  <span className="text-white font-medium">Complete payroll & HR management</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 bg-orange-200 rounded-full flex-shrink-0"></div>
                  <span className="text-white font-medium">Invoice generation & payment tracking</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 bg-orange-200 rounded-full flex-shrink-0"></div>
                  <span className="text-white font-medium">Real-time Bitcoin price integration</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 bg-orange-200 rounded-full flex-shrink-0"></div>
                  <span className="text-white font-medium">Business analytics & compliance tools</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Trust indicator */}
          <div className="flex items-center justify-center space-x-2 text-orange-100">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Secure • Transparent • Lightning Fast</span>
          </div>
        </div>
      </div>
    </div>
  );
}
