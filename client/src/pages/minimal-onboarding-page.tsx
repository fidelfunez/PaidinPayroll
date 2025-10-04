import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MinimalOnboardingPage() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Step 1: Welcome</h2>
            <p className="text-muted-foreground">Welcome to PaidIn onboarding</p>
          </div>
        );
      case 2:
        return (
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Step 2: Company Info</h2>
            <p className="text-muted-foreground">Enter your company details</p>
          </div>
        );
      case 3:
        return (
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Step 3: Complete</h2>
            <p className="text-muted-foreground">You're all set!</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Minimal Onboarding Test</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-6">
              {renderStep()}
            </div>
            
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              
              <div className="text-sm text-muted-foreground">
                Step {currentStep} of 3
              </div>
              
              <Button
                onClick={handleNext}
                disabled={currentStep === 3}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
