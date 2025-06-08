import { PaidinLogo } from "@/components/ui/paidin-logo";

interface HeaderProps {
  title: string;
  subtitle?: string;
  btcRate?: number;
}

export function Header({ title, subtitle, btcRate }: HeaderProps) {
  const formatUsd = (amount: number) => 
    `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <PaidinLogo variant="icon" size="sm" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-muted-foreground mt-1">{subtitle}</p>
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
