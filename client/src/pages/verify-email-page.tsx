import { useState, useEffect, useRef } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Mail, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, setAuthToken } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

export default function VerifyEmailPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/verify-email/:token");
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState("Verifying your email...");
  const [errorMessage, setErrorMessage] = useState("");
  
  // Track if verification has been attempted for this token
  const hasAttemptedVerification = useRef(false);
  const verifiedToken = useRef<string | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = params?.token;
      
      if (!token) {
        setStatus('error');
        setErrorMessage("Invalid verification link");
        return;
      }

      // Prevent duplicate verification attempts
      if (hasAttemptedVerification.current && verifiedToken.current === token) {
        return;
      }

      // If we've already verified a different token, reset state
      if (verifiedToken.current && verifiedToken.current !== token) {
        hasAttemptedVerification.current = false;
        verifiedToken.current = null;
      }

      hasAttemptedVerification.current = true;
      verifiedToken.current = token;

      try {
        const response = await apiRequest("GET", `/api/verify-email/${token}`);

        if (response.ok) {
          const data = await response.json();
          
          if (data.token) {
            // Set auth token and redirect to dashboard
            setAuthToken(data.token);
            await refreshUser();
            
            setStatus('success');
            setMessage("Email verified successfully!");
            
            toast({
              title: "Email verified!",
              description: "Your account has been verified. Welcome to PaidIn!",
            });

            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
              setLocation("/");
            }, 2000);
          } else if (data.verified) {
            // Already verified case
            setStatus('success');
            setMessage(data.message || "Email already verified. You can now log in.");
            toast({
              title: "Already verified",
              description: "Your email has already been verified. Redirecting to login...",
            });
            setTimeout(() => {
              setLocation("/auth");
            }, 2000);
          } else {
            setStatus('success');
            setMessage(data.message || "Email verified successfully!");
          }
        } else {
          const error = await response.json();
          const errorMsg = error.message || "Failed to verify email. The link may be expired or invalid.";
          
          // If error is "Invalid or expired verification token" but we already succeeded,
          // don't show error (token was consumed on first successful attempt)
          if (errorMsg.includes("Invalid or expired") && status === 'success') {
            // Already verified, ignore this error
            return;
          }
          
          setStatus('error');
          setErrorMessage(errorMsg);
        }
      } catch (error: any) {
        // Only log/show error if we haven't already succeeded
        if (status !== 'success') {
          console.error('Verification error:', error);
          setStatus('error');
          setErrorMessage(error.message || "An error occurred while verifying your email. Please try again.");
        }
      }
    };

    verifyEmail();
  }, [params?.token]); // Only depend on token, not other functions

  const handleResendEmail = async () => {
    // This would need the user's email - for now, redirect to support
    setLocation("/auth");
    toast({
      title: "Resend verification",
      description: "Please contact support or use the 'Forgot Password' flow to resend verification.",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/20">
      <Card className="w-full max-w-md border-white/50 bg-white/70 backdrop-blur-xl shadow-2xl">
        <CardContent className="pt-12 pb-8 px-8 text-center">
          {status === 'verifying' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
                  <Loader2 className="h-10 w-10 text-white animate-spin" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Verifying your email...</h2>
              <p className="text-gray-600">
                Please wait while we verify your email address.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="h-10 w-10 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Email Verified!</h2>
              <p className="text-gray-600 mb-8">
                {message}
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Redirecting you to your dashboard...
              </p>
              <Button
                onClick={() => setLocation("/")}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-lg">
                  <XCircle className="h-10 w-10 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Verification Failed</h2>
              <p className="text-gray-600 mb-6">
                {errorMessage}
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => setLocation("/auth")}
                  className="w-full"
                >
                  Back to Login
                </Button>
                <Button
                  onClick={handleResendEmail}
                  variant="outline"
                  className="w-full"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Request New Link
                </Button>
              </div>
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-amber-900 mb-1">Need help?</p>
                    <p className="text-xs text-amber-700">
                      If your verification link expired or you're having trouble, please contact support at{" "}
                      <a href="mailto:connect@paidin.io" className="underline">connect@paidin.io</a>
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
