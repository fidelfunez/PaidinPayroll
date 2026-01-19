# PaidIn Pivot Summary: Bitcoin Accounting for Small Business

## What Was Done

### 1. Database Schema Migration
- **Created new accounting-focused schema** (`shared/schema.ts`)
- **Backed up old schema** to `shared/schema-legacy.ts`
- **New tables:**
  - `wallets` - Track Bitcoin wallets (on-chain, Lightning)
  - `transactions` - All Bitcoin transactions with USD values
  - `categories` - For QuickBooks export mapping
  - `purchases` - Track Bitcoin purchases for cost basis (FIFO)
  - `transaction_lots` - Link transactions to purchase lots for capital gains
  - `exchangeRates` - Cache BTC/USD rates
- **Kept core tables:** `users`, `companies`, `session` (for auth)

### 2. Server Modules
- **Archived old modules** to `/server/legacy/`
- **Created new accounting module** at `/server/modules/accounting/`
- **New API endpoints:**
  - `GET /api/accounting/wallets` - Get all wallets
  - `POST /api/accounting/wallets` - Add new wallet
  - `GET /api/accounting/transactions` - Get all transactions
  - `POST /api/accounting/transactions/import` - Import transactions
  - `PATCH /api/accounting/transactions/:id` - Update transaction
  - `GET /api/accounting/categories` - Get categories
  - `POST /api/accounting/categories` - Create category
  - `GET /api/accounting/export/quickbooks` - Generate CSV export
  - `GET /api/accounting/rates/current` - Get current BTC/USD rate
  - `GET /api/accounting/rates/historical` - Get historical rates

### 3. Client Pages
- **Archived old pages** to `/client/src/pages/legacy/`
- **Created new accounting pages:**
  - `accounting-dashboard-page.tsx` - Main dashboard with overview
  - `wallets-page.tsx` - Manage Bitcoin wallets
  - `transactions-page.tsx` - View and categorize transactions
  - `categories-page.tsx` - Manage QuickBooks categories
  - `quickbooks-export-page.tsx` - Export to QuickBooks CSV

### 4. Navigation & Routing
- **Simplified App.tsx** - Removed all old routes, added accounting routes
- **Updated Sidebar** - Clean navigation focused on accounting features
- **New menu structure:**
  - Dashboard
  - Wallets
  - Transactions
  - Categories
  - QuickBooks Export
  - Profile
  - Settings

## Next Steps for MVP (2-3 weeks)

### Week 1: Core Functionality
1. **Database Migration**
   ```bash
   npm run db:push
   ```
   This will apply the new schema to the database.

2. **Fix Auth Routes**
   - The auth module still exists and should work
   - Test login/signup flows
   - May need to update auth routes if they break

3. **Test Server API**
   ```bash
   npm run dev
   ```
   - Verify all accounting endpoints work
   - Fix any TypeScript errors
   - Test CRUD operations for wallets, transactions, categories

### Week 2: Bitcoin Integration
1. **Wallet Import**
   - Implement xpub/address parsing for on-chain wallets
   - Add support for CSV upload for Lightning transactions
   - Fetch transaction history from blockchain APIs (Blockstream, Mempool.space)

2. **Exchange Rate Fetching**
   - The CoinGecko API is already integrated in the routes
   - Set up periodic rate caching (every 5-10 minutes)
   - Calculate historical USD values for past transactions

3. **FIFO Cost Basis**
   - Implement FIFO algorithm in backend
   - Automatically create `transaction_lots` when categorizing sent transactions
   - Calculate capital gains/losses per transaction

### Week 3: QuickBooks Export & Polish
1. **QuickBooks Export**
   - Test CSV generation with Matthew's actual data
   - Ensure format matches QuickBooks import requirements
   - Add support for both QuickBooks Online and Desktop formats

2. **UI Polish**
   - Add loading states
   - Improve error handling
   - Add transaction filtering/search
   - Test mobile responsiveness

3. **Onboarding**
   - Create simple onboarding flow for new users
   - Guide users through connecting first wallet
   - Pre-populate common categories

## Testing with Matthew

### What to Prepare
1. **Sample transactions**
   - Export Matthew's current Bitcoin transactions
   - Import them into PaidIn
   - Categorize them
   - Generate QuickBooks export
   - Have him test the import in QuickBooks

2. **Pricing confirmation**
   - He mentioned $50/month - confirm this works
   - Consider offering first month free for feedback
   - Set up Stripe billing (already exists in codebase)

3. **Feature validation**
   - Does the QuickBooks export format work?
   - Are the categories sufficient?
   - Is the workflow intuitive?
   - What's missing that he needs?

## Technical Debt to Address

1. **Remove unused dependencies**
   - Breez SDK, Stripe, Plaid (unless needed later)
   - Old payment-related packages
   - Clean up package.json

2. **Database cleanup**
   - The old database tables still exist
   - Consider dropping them after confirming new schema works
   - Or keep them for backward compatibility

3. **TypeScript errors**
   - Some old imports may cause TS errors
   - Fix as you encounter them

4. **Environment variables**
   - Update `.env.example` for new API keys (CoinGecko, etc.)
   - Remove old payment provider keys

## Current Status

✅ **Completed:**
- New schema designed and implemented
- Server routes for all accounting operations
- Client pages for all core features
- Navigation updated
- Old code archived (not deleted)

⏸️ **Needs Work:**
- Database migration (run `npm run db:push`)
- Bitcoin wallet integration (xpub parsing, blockchain API)
- FIFO cost basis calculation
- QuickBooks CSV format validation
- Testing with real data

🔧 **Blockers:**
- Need Matthew's feedback on QuickBooks format
- Need sample Bitcoin transactions to test with
- Need to validate categories match his accounting needs

## Architecture Notes

### Why This Structure?
- **Simplified schema** - Only what's needed for accounting, nothing more
- **QuickBooks-first** - Everything designed around generating clean exports
- **FIFO tracking** - Built-in from day one for accurate tax reporting
- **Multi-wallet** - Support for on-chain + Lightning from the start

### Scaling Considerations
- Can add more features later (tax form generation, audit reports, etc.)
- Can expand to other accounting software (Xero, Wave, etc.)
- Can add automatic transaction import from exchanges
- Can add multi-currency support

## Questions for Matthew

Before next development sprint, ask:
1. What Bitcoin wallets does he use? (Need to know which APIs to integrate)
2. Does he use Lightning or only on-chain?
3. What categories does he currently use in QuickBooks?
4. Can he share a sample of his current manual process? (Screenshots, CSV exports)
5. What's the biggest pain point today? (So we prioritize the right features)

---

**Ready to ship the MVP in 2-3 weeks with focused execution on these items.**
