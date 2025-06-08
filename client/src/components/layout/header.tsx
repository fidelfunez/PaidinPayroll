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
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.546z"/>
              <path d="M18.27 11.26c.249-1.67-.999-2.567-2.694-3.166l.55-2.205-1.344-.335-.536 2.148c-.353-.088-.715-.171-1.076-.253l.54-2.165-1.343-.335-.55 2.205c-.292-.067-.578-.132-.857-.2l.002-.007-1.853-.462-.357 1.434s.999.229.978.243c.545.136.644.496.627.782l-.628 2.518c.038.009.087.024.141.046l-.144-.036-.881 3.531c-.067.166-.236.415-.617.32.014.02-.978-.244-.978-.244l-.667 1.537 1.748.435c.325.081.643.166.956.246l-.556 2.23 1.342.335.55-2.205c.367.1.723.192 1.072.281l-.549 2.195 1.344.335.556-2.23c2.29.433 4.014.258 4.741-1.813.586-1.67-.029-2.632-1.234-3.259.878-.203 1.54-.781 1.716-1.976zm-3.068 4.302c-.416 1.668-3.23.766-4.142.54l.739-2.964c.912.228 3.84.679 3.403 2.424zm.416-4.33c-.379 1.518-2.718.747-3.477.558l.67-2.688c.758.189 3.202.543 2.807 2.13z" fill="white"/>
            </svg>
          </div>
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
