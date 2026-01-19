# PaidIn Accounting - Startup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Database
```bash
# Apply the new accounting schema
npm run db:push
```

This will create all the new accounting tables:
- `wallets`
- `transactions`
- `categories`
- `purchases`
- `transaction_lots`
- `exchange_rates`

### 3. Start Development Server
```bash
npm run dev
```

The server will start on `http://localhost:8080` and the frontend will be available at `http://localhost:5173`.

### 4. Test the API

#### Health Check
```bash
curl http://localhost:8080/api/health
```

#### Get Current BTC Rate
```bash
curl http://localhost:8080/api/accounting/rates/current
```

#### Create a Test Category
```bash
curl -X POST http://localhost:8080/api/accounting/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Contractor Payments",
    "categoryType": "expense",
    "quickbooksAccount": "Operating Expenses"
  }'
```

## Expected Output

When you run `npm run dev`, you should see:

```
✅ Database migrations completed successfully
✅ PaidIn Accounting Server running on port 8080
📁 Database path: /path/to/paidin.db
🌍 Environment: development
🔐 CORS allowed origins: http://localhost:5173, http://localhost:3000, ...

📊 Accounting API endpoints:
  - GET  /api/accounting/wallets
  - POST /api/accounting/wallets
  - GET  /api/accounting/transactions
  - POST /api/accounting/transactions/import
  - GET  /api/accounting/categories
  - POST /api/accounting/categories
  - GET  /api/accounting/export/quickbooks
  - GET  /api/accounting/rates/current

🚀 Ready to accept connections!
```

## Troubleshooting

### "Module not found" errors
If you see errors about missing modules, check:
- `server/index.ts` - should only import core modules + accounting routes
- `server/modules/routes.ts` - should only register auth and accounting routes
- Ensure all dependencies are installed: `npm install`

### Database migration errors
If migrations fail, you can manually reset the database:
```bash
rm paidin.db
npm run db:push
```

### Port already in use
If port 8080 is in use:
```bash
# Find and kill the process
lsof -ti:8080 | xargs kill -9

# Or change the port in .env
echo "PORT=3001" >> .env
```

## Next Steps

1. **Test Auth Flow**
   - Visit `http://localhost:5173/auth`
   - Create an account
   - Log in

2. **Test Accounting Features**
   - Add a wallet
   - Import transactions (manually for now)
   - Categorize transactions
   - Export to QuickBooks

3. **Integrate with Bitcoin APIs**
   - Implement xpub parsing
   - Fetch transaction history from Blockstream/Mempool.space
   - Implement automatic transaction import

## Environment Variables

Create a `.env` file in the project root:

```env
# Server
PORT=8080
NODE_ENV=development

# Session
SESSION_SECRET=your-secret-key-change-this-in-production

# Database
# (Uses SQLite by default - paidin.db in project root)

# Optional: CoinGecko API
# COINGECKO_API_KEY=your-api-key (free tier works)
```

## API Documentation

### Wallets

**GET /api/accounting/wallets**
- Returns all wallets for the authenticated user's company
- Requires authentication

**POST /api/accounting/wallets**
- Create a new wallet
- Body: `{ walletType: "on-chain" | "lightning", walletData: {...}, name: string }`

### Transactions

**GET /api/accounting/transactions**
- Returns all transactions for the authenticated user's company
- Sorted by timestamp (newest first)

**POST /api/accounting/transactions/import**
- Import transactions for a wallet
- Body: `{ walletId: number, transactionsData: [...] }`

**PATCH /api/accounting/transactions/:id**
- Update a transaction (categorize, add notes)
- Body: `{ categoryId?: number, notes?: string, counterparty?: string }`

### Categories

**GET /api/accounting/categories**
- Returns all categories for the authenticated user's company

**POST /api/accounting/categories**
- Create a new category
- Body: `{ name: string, categoryType: "income" | "expense" | "asset" | "liability", quickbooksAccount?: string }`

### Export

**GET /api/accounting/export/quickbooks**
- Generate QuickBooks CSV export
- Downloads a CSV file with all categorized transactions

### Exchange Rates

**GET /api/accounting/rates/current**
- Fetch current BTC/USD rate from CoinGecko
- Caches the rate in the database

**GET /api/accounting/rates/historical**
- Get historical exchange rates
- Query params: `from` (timestamp), `to` (timestamp)

---

**Ready to build! 🚀**
