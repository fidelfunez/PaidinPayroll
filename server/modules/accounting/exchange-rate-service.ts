import { db } from "../../db.js";
import { exchangeRates } from "@shared/schema";
import { eq, and, gte, lte } from "drizzle-orm";

/**
 * Exchange Rate Service
 * Handles fetching and caching BTC/USD exchange rates from CoinGecko
 */

// Rate limiting configuration
const RATE_LIMIT_DELAY_MS = 1200; // ~50 calls/minute for free tier
let lastApiCall = 0;

/**
 * Normalize date to midnight UTC for consistent caching
 */
function normalizeDate(date: Date): Date {
  const normalized = new Date(date);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized;
}

/**
 * Format date for CoinGecko API (dd-mm-yyyy)
 */
function formatDateForCoinGecko(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Rate limit API calls to respect CoinGecko free tier limits
 */
async function rateLimitedFetch(url: string, headers?: HeadersInit): Promise<Response> {
  const now = Date.now();
  const timeSinceLastCall = now - lastApiCall;
  
  if (timeSinceLastCall < RATE_LIMIT_DELAY_MS) {
    const delay = RATE_LIMIT_DELAY_MS - timeSinceLastCall;
    console.log(`⏱️  Rate limiting: waiting ${delay}ms before API call`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  lastApiCall = Date.now();
  return fetch(url, { headers });
}

/**
 * Fetch BTC/USD rate from CoinGecko for a specific date
 * Free tier only has current prices, so we use Coinbase API for historical data
 */
async function fetchRateFromCoinGecko(date: Date): Promise<number> {
  const dateStr = date.toISOString().split('T')[0];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const isToday = date.getTime() === today.getTime();
  
  console.log(`📡 Fetching rate for ${dateStr}...`);
  
  // For today, use CoinGecko's simple/price endpoint (free tier)
  if (isToday) {
    const apiKey = process.env.COINGECKO_API_KEY;
    let url = `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd`;
    if (apiKey) {
      url += `&x_cg_demo_api_key=${apiKey}`;
    }
    
    const response = await rateLimitedFetch(url);
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    const data = await response.json();
    const rate = data?.bitcoin?.usd;
    if (!rate) throw new Error('Invalid rate data');
    console.log(`✅ Fetched current rate: $${rate.toFixed(2)}`);
    return rate;
  }
  
  // For historical dates, use Coinbase API (no auth required)
  const url = `https://api.coinbase.com/v2/prices/BTC-USD/spot?date=${dateStr}`;
  console.log(`📡 Fetching historical rate from Coinbase for ${dateStr}...`);
  
  try {
    const response = await rateLimitedFetch(url);
    
    if (!response.ok) {
      throw new Error(`Coinbase API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Coinbase response: { data: { amount: "42587.32" } }
    const rateStr = data?.data?.amount;
    
    if (!rateStr) {
      throw new Error('Invalid rate data from Coinbase');
    }
    
    const rate = parseFloat(rateStr);
    
    if (isNaN(rate)) {
      throw new Error('Could not parse rate from Coinbase');
    }
    
    console.log(`✅ Fetched historical rate: $${rate.toFixed(2)}`);
    return rate;
    
  } catch (error: any) {
    console.error(`❌ Error fetching rate:`, error.message);
    throw error;
  }
}

/**
 * Get BTC/USD exchange rate for a specific date with caching
 * 
 * @param date - The date to get the exchange rate for
 * @returns Promise<number> - The BTC/USD rate
 * 
 * Algorithm:
 * 1. Normalize date to midnight UTC
 * 2. Check cache (exchange_rates table)
 * 3. If cached, return it
 * 4. If not cached, fetch from CoinGecko
 * 5. Cache the result
 * 6. Return the rate
 */
export async function getExchangeRate(date: Date): Promise<number> {
  const normalizedDate = normalizeDate(date);
  
  console.log(`\n🔍 Getting exchange rate for ${normalizedDate.toISOString().split('T')[0]}`);
  
  // Check cache first - Drizzle expects Date object with mode: 'timestamp'
  const cached = await db
    .select()
    .from(exchangeRates)
    .where(
      and(
        eq(exchangeRates.source, 'coingecko'),
        eq(exchangeRates.currency, 'USD'),
        eq(exchangeRates.timestamp, normalizedDate)
      )
    )
    .limit(1);
  
  if (cached.length > 0) {
    console.log(`💾 Cache hit! Rate: $${cached[0].rate.toFixed(2)}`);
    return cached[0].rate;
  }
  
  console.log(`❌ Cache miss - fetching from API...`);
  
  // Not in cache, fetch from API
  const rate = await fetchRateFromCoinGecko(normalizedDate);
  
  // Cache the result - Drizzle expects Date objects with mode: 'timestamp'
  await db.insert(exchangeRates).values({
    source: 'coingecko',
    currency: 'USD',
    rate,
    timestamp: normalizedDate,
    createdAt: new Date(),
  });
  
  console.log(`💾 Cached rate for future use`);
  
  return rate;
}

/**
 * Batch fetch exchange rates for multiple dates
 * Useful when importing many transactions at once
 * 
 * @param dates - Array of dates to fetch rates for
 * @returns Promise<Map<string, number>> - Map of date string to rate
 */
export async function batchGetExchangeRates(dates: Date[]): Promise<Map<string, number>> {
  // Normalize and deduplicate dates by converting to ISO date strings
  const uniqueDateStrings = Array.from(new Set(dates.map(d => normalizeDate(d).toISOString().split('T')[0])));
  const uniqueDates = uniqueDateStrings.map(dateStr => normalizeDate(new Date(dateStr)));
  
  console.log(`\n📊 Batch fetching rates for ${uniqueDates.length} unique dates...`);
  
  const rateMap = new Map<string, number>();
  
  for (const date of uniqueDates) {
    const dateKey = date.toISOString().split('T')[0];
    try {
      const rate = await getExchangeRate(date);
      rateMap.set(dateKey, rate);
    } catch (error: any) {
      console.error(`Failed to get rate for ${dateKey}:`, error.message);
      // Continue with other dates even if one fails
    }
  }
  
  console.log(`✅ Successfully fetched ${rateMap.size} rates`);
  
  return rateMap;
}

/**
 * Get the current BTC/USD rate (for today)
 */
export async function getCurrentRate(): Promise<number> {
  return getExchangeRate(new Date());
}
