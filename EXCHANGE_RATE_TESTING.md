# Exchange Rate Service - Testing Guide

## Overview
The exchange rate service fetches BTC/USD rates using a **hybrid approach**:
- **Current prices**: CoinGecko API (requires free API key)
- **Historical prices**: Coinbase API (no authentication required)

This gives you the best of both worlds - reliable current prices from CoinGecko and completely free historical data from Coinbase!

## Features
✅ **Hybrid API Approach**: CoinGecko for current prices, Coinbase for historical (both free!)
✅ **Smart Caching**: Stores rates in `exchange_rates` table to avoid duplicate API calls
✅ **Rate Limiting**: Automatically throttles requests to respect API limits
✅ **Batch Fetching**: Get multiple dates at once (useful for importing transactions)
✅ **Date Normalization**: All dates normalized to midnight UTC for consistent caching
✅ **Error Handling**: Graceful handling of API errors and rate limits
✅ **No Historical Data Costs**: Historical prices from Coinbase are completely free

## Test Endpoints

### 1. Test Single Date
Get the BTC/USD rate for a specific date:

```bash
# Get rate for January 15, 2024
curl "http://localhost:8080/api/accounting/test-exchange-rate?date=2024-01-15"
```

**Or test in browser:**
```
http://localhost:8080/api/accounting/test-exchange-rate?date=2024-01-15
```

**Response:**
```json
{
  "success": true,
  "date": "2024-01-15",
  "normalizedDate": "2024-01-15",
  "rate": 42587.32,
  "rateFormatted": "$42587.32",
  "source": "coingecko",
  "cached": true
}
```

### 2. Test Batch Dates
Get rates for multiple dates at once:

```bash
# Get rates for 3 dates
curl "http://localhost:8080/api/accounting/test-batch-rates?dates=2024-01-15,2024-01-20,2024-01-25"
```

**Or test in browser:**
```
http://localhost:8080/api/accounting/test-batch-rates?dates=2024-01-15,2024-01-20,2024-01-25
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "rates": [
    {
      "date": "2024-01-15",
      "rate": 42587.32,
      "rateFormatted": "$42587.32"
    },
    {
      "date": "2024-01-20",
      "rate": 40123.45,
      "rateFormatted": "$40123.45"
    },
    {
      "date": "2024-01-25",
      "rate": 39876.54,
      "rateFormatted": "$39876.54"
    }
  ],
  "source": "coingecko"
}
```

### 3. Get Current Rate
Get today's BTC/USD rate:

```bash
curl "http://localhost:8080/api/accounting/rates/current"
```

**Or test in browser:**
```
http://localhost:8080/api/accounting/rates/current
```

## Testing Strategy

### Step 1: Test with a recent date
```
http://localhost:8080/api/accounting/test-exchange-rate?date=2024-01-15
```
**Expected**: First call fetches from API (check server logs), second call uses cache

### Step 2: Test with multiple dates
```
http://localhost:8080/api/accounting/test-batch-rates?dates=2024-01-10,2024-01-11,2024-01-12
```
**Expected**: Should fetch all 3 dates, respecting rate limits (1.2s delay between calls)

### Step 3: Test cache behavior
Call the same date twice:
1. First call: `?date=2024-01-15` - Will show "Cache miss" in server logs
2. Second call: `?date=2024-01-15` - Will show "Cache hit!" in server logs

### Step 4: Test error handling
Try an invalid date:
```
http://localhost:8080/api/accounting/test-exchange-rate?date=invalid
```
**Expected**: Error response with usage instructions

## Server Logs
Watch the server console for detailed logging:

```
🔍 Getting exchange rate for 2024-01-15
❌ Cache miss - fetching from API...
📡 Fetching rate from CoinGecko for 15-01-2024...
✅ Fetched rate: $42587.32
💾 Cached rate for future use
```

Second request for same date:
```
🔍 Getting exchange rate for 2024-01-15
💾 Cache hit! Rate: $42587.32
```

## Using in Your Code

### Import the service
```typescript
import { getExchangeRate, batchGetExchangeRates, getCurrentRate } from "./exchange-rate-service.js";
```

### Get rate for a single date
```typescript
const date = new Date("2024-01-15");
const rate = await getExchangeRate(date);
console.log(`BTC was $${rate.toFixed(2)} on 2024-01-15`);
```

### Get rates for multiple dates (when importing transactions)
```typescript
const transactionDates = [
  new Date("2024-01-15"),
  new Date("2024-01-20"),
  new Date("2024-01-25"),
];

const rateMap = await batchGetExchangeRates(transactionDates);

// Use the rates
for (const [dateStr, rate] of rateMap.entries()) {
  console.log(`${dateStr}: $${rate.toFixed(2)}`);
}
```

## Rate Limiting
- **Free tier limit**: ~50 calls/minute
- **Built-in throttling**: 1.2 second delay between API calls
- **Caching**: Dramatically reduces API calls (only first request hits API)

## Next Steps
Now that exchange rates work, you can:
1. ✅ Connect wallets and fetch transactions
2. ✅ Calculate USD values using these exchange rates
3. ✅ Build cost basis calculation (FIFO)
4. ✅ Generate QuickBooks exports with accurate values

## Troubleshooting

### Rate Limit Errors
If you see `429` errors, the service will automatically wait longer. Consider reducing test frequency.

### Invalid Date Errors
Make sure dates are in `YYYY-MM-DD` format. The service normalizes all dates to midnight UTC.

### Cache Not Working
Check that the `exchange_rates` table exists and is writable. Run `npm run db:push` if needed.
