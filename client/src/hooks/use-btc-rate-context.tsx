import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface BtcRateContextType {
  currentRate: number | null;
  isLoading: boolean;
  lastUpdated: Date | null;
  updateRate: (rate: number) => void;
  setLoading: (loading: boolean) => void;
}

const BtcRateContext = createContext<BtcRateContextType | undefined>(undefined);

interface BtcRateProviderProps {
  children: ReactNode;
}

export function BtcRateProvider({ children }: BtcRateProviderProps) {
  const [currentRate, setCurrentRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const updateRate = useCallback((rate: number) => {
    setCurrentRate(rate);
    setLastUpdated(new Date());
    setIsLoading(false);
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const value = {
    currentRate,
    isLoading,
    lastUpdated,
    updateRate,
    setLoading,
  };

  return (
    <BtcRateContext.Provider value={value}>
      {children}
    </BtcRateContext.Provider>
  );
}

export function useBtcRateContext() {
  const context = useContext(BtcRateContext);
  if (context === undefined) {
    throw new Error('useBtcRateContext must be used within a BtcRateProvider');
  }
  return context;
}

// Convenience hook for consumers (pages that just need the rate)
export function useBtcRate() {
  const { currentRate, isLoading, lastUpdated } = useBtcRateContext();
  return {
    rate: currentRate,
    isLoading,
    lastUpdated,
  };
}

// Hook for providers (dashboard that updates the rate)
export function useBtcRateProvider() {
  const { currentRate, isLoading, lastUpdated, updateRate, setLoading } = useBtcRateContext();
  return {
    currentRate,
    isLoading,
    lastUpdated,
    updateRate,
    setLoading,
  };
}
