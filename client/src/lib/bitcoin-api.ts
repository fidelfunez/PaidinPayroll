interface BtcPriceResponse {
  bitcoin: {
    usd: number;
  };
}

interface BtcRateHistory {
  prices: Array<[number, number]>; // [timestamp, price]
}

class BitcoinApiService {
  private readonly baseUrl = 'https://api.coingecko.com/api/v3';
  
  async getCurrentPrice(): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/simple/price?ids=bitcoin&vs_currencies=usd`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: BtcPriceResponse = await response.json();
      return data.bitcoin.usd;
    } catch (error) {
      console.error('Failed to fetch Bitcoin price:', error);
      throw new Error('Unable to fetch current Bitcoin price. Please try again later.');
    }
  }

  async getPriceHistory(days: number = 7): Promise<Array<{ timestamp: number; price: number }>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/coins/bitcoin/market_chart?vs_currency=usd&days=${days}&interval=daily`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: BtcRateHistory = await response.json();
      
      return data.prices.map(([timestamp, price]) => ({
        timestamp,
        price,
      }));
    } catch (error) {
      console.error('Failed to fetch Bitcoin price history:', error);
      throw new Error('Unable to fetch Bitcoin price history. Please try again later.');
    }
  }

  async getMarketData(): Promise<{
    currentPrice: number;
    priceChange24h: number;
    priceChangePercentage24h: number;
    marketCap: number;
    volume24h: number;
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/coins/bitcoin?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const marketData = data.market_data;
      
      return {
        currentPrice: marketData.current_price.usd,
        priceChange24h: marketData.price_change_24h,
        priceChangePercentage24h: marketData.price_change_percentage_24h,
        marketCap: marketData.market_cap.usd,
        volume24h: marketData.total_volume.usd,
      };
    } catch (error) {
      console.error('Failed to fetch Bitcoin market data:', error);
      throw new Error('Unable to fetch Bitcoin market data. Please try again later.');
    }
  }

  // Utility method to convert USD to BTC
  usdToBtc(usdAmount: number, btcPrice: number): number {
    if (btcPrice <= 0) {
      throw new Error('Invalid Bitcoin price');
    }
    return usdAmount / btcPrice;
  }

  // Utility method to convert BTC to USD
  btcToUsd(btcAmount: number, btcPrice: number): number {
    return btcAmount * btcPrice;
  }

  // Format BTC amount to standard 8 decimal places
  formatBtc(amount: number | undefined): string {
    if (amount === undefined || amount === null) return '0.00000000';
    return amount.toFixed(8);
  }

  // Format USD amount to 2 decimal places with currency symbol
  formatUsd(amount: number | undefined): string {
    if (amount === undefined || amount === null) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  // Calculate the USD equivalent of a BTC amount at current rates
  async getBtcValueInUsd(btcAmount: number): Promise<number> {
    const currentPrice = await this.getCurrentPrice();
    return this.btcToUsd(btcAmount, currentPrice);
  }

  // Calculate the BTC equivalent of a USD amount at current rates
  async getUsdValueInBtc(usdAmount: number): Promise<number> {
    const currentPrice = await this.getCurrentPrice();
    return this.usdToBtc(usdAmount, currentPrice);
  }
}

// Export a singleton instance
export const bitcoinApi = new BitcoinApiService();

// Export the class as well for testing or custom instances
export { BitcoinApiService };

// Export types for use in other files
export type { BtcPriceResponse, BtcRateHistory };
