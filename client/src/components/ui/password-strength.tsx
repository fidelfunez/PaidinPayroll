import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const checks = [
    { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
    { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
    { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
    { label: "One number", test: (p: string) => /\d/.test(p) },
    { label: "One special character", test: (p: string) => /[@$!%*?&]/.test(p) },
  ];

  const passedChecks = checks.filter(check => check.test(password));
  const strength = passedChecks.length;

  const getStrengthColor = () => {
    if (strength === 0) return "bg-slate-200";
    if (strength <= 2) return "bg-red-500";
    if (strength <= 3) return "bg-yellow-500";
    if (strength <= 4) return "bg-orange-500";
    return "bg-green-500";
  };

  const getStrengthText = () => {
    if (strength === 0) return "No password";
    if (strength <= 2) return "Weak";
    if (strength <= 3) return "Fair";
    if (strength <= 4) return "Good";
    return "Strong";
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-slate-200 rounded-full h-1.5">
          <div 
            className={cn("h-1.5 rounded-full transition-all duration-300", getStrengthColor())}
            style={{ width: `${(strength / 5) * 100}%` }}
          />
        </div>
        <span className="text-xs font-medium text-slate-600">
          {getStrengthText()}
        </span>
      </div>
      
      {password && (
        <div className="space-y-1">
          {checks.map((check, index) => (
            <div key={index} className="flex items-center space-x-2 text-xs">
              <div className={cn(
                "w-3 h-3 rounded-full flex items-center justify-center",
                check.test(password) ? "bg-green-500" : "bg-slate-300"
              )}>
                {check.test(password) && (
                  <span className="text-white text-[8px]">✓</span>
                )}
              </div>
              <span className={cn(
                check.test(password) ? "text-green-700" : "text-slate-500"
              )}>
                {check.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}