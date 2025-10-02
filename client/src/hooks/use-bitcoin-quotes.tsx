import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const bitcoinQuotes = [
  {
    quote: "Running Bitcoin is like planting a tree that will grow to provide shade for our children.",
    author: "Hal Finney",
    tagline: "Building the future of finance, one satoshi at a time"
  },
  {
    quote: "The root problem with conventional currency is all the trust that's required to make it work.",
    author: "Satoshi Nakamoto",
    tagline: "Empowering trustless financial sovereignty"
  },
  {
    quote: "Bitcoin is peer-to-peer electronic cash that derives its value from mathematical proof.",
    author: "Adam Back",
    tagline: "Transforming money through cryptographic proof"
  },
  {
    quote: "Bitcoin is the exit from the modern monetary system, a system that is slowly enslaving us all.",
    author: "Saifedean Ammous",
    tagline: "Breaking free from monetary manipulation"
  },
  {
    quote: "Bitcoin is not just a currency, it's a revolution in how we think about money, property, and human organization.",
    author: "Andreas Antonopoulos",
    tagline: "Revolutionizing human organization through code"
  },
  {
    quote: "Bitcoin is the most honest form of money we've ever had. It cannot be debased, inflated, or manipulated.",
    author: "Michael Saylor",
    tagline: "Preserving purchasing power through digital gold"
  },
  {
    quote: "Bitcoin is the first monetary network that has ever existed that doesn't require trust in a central authority.",
    author: "Jack Mallers",
    tagline: "Building trustless financial infrastructure"
  },
  {
    quote: "Bitcoin changes everything. I don't think there's anything more important in my lifetime to work on.",
    author: "Jack Dorsey",
    tagline: "Dedicated to Bitcoin's revolutionary potential"
  }
];

interface BitcoinQuotesContextType {
  currentQuote: typeof bitcoinQuotes[0];
}

const BitcoinQuotesContext = createContext<BitcoinQuotesContextType | null>(null);

export function BitcoinQuotesProvider({ children }: { children: ReactNode }) {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  // Rotate quotes every 2.5 minutes across entire app session
  useEffect(() => {
    const quoteRotationInterval = setInterval(() => {
      setCurrentQuoteIndex((prevIndex) => 
        (prevIndex + 1) % bitcoinQuotes.length
      );
    }, 150000); // 2.5 minutes

    return () => clearInterval(quoteRotationInterval);
  }, []);

  const currentQuote = bitcoinQuotes[currentQuoteIndex];

  return (
    <BitcoinQuotesContext.Provider value={{ currentQuote }}>
      {children}
    </BitcoinQuotesContext.Provider>
  );
}

export function useBitcoinQuotes() {
  const context = useContext(BitcoinQuotesContext);
  if (!context) {
    throw new Error('useBitcoinQuotes must be used within a BitcoinQuotesProvider');
  }
  return context;
}