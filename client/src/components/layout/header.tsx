import { useAuth } from "@/hooks/use-auth";
import { useBtcRate } from "@/hooks/use-btc-rate-context";

interface HeaderProps {
  title: string;
  subtitle?: string;
  btcRate?: number; // Optional prop for backwards compatibility
}

export function Header({ title, subtitle, btcRate: propBtcRate }: HeaderProps) {
  const { user } = useAuth();
  const { rate: contextBtcRate, isLoading } = useBtcRate();
  
  // Use prop if provided, otherwise use context
  const btcRate = propBtcRate ?? contextBtcRate ?? null;
  
  const formatUsd = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '$0.00';
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-md border-b border-gray-200/80 px-6 py-5 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg"></div>
            <div className="relative w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg border-2 border-primary/50">
              <span className="text-2xl font-bold text-white drop-shadow-lg">₿</span>
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">{title}</h1>
            {subtitle && (
              <div className="flex items-center gap-2 mt-1.5">
                <p className="text-sm text-muted-foreground">{subtitle}</p>
                {user?.company && (
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                    {user.company.name}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4 bg-gray-50/80 rounded-xl px-4 py-2.5 border border-gray-200/50 shadow-sm">
          <div className="text-right">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current BTC Rate</div>
            <div className="font-bold text-lg text-foreground mt-0.5">
              {isLoading ? 'Loading...' : (btcRate ? formatUsd(btcRate) : 'N/A')}
            </div>
          </div>
          <div className="relative">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50" title="Real-time rates active"></div>
            <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
          </div>
        </div>
      </div>
    </header>
  );
}
