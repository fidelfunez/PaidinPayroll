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
    quote: "Bitcoin is peer-to-peer electronic cash that is valuable over legacy systems because of the mathematical proof inherent in the system.",
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
    quote: "In the long run, Bitcoin will be seen as humanity's greatest monetary innovation.",
    author: "Vijay Boyapati",
    tagline: "Enabling sound money for the digital age"
  },
  {
    quote: "Bitcoin gives us, for the first time, a way for one Internet user to transfer a unique piece of digital property to another Internet user.",
    author: "Marc Andreessen",
    tagline: "Redefining digital ownership and exchange"
  }
];

interface BitcoinQuotesContextType {
  currentQuote: typeof bitcoinQuotes[0];
}

const BitcoinQuotesContext = createContext<BitcoinQuotesContextType | null>(null);

export function BitcoinQuotesProvider({ children }: { children: ReactNode }) {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  // Rotate quotes every 30 seconds for testing, then 5 minutes in production
  useEffect(() => {
    const quoteRotationInterval = setInterval(() => {
      setCurrentQuoteIndex((prevIndex) => 
        (prevIndex + 1) % bitcoinQuotes.length
      );
    }, 30000); // 30 seconds for testing

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