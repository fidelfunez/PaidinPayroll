import { useAuth } from "@/hooks/use-auth";

interface HeaderProps {
  title: string;
  subtitle?: string;
  btcRate?: number;
}

export function Header({ title, subtitle, btcRate }: HeaderProps) {
  const { user } = useAuth();
  
  const formatUsd = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '$0.00';
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Use company's primary color or default to orange
  const primaryColor = user?.company?.primaryColor || '#f97316';

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg"
            style={{ backgroundColor: primaryColor }}
          >
            <span className="text-xl font-bold text-white">₿</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-muted-foreground mt-1">{subtitle}</p>
            )}
            {user?.company && (
              <p className="text-sm text-muted-foreground mt-1">
                {user.company.name}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Current BTC Rate</div>
            <div className="font-semibold text-foreground">
              {btcRate ? formatUsd(btcRate) : 'Loading...'}
            </div>
          </div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Real-time rates active"></div>
        </div>
      </div>
    </header>
  );
}
