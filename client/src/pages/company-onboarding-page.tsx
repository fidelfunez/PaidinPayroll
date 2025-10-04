import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  User,
  Palette,
  Bitcoin,
  Users,
  CheckCircle,
  Upload,
  Eye,
  EyeOff,
  SkipForward,
  Play,
  X,
  Loader2,
  Sparkles,
  Zap,
  Shield,
  Globe,
  Target,
  TrendingUp
} from "lucide-react";

interface OnboardingData {
  // Step 1: Company Basics
  companyName: string;
  companyDomain: string;
  industry: string;
  customIndustry?: string;
  teamSize: string;
  currencyPreference: 'USD' | 'BTC';
  
  // Step 2: Admin User
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  adminPhoto?: File;
  
  // Step 3: Branding
  companyLogo?: File;
  primaryColor: string;
  companyDescription: string;
  location: string;
  
  // Step 4: Bitcoin Config
  btcWalletAddress: string;
  lightningEnabled: boolean;
  bitcoinEducationCompleted: boolean;
  
  // Step 5: Team Setup
  employees: Array<{
    name: string;
    email: string;
    role: string;
  }>;
  
  // Step 6: Feature Selection
  selectedFeatures: string[];
  
  // Step 7: Final Setup
  dashboardTourCompleted: boolean;
}

const INDUSTRIES = [
  { value: 'technology', label: 'Technology', icon: '💻' },
  { value: 'finance', label: 'Finance & Banking', icon: '💰' },
  { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
  { value: 'education', label: 'Education', icon: '🎓' },
  { value: 'retail', label: 'Retail & E-commerce', icon: '🛍️' },
  { value: 'manufacturing', label: 'Manufacturing', icon: '🏭' },
  { value: 'consulting', label: 'Consulting', icon: '💼' },
  { value: 'real-estate', label: 'Real Estate', icon: '🏠' },
  { value: 'legal', label: 'Legal Services', icon: '⚖️' },
  { value: 'marketing', label: 'Marketing & Advertising', icon: '📢' },
  { value: 'media', label: 'Media & Entertainment', icon: '🎬' },
  { value: 'nonprofit', label: 'Non-profit', icon: '🤝' },
  { value: 'government', label: 'Government', icon: '🏛️' },
  { value: 'agriculture', label: 'Agriculture', icon: '🌾' },
  { value: 'transportation', label: 'Transportation & Logistics', icon: '🚚' },
  { value: 'energy', label: 'Energy & Utilities', icon: '⚡' },
  { value: 'other', label: 'Other', icon: '🏢' }
];

const TEAM_SIZES = [
  { value: '1-5', label: '1-5 employees', tier: 'starter' },
  { value: '6-10', label: '6-10 employees', tier: 'starter' },
  { value: '11-25', label: '11-25 employees', tier: 'professional' },
  { value: '26-50', label: '26-50 employees', tier: 'professional' },
  { value: '51-100', label: '51-100 employees', tier: 'enterprise' },
  { value: '100+', label: '100+ employees', tier: 'enterprise' }
];

const COLORS = [
  { name: 'Bitcoin Orange', value: '#f97316', class: 'bg-orange-500' },
  { name: 'Blue', value: '#3b82f6', class: 'bg-blue-500' },
  { name: 'Green', value: '#10b981', class: 'bg-green-500' },
  { name: 'Purple', value: '#8b5cf6', class: 'bg-purple-500' },
  { name: 'Red', value: '#ef4444', class: 'bg-red-500' },
  { name: 'Indigo', value: '#6366f1', class: 'bg-indigo-500' }
];

const FEATURE_CATEGORIES = [
  {
    id: 'core',
    name: 'Core Operations',
    description: 'Essential features for running your business',
    icon: '📊',
    alwaysIncluded: true,
    features: [
      { id: 'dashboard', name: 'Dashboard with integrated wallet view', description: 'Overview with USD and BTC balances' },
      { id: 'employees', name: 'Employee management', description: 'Manage your team and their information' },
      { id: 'payroll', name: 'Bitcoin-native payroll', description: 'Pay employees in Bitcoin or USD' },
      { id: 'bulk-payroll', name: 'Bulk payroll processing', description: 'Process multiple payments at once' },
      { id: 'wallet', name: 'Wallet', description: 'Wallet funding and transaction history' }
    ]
  },
  {
    id: 'financial',
    name: 'Financial Management',
    description: 'Complete financial operations and reporting',
    icon: '💰',
    alwaysIncluded: false,
    features: [
      { id: 'accounting', name: 'Accounting dashboard', description: 'Track income, expenses, and financial health' },
      { id: 'invoicing', name: 'Invoicing & reports', description: 'Create and manage client invoices' },
      { id: 'reimbursements', name: 'Expense reimbursements', description: 'Manage employee expense claims' },
      { id: 'withdrawal-methods', name: 'Withdrawal methods', description: 'Configure employee payment methods' },
      { id: 'payslips', name: 'PDF payslips', description: 'Generate and download payslips' }
    ]
  },
  {
    id: 'compliance',
    name: 'Global Compliance',
    description: 'Stay compliant with regulations worldwide',
    icon: '🌍',
    alwaysIncluded: false,
    features: [
      { id: 'tax-compliance', name: 'Tax & compliance', description: 'Automated tax calculations and compliance' },
      { id: 'audit-logs', name: 'Audit logs', description: 'Complete audit trail for all activities' },
      { id: 'approvals', name: 'Approvals & tasks', description: 'Manage approval workflows' }
    ]
  },
  {
    id: 'employee',
    name: 'Employee Tools',
    description: 'Self-service features for your team',
    icon: '👥',
    alwaysIncluded: false,
    features: [
      { id: 'my-expenses', name: 'My expenses', description: 'Submit and track expense claims' },
      { id: 'time-tracking', name: 'Time tracking', description: 'Track work hours and productivity' },
      { id: 'time-off', name: 'Time off requests', description: 'Request and manage vacation time' },
      { id: 'profile', name: 'Profile management', description: 'Update personal information' },
      { id: 'files', name: 'File management', description: 'Upload and organize documents' },
      { id: 'benefits', name: 'Benefits portal', description: 'View and manage employee benefits' }
    ]
  },
  {
    id: 'communication',
    name: 'Communication',
    description: 'Team collaboration and messaging',
    icon: '💬',
    alwaysIncluded: false,
    features: [
      { id: 'messages', name: 'Messages', description: 'Internal team communication' },
      { id: 'notifications', name: 'Notifications', description: 'Stay updated with alerts and reminders' }
    ]
  },
  {
    id: 'help',
    name: 'Help Center',
    description: 'Learning resources and support',
    icon: '📚',
    alwaysIncluded: false,
    features: [
      { id: 'bitcoin-education', name: 'Bitcoin education', description: 'Learn about Bitcoin and best practices' },
      { id: 'getting-started', name: 'Getting started guide', description: 'Step-by-step setup and onboarding' },
      { id: 'faq', name: 'FAQ', description: 'Frequently asked questions and answers' },
      { id: 'support', name: 'Support', description: 'Contact support and get help' }
    ]
  },
  {
    id: 'advanced',
    name: 'Advanced Tools',
    description: 'Power-user features and integrations',
    icon: '🔧',
    alwaysIncluded: false,
    features: [
      { id: 'integrations', name: 'Integrations', description: 'Connect with third-party services' },
      { id: 'api-access', name: 'API access', description: 'Programmatic access to your data' },
      { id: 'settings', name: 'System settings', description: 'Configure application preferences' }
    ]
  }
];

export default function CompanyOnboardingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: '',
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false
    }
  });
  const [emailError, setEmailError] = useState('');
  const [data, setData] = useState<OnboardingData>({
    companyName: '',
    companyDomain: '',
    industry: '',
    customIndustry: '',
    teamSize: '',
    currencyPreference: 'USD',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    primaryColor: '#f97316',
    companyDescription: '',
    location: '',
    btcWalletAddress: '',
    lightningEnabled: false,
    bitcoinEducationCompleted: false,
    employees: [],
    selectedFeatures: [],
    dashboardTourCompleted: false
  });

  const logoInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        const hasIndustry = data.industry && (data.industry !== 'other' || data.customIndustry);
        return data.companyName && hasIndustry && data.teamSize;
      case 2:
        const allPasswordRequirementsMet = Object.values(passwordStrength.requirements).every(Boolean);
        const isEmailValid = data.adminEmail && !emailError;
        return data.adminName && isEmailValid && data.adminPassword && allPasswordRequirementsMet;
      case 3:
        return data.companyLogo;
      case 4:
        return true; // Bitcoin config is optional
      case 5:
        return true; // Team setup is optional
      case 6:
        return true; // Feature selection is optional
      case 7:
        return true;
      default:
        return false;
    }
  };

  // Mobile swipe navigation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startX = 0;
    let startY = 0;
    let isSwipe = false;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isSwipe = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!startX || !startY) return;
      
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = startX - currentX;
      const diffY = startY - currentY;
      
      // Determine if this is a horizontal swipe
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        isSwipe = true;
        e.preventDefault(); // Prevent scrolling
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isSwipe) return;
      
      const endX = e.changedTouches[0].clientX;
      const diffX = startX - endX;
      
      // Swipe left (next step)
      if (diffX > 100 && canProceed() && currentStep < totalSteps) {
        handleNext();
      }
      // Swipe right (previous step)
      else if (diffX < -100 && currentStep > 1) {
        handlePrevious();
      }
      
      startX = 0;
      startY = 0;
      isSwipe = false;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentStep, canProceed]);

  const totalSteps = 7;
  const progress = (currentStep / totalSteps) * 100;

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
    
    // Check password strength when password is updated
    if (updates.adminPassword !== undefined) {
      checkPasswordStrength(updates.adminPassword);
    }
    
    // Validate email when email is updated
    if (updates.adminEmail !== undefined) {
      validateEmail(updates.adminEmail);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const checkPasswordStrength = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };

    const score = Object.values(requirements).filter(Boolean).length;
    
    let feedback = '';
    if (score === 0) feedback = 'Very Weak';
    else if (score === 1) feedback = 'Weak';
    else if (score === 2) feedback = 'Fair';
    else if (score === 3) feedback = 'Good';
    else if (score === 4) feedback = 'Strong';
    else if (score === 5) feedback = 'Very Strong';

    setPasswordStrength({ score, feedback, requirements });
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsTransitioning(false);
      }, 150);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsTransitioning(false);
      }, 150);
    }
  };

  const handleSkip = () => {
    if (currentStep === 4) {
      // Skip Bitcoin education
      updateData({ bitcoinEducationCompleted: false });
    } else if (currentStep === 7) {
      // Skip dashboard tour
      updateData({ dashboardTourCompleted: false });
    }
    handleNext();
  };

  const handleFileUpload = (file: File, type: 'logo' | 'photo') => {
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, WebP, or SVG file",
        variant: "destructive"
      });
      return;
    }

    if (type === 'logo') {
      updateData({ companyLogo: file });
    } else {
      updateData({ adminPhoto: file });
    }

    toast({
      title: "File uploaded",
      description: "File will be converted to WebP format automatically"
    });
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to complete setup');
      }

      const result = await response.json();
      
      toast({
        title: "Welcome to PaidIn!",
        description: "Your company has been set up successfully"
      });
      
      // Redirect to login page with success message
      setLocation('/auth?message=setup-complete');
    } catch (error) {
      console.error('Onboarding completion error:', error);
      toast({
        title: "Setup failed",
        description: error instanceof Error ? error.message : "Please try again or contact support",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => {
    const selectedTeamSize = TEAM_SIZES.find(size => size.value === data.teamSize);
    const isCustomIndustry = data.industry === 'other';
    
    return (
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 flex items-center justify-center mx-auto animate-pulse">
            <img 
              src="/paidin - logos/Logo Designs (Transparent)/paidin-icon-logo.png" 
              alt="PaidIn Logo" 
              className="w-12 h-12 object-contain"
            />
          </div>
          <h2 className="text-xl font-bold animate-fade-in">
            Welcome to Paid<span className="text-orange-500">In</span>!
          </h2>
          <p className="text-sm text-muted-foreground animate-fade-in-delay">Let's set up your company profile</p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="companyName" className="text-sm">Company Name *</Label>
            <Input
              id="companyName"
              value={data.companyName}
              onChange={(e) => updateData({ companyName: e.target.value })}
              placeholder="Enter your company name"
              className="text-base transition-all duration-200 focus:scale-105"
            />
            {data.companyName && (
              <div className="text-xs text-muted-foreground">
                Preview: <span className="font-medium">{data.companyName}</span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="companyDomain" className="text-sm">Company Domain</Label>
            <Input
              id="companyDomain"
              value={data.companyDomain}
              onChange={(e) => updateData({ companyDomain: e.target.value })}
              placeholder="yourcompany.com"
              className="text-base"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm">Industry *</Label>
            <Select value={data.industry} onValueChange={(value) => updateData({ industry: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select your industry" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((industry) => (
                  <SelectItem key={industry.value} value={industry.value}>
                    <span className="flex items-center gap-2">
                      <span>{industry.icon}</span>
                      {industry.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isCustomIndustry && (
              <Input
                value={data.customIndustry || ''}
                onChange={(e) => updateData({ customIndustry: e.target.value })}
                placeholder="Specify your industry"
                className="text-base mt-2"
              />
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-sm">Team Size *</Label>
            <Select value={data.teamSize} onValueChange={(value) => updateData({ teamSize: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select team size" />
              </SelectTrigger>
              <SelectContent>
                {TEAM_SIZES.map((size) => (
                  <SelectItem key={size.value} value={size.value}>
                    <div className="flex items-center justify-between w-full">
                      <span>{size.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {size.tier === 'starter' && 'Starter'}
                        {size.tier === 'professional' && 'Growth'}
                        {size.tier === 'enterprise' && 'Scale'}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTeamSize && (
              <div className="text-xs text-muted-foreground">
                Recommended plan: <span className="font-medium">
                  {selectedTeamSize.tier === 'starter' && 'Starter'}
                  {selectedTeamSize.tier === 'professional' && 'Growth'}
                  {selectedTeamSize.tier === 'enterprise' && 'Scale'}
                </span>
                {selectedTeamSize.tier === 'starter' && ' (up to 10 employees)'}
                {selectedTeamSize.tier === 'professional' && ' (up to 50 employees)'}
                {selectedTeamSize.tier === 'enterprise' && ' (unlimited employees)'}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-sm">Currency Preference</Label>
            <div className="flex gap-2">
              <Button
                variant={data.currencyPreference === 'USD' ? 'default' : 'outline'}
                onClick={() => updateData({ currencyPreference: 'USD' })}
                className="flex-1 transition-all duration-200 hover:scale-105 text-sm"
              >
                USD
              </Button>
              <Button
                variant={data.currencyPreference === 'BTC' ? 'default' : 'outline'}
                onClick={() => updateData({ currencyPreference: 'BTC' })}
                className="flex-1 transition-all duration-200 hover:scale-105 text-sm"
              >
                <Bitcoin className="h-3 w-3 mr-1" />
                BTC
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
          <User className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold">Create Admin Account</h2>
        <p className="text-muted-foreground">Set up your administrator profile</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="adminName">Full Name *</Label>
          <Input
            id="adminName"
            value={data.adminName}
            onChange={(e) => updateData({ adminName: e.target.value })}
            placeholder="Enter your full name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="adminEmail">Email Address *</Label>
          <Input
            id="adminEmail"
            type="email"
            value={data.adminEmail}
            onChange={(e) => updateData({ adminEmail: e.target.value })}
            placeholder="admin@yourcompany.com"
            className={emailError ? 'border-red-500 focus:border-red-500' : ''}
          />
          {emailError && (
            <p className="text-xs text-red-500">{emailError}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="adminPassword">Password *</Label>
          <div className="relative">
            <Input
              id="adminPassword"
              type={showPassword ? 'text' : 'password'}
              value={data.adminPassword}
              onChange={(e) => updateData({ adminPassword: e.target.value })}
              placeholder="Create a strong password"
              className={passwordStrength.score < 4 && data.adminPassword ? 'border-red-500 focus:border-red-500' : ''}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          
          {/* Password Strength Indicator */}
          {data.adminPassword && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Password strength:</span>
                <Badge 
                  variant={passwordStrength.score >= 4 ? 'default' : passwordStrength.score >= 2 ? 'secondary' : 'destructive'}
                  className="text-xs"
                >
                  {passwordStrength.feedback}
                </Badge>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    passwordStrength.score >= 4 ? 'bg-green-500' : 
                    passwordStrength.score >= 2 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                />
              </div>
              
              {/* Requirements Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
                <div className={`flex items-center gap-2 ${passwordStrength.requirements.length ? 'text-green-600' : 'text-red-500'}`}>
                  <span>{passwordStrength.requirements.length ? '✓' : '✗'}</span>
                  <span>At least 8 characters</span>
                </div>
                <div className={`flex items-center gap-2 ${passwordStrength.requirements.uppercase ? 'text-green-600' : 'text-red-500'}`}>
                  <span>{passwordStrength.requirements.uppercase ? '✓' : '✗'}</span>
                  <span>One uppercase letter</span>
                </div>
                <div className={`flex items-center gap-2 ${passwordStrength.requirements.lowercase ? 'text-green-600' : 'text-red-500'}`}>
                  <span>{passwordStrength.requirements.lowercase ? '✓' : '✗'}</span>
                  <span>One lowercase letter</span>
                </div>
                <div className={`flex items-center gap-2 ${passwordStrength.requirements.number ? 'text-green-600' : 'text-red-500'}`}>
                  <span>{passwordStrength.requirements.number ? '✓' : '✗'}</span>
                  <span>One number</span>
                </div>
                <div className={`flex items-center gap-2 ${passwordStrength.requirements.special ? 'text-green-600' : 'text-red-500'}`}>
                  <span>{passwordStrength.requirements.special ? '✓' : '✗'}</span>
                  <span>One special character</span>
                </div>
              </div>
              
              {!Object.values(passwordStrength.requirements).every(Boolean) && (
                <p className="text-xs text-red-500">
                  All password requirements must be met to continue
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Profile Photo (Optional)</Label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
              {data.adminPhoto ? (
                <img
                  src={URL.createObjectURL(data.adminPhoto)}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-slate-400" />
              )}
            </div>
            <div className="flex-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => photoInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Photo
              </Button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'photo');
                }}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Max 5MB. Will be converted to WebP format.
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto">
          <Palette className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold">Company Branding</h2>
        <p className="text-muted-foreground">Customize your company's visual identity</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Company Logo *</Label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300">
              {data.companyLogo ? (
                <img
                  src={URL.createObjectURL(data.companyLogo)}
                  alt="Logo"
                  className="w-20 h-20 rounded-lg object-cover"
                />
              ) : (
                <Upload className="h-8 w-8 text-slate-400" />
              )}
            </div>
            <div className="flex-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => logoInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Logo
              </Button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'logo');
                }}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Recommended: 200x200px, max 5MB. Will be converted to WebP format.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Primary Color</Label>
          <div className="grid grid-cols-3 gap-2">
            {COLORS.map((color) => (
              <Button
                key={color.value}
                type="button"
                variant={data.primaryColor === color.value ? 'default' : 'outline'}
                onClick={() => updateData({ primaryColor: color.value })}
                className="h-12 flex flex-col items-center justify-center gap-1 transition-all duration-200 hover:scale-105"
              >
                <div className={`w-4 h-4 rounded-full ${color.class} transition-all duration-200`} />
                <span className="text-xs">{color.name}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyDescription">Company Description</Label>
          <Textarea
            id="companyDescription"
            value={data.companyDescription}
            onChange={(e) => updateData({ companyDescription: e.target.value })}
            placeholder="Brief description of your company..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location (Optional)</Label>
          <Input
            id="location"
            value={data.location}
            onChange={(e) => updateData({ location: e.target.value })}
            placeholder="City, State, Country"
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto">
          <Bitcoin className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold">Bitcoin Configuration</h2>
        <p className="text-muted-foreground">Set up your Bitcoin payment preferences</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="btcWalletAddress">Bitcoin Wallet Address</Label>
          <Input
            id="btcWalletAddress"
            value={data.btcWalletAddress}
            onChange={(e) => updateData({ btcWalletAddress: e.target.value })}
            placeholder="Enter your Bitcoin wallet address"
          />
          <p className="text-xs text-muted-foreground">
            This will be used for receiving Bitcoin payments
          </p>
        </div>

        <div className="space-y-2">
          <Label>Lightning Network</Label>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="lightningEnabled"
              checked={data.lightningEnabled}
              onChange={(e) => updateData({ lightningEnabled: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="lightningEnabled" className="text-sm">
              Enable Lightning Network for faster payments
            </Label>
          </div>
        </div>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-orange-500" />
              Bitcoin Education
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Learn about Bitcoin payments, Lightning Network, and how to use PaidIn effectively.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Understanding Bitcoin payments</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Lightning Network benefits</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>PaidIn features overview</span>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              <Play className="h-4 w-4 mr-2" />
              Start Learning
            </Button>
            <Button 
              variant="ghost" 
              onClick={handleSkip}
              className="w-full text-sm text-muted-foreground"
            >
              <SkipForward className="h-4 w-4 mr-2" />
              Skip this step
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
          <Users className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold">Team Setup</h2>
        <p className="text-muted-foreground">Add your first team members (optional)</p>
      </div>

      <div className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            You can add up to 5 team members now. You can invite more later from your dashboard.
          </p>
        </div>

        <div className="space-y-3">
          {data.employees.map((employee, index) => (
            <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
              <div className="flex-1 grid grid-cols-3 gap-2">
                <Input
                  placeholder="Name"
                  value={employee.name}
                  onChange={(e) => {
                    const newEmployees = [...data.employees];
                    newEmployees[index].name = e.target.value;
                    updateData({ employees: newEmployees });
                  }}
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={employee.email}
                  onChange={(e) => {
                    const newEmployees = [...data.employees];
                    newEmployees[index].email = e.target.value;
                    updateData({ employees: newEmployees });
                  }}
                />
                <Select
                  value={employee.role}
                  onValueChange={(value) => {
                    const newEmployees = [...data.employees];
                    newEmployees[index].role = value;
                    updateData({ employees: newEmployees });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newEmployees = data.employees.filter((_, i) => i !== index);
                  updateData({ employees: newEmployees });
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const newEmployees = [...data.employees, { name: '', email: '', role: 'employee' }];
            updateData({ employees: newEmployees });
          }}
          disabled={data.employees.length >= 5}
          className="w-full"
        >
          <Users className="h-4 w-4 mr-2" />
          {data.employees.length >= 5 ? 'Limit reached (5 members)' : 'Add Team Member'}
        </Button>
        
        {data.employees.length >= 5 && (
          <p className="text-xs text-muted-foreground text-center">
            You've reached the onboarding limit. Invite more team members from your dashboard after setup.
          </p>
        )}
      </div>
    </div>
  );

  const renderStep6 = () => {
    const toggleFeature = (featureId: string) => {
      const newFeatures = data.selectedFeatures.includes(featureId)
        ? data.selectedFeatures.filter(id => id !== featureId)
        : [...data.selectedFeatures, featureId];
      updateData({ selectedFeatures: newFeatures });
    };

    const toggleCategory = (categoryId: string) => {
      const category = FEATURE_CATEGORIES.find(c => c.id === categoryId);
      if (!category) return;

      const categoryFeatureIds = category.features.map(f => f.id);
      const allCategoryFeaturesSelected = categoryFeatureIds.every(id => data.selectedFeatures.includes(id));
      
      if (allCategoryFeaturesSelected) {
        // Remove all features from this category
        const newFeatures = data.selectedFeatures.filter(id => !categoryFeatureIds.includes(id));
        updateData({ selectedFeatures: newFeatures });
      } else {
        // Add all features from this category
        const newFeatures = [...new Set([...data.selectedFeatures, ...categoryFeatureIds])];
        updateData({ selectedFeatures: newFeatures });
      }
    };

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center mx-auto">
            <Target className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold">Choose Your Features</h2>
          <p className="text-muted-foreground">Select the features you want to enable for your company</p>
        </div>

        <div className="space-y-4">
          {FEATURE_CATEGORIES.map((category) => (
            <Card key={category.id} className={category.alwaysIncluded ? 'border-green-200 bg-green-50' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.icon}</span>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {category.name}
                        {category.alwaysIncluded && (
                          <Badge variant="secondary" className="text-xs">Always Included</Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                  </div>
                  {!category.alwaysIncluded && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleCategory(category.id)}
                      className="text-xs"
                    >
                      {category.features.every(f => data.selectedFeatures.includes(f.id)) ? 'Deselect All' : 'Select All'}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3">
                  {category.features.map((feature) => {
                    const isSelected = data.selectedFeatures.includes(feature.id);
                    const isDisabled = category.alwaysIncluded;
                    
                    return (
                      <div
                        key={feature.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'border-orange-200 bg-orange-50' 
                            : isDisabled
                            ? 'border-green-200 bg-green-50 cursor-not-allowed opacity-75'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                        onClick={() => !isDisabled && toggleFeature(feature.id)}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected || isDisabled
                            ? 'border-orange-500 bg-orange-500'
                            : 'border-slate-300'
                        }`}>
                          {(isSelected || isDisabled) && (
                            <CheckCircle className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{feature.name}</span>
                            {isDisabled && (
                              <Badge variant="secondary" className="text-xs">Included</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            You can always change these settings later from your dashboard.
          </p>
        </div>
      </div>
    );
  };

  const renderStep7 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold">You're All Set!</h2>
        <p className="text-muted-foreground">Review your settings and launch your dashboard</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Company Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Company:</span>
                <p className="text-muted-foreground">{data.companyName}</p>
              </div>
              <div>
                <span className="font-medium">Industry:</span>
                <p className="text-muted-foreground">
                  {INDUSTRIES.find(i => i.value === data.industry)?.label}
                </p>
              </div>
              <div>
                <span className="font-medium">Team Size:</span>
                <p className="text-muted-foreground">{data.teamSize} employees</p>
              </div>
              <div>
                <span className="font-medium">Currency:</span>
                <p className="text-muted-foreground">{data.currencyPreference}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Admin Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Name:</span>
                <p className="text-muted-foreground">{data.adminName}</p>
              </div>
              <div>
                <span className="font-medium">Email:</span>
                <p className="text-muted-foreground">{data.adminEmail}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Selected Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {FEATURE_CATEGORIES.map((category) => {
                const selectedCategoryFeatures = category.features.filter(f => 
                  data.selectedFeatures.includes(f.id) || category.alwaysIncluded
                );
                
                if (selectedCategoryFeatures.length === 0) return null;
                
                return (
                  <div key={category.id} className="p-2 bg-slate-50 rounded border">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{category.icon}</span>
                      <span className="font-medium text-sm">{category.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {selectedCategoryFeatures.map(f => f.name).join(', ')}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              Team Invitations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.employees.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground">
                  You've added {data.employees.length} team member{data.employees.length !== 1 ? 's' : ''} to invite:
                </p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {data.employees.map((employee, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                      <div>
                        <span className="font-medium">{employee.name || 'Unnamed'}</span>
                        <span className="text-muted-foreground ml-2">({employee.email || 'No email'})</span>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {employee.role}
                      </span>
                    </div>
                  ))}
                </div>
                <Button 
                  onClick={handleComplete}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending Invitations...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm & Send Invitations
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  No team members added. You can invite employees later from your dashboard.
                </p>
                <Button 
                  onClick={handleComplete}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Completing Setup...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete Setup
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      case 7: return renderStep7();
      default: return renderStep1();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div ref={containerRef} className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2 transition-all duration-500 ease-out" />
        </div>

        {/* Main Content with Horizontal Navigation */}
        <div className="flex items-center gap-4">
          {/* Previous Button */}
          <div className="flex-shrink-0">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center gap-2 w-20 h-20 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>

          {/* Form Content */}
          <Card className="shadow-lg flex-1">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className={`transition-all duration-300 ease-in-out ${isTransitioning ? 'opacity-0 transform translate-x-4' : 'opacity-100 transform translate-x-0'}`}>
                {renderStep()}
              </div>
            </CardContent>
          </Card>

          {/* Next Button */}
          <div className="flex-shrink-0">
            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center gap-2 w-20 h-20 rounded-full"
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={isLoading}
                className="flex items-center gap-2 w-20 h-20 rounded-full"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <CheckCircle className="h-5 w-5" />
                )}
              </Button>
            )}
          </div>
        </div>


        {/* Mobile Swipe Hint */}
        <div className="mt-4 text-center sm:hidden">
          <p className="text-xs text-muted-foreground">
            💡 Swipe left/right to navigate between steps
          </p>
        </div>
      </div>
    </div>
  );
}
