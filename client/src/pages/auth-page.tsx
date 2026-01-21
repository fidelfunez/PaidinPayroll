import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const loginSchema = z.object({
  username: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
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

  return (
    <div className="h-screen flex items-center justify-center relative overflow-hidden">
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

      {/* Auth form - centered */}
      <div className="w-full max-w-md p-8 relative z-10 animate-fade-in">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-6 relative">
              {/* Logo with glow effect */}
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
                <div className="relative bg-white/80 backdrop-blur-md rounded-full shadow-xl border border-white/50">
                  <img 
                    src="/favicon/paidin-logo.png" 
                    alt="PaidIn Logo" 
                    className="w-24 h-24 rounded-full object-cover drop-shadow-lg"
                  />
                </div>
              </div>
            </div>
            <h2 className="text-4xl font-bold text-foreground tracking-tight">
              Welcome to Paid<span className="text-primary bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">In</span>
            </h2>
            <p className="mt-3 text-lg text-muted-foreground font-light">Bitcoin accounting for small businesses. Reconcile transactions with QuickBooks.</p>
          </div>

          <Card className="border-white/50 bg-white/70 backdrop-blur-xl shadow-2xl hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.3)] transition-all duration-300 animate-fade-in">
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
              
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <a 
                    href="/signup" 
                    className="text-primary hover:underline font-medium transition-colors"
                  >
                    Sign up
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
