interface PaidinLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon';
  className?: string;
}

export function PaidinLogo({ size = 'md', variant = 'full', className = '' }: PaidinLogoProps) {
  const sizes = {
    sm: { width: 120, height: 36, fontSize: 16 },
    md: { width: 160, height: 48, fontSize: 20 },
    lg: { width: 200, height: 60, fontSize: 24 }
  };

  const iconSizes = {
    sm: { width: 32, height: 32 },
    md: { width: 40, height: 40 },
    lg: { width: 48, height: 48 }
  };

  if (variant === 'icon') {
    const iconSize = iconSizes[size];
    return (
      <svg 
        width={iconSize.width} 
        height={iconSize.height} 
        viewBox="0 0 64 64" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <defs>
          <linearGradient id="orangeGradientIcon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor: '#f97316', stopOpacity: 1}} />
            <stop offset="100%" style={{stopColor: '#ea580c', stopOpacity: 1}} />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="60" height="60" rx="12" ry="12" fill="url(#orangeGradientIcon)"/>
        <path 
          d="M18 20 Q18 18 20 18 L35 18 Q42 18 42 25 Q42 32 35 32 L25 32 L25 45 Q25 47 23 47 Q21 47 21 45 L21 22 Q21 20 23 20 Z M25 23 L25 28 L33 28 Q37 28 37 25.5 Q37 23 33 23 Z" 
          fill="white" 
          stroke="rgba(255,255,255,0.1)" 
          strokeWidth="0.5"
        />
      </svg>
    );
  }

  const logoSize = sizes[size];
  return (
    <svg 
      width={logoSize.width} 
      height={logoSize.height} 
      viewBox="0 0 200 60" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="orangeGradientFull" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor: '#f97316', stopOpacity: 1}} />
          <stop offset="100%" style={{stopColor: '#ea580c', stopOpacity: 1}} />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="196" height="56" rx="12" ry="12" fill="url(#orangeGradientFull)" stroke="#d97706" strokeWidth="1"/>
      <text x="100" y="38" fontFamily="Arial, sans-serif" fontSize={logoSize.fontSize} fontWeight="bold" textAnchor="middle" fill="white">
        <tspan>Paid</tspan><tspan fill="#fef3c7">In</tspan>
      </text>
      <circle cx="175" cy="15" r="8" fill="rgba(255,255,255,0.2)"/>
      <text x="175" y="19" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" textAnchor="middle" fill="white">₿</text>
    </svg>
  );
}