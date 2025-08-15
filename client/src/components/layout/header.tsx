import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";

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

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-xl font-bold text-white">₿</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            {subtitle && (
              <div className="flex items-center gap-2 mt-1">
                <p className="text-muted-foreground">{subtitle}</p>
                {user?.company && (
                  <Badge 
                    variant="outline" 
                    className="text-xs px-2 py-0.5"
                    style={{ borderColor: '#f97316', color: '#f97316' }}
                  >
                    {user.company.name}
                  </Badge>
                )}
              </div>
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
