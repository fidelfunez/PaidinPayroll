# Exchange Rate API Setup Guide

## Hybrid Approach (Best of Both Worlds!)

We use **two free APIs** to get Bitcoin exchange rates:

1. **CoinGecko** (with free API key) - For current/today's BTC price
2. **Coinbase** (no auth required) - For historical BTC prices

This means you get accurate rates completely free! 🎉

## Quick Setup (5 minutes)

### Step 1: Get a Free API Key

1. Go to: https://www.coingecko.com/en/api/pricing
2. Click **"Get Your Free API Key"** under the Demo plan
3. Sign up with your email
4. Verify your email
5. Copy your API key (looks like: `CG-xxxxxxxxxxxxxxxxxxxx`)

**Free Tier Includes:**
- ✅ 10,000 API calls/month
- ✅ Historical price data
- ✅ Perfect for MVP and small businesses

### Step 2: Add API Key to Your Project

1. **Create a `.env` file** in the project root (if it doesn't exist):
   ```bash
   cp .env.example .env
   ```

2. **Add your API key** to `.env`:
   ```bash
   COINGECKO_API_KEY=CG-your-actual-api-key-here
   ```

3. **Restart your server**:
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

### Step 3: Test It

Open in your browser:
```
http://localhost:8080/api/accounting/test-exchange-rate?date=2024-01-15
```

You should see:
```json
{
  "success": true,
  "date": "2024-01-15",
  "rate": 42587.32,
  "rateFormatted": "$42587.32",
  "source": "coingecko"
}
```

## Troubleshooting

### Still Getting 401 Error?
- Make sure you restarted the server after adding the API key
- Check that your `.env` file is in the project root (same folder as `package.json`)
- Verify your API key is correct (no extra spaces)
- Make sure the `.env` file line is: `COINGECKO_API_KEY=CG-your-key` (no quotes)

### Rate Limit Errors (429)?
- Free tier: 10,000 calls/month
- Our caching system minimizes API calls (only first request hits API)
- Consider upgrading to Pro tier if needed ($4.99/month, 30,000 calls)

### "Invalid rate data" Error?
- The date might be too far in the past (CoinGecko has limited historical data)
- Try a more recent date (within last few years)

## Security Note

**Never commit your `.env` file to git!**

The `.env` file is already in `.gitignore`. Your API key should remain private.

## Cost Estimate

For typical usage:
- **Testing/Development**: 50-100 calls/day = ~1,500-3,000 calls/month (free tier ✅)
- **Small Business (10 transactions/day)**: ~300 calls/month (free tier ✅)
- **Growing Business (50 transactions/day)**: ~1,500 calls/month (free tier ✅)

Thanks to caching, each unique date only hits the API once!

## Next Steps

Once your API key is working:
1. ✅ Test single date: `/api/accounting/test-exchange-rate?date=2024-01-15`
2. ✅ Test batch dates: `/api/accounting/test-batch-rates?dates=2024-01-15,2024-01-20`
3. ✅ Move on to wallet connection and transaction importing!
