// BTC rate polling service - fetches rate from external API and caches it
import { storage } from '../storage';

async function fetchBtcRateFromAPI(): Promise<number> {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true');
    const data = await response.json();
    return data.bitcoin.usd;
  } catch (error) {
    console.error('Failed to fetch BTC rate from API:', error);
    throw error;
  }
}

async function updateBtcRateCache() {
  try {
    const rate = await fetchBtcRateFromAPI();
    await storage.saveBtcRate({
      rate,
      source: 'coingecko',
      timestamp: new Date(),
    });
    console.log(`✅ BTC rate updated: $${rate.toLocaleString()}`);
  } catch (error) {
    console.error('❌ BTC rate update failed (non-critical):', error);
  }
}

export class BtcRatePollingService {
  private static instance: BtcRatePollingService;
  private pollingInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): BtcRatePollingService {
    if (!BtcRatePollingService.instance) {
      BtcRatePollingService.instance = new BtcRatePollingService();
    }
    return BtcRatePollingService.instance;
  }

  startPolling() {
    if (this.pollingInterval) {
      return; // Already polling
    }

    // Update BTC rate every 5 minutes (to avoid hitting API limits)
    this.pollingInterval = setInterval(async () => {
      await updateBtcRateCache();
    }, 5 * 60 * 1000); // Every 5 minutes
    
    // Run immediately on start
    updateBtcRateCache().catch(error => {
      console.error('Initial BTC rate update error:', error);
    });

    console.log('✅ BTC rate polling service initialized (updates every 5 minutes)');
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
}

export const btcRatePolling = BtcRatePollingService.getInstance();
