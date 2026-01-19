# PaidIn - Bitcoin Accounting for Small Businesses

Bitcoin accounting software for small businesses. Track transactions, calculate cost basis, and export to QuickBooks. Simple reconciliation for Bitcoin operations.

> **Note**: This codebase was pivoted from a full operations platform to focus solely on Bitcoin accounting. Old code has been removed but is preserved in git history. To view previous versions, check git commits before the pivot.

## 🚀 Features

- **Bitcoin Wallet Management**: Connect and manage Bitcoin wallets (addresses and xpubs)
- **Transaction Import**: Automatically fetch and import Bitcoin transactions from the blockchain
- **Cost Basis Calculation**: FIFO-based cost basis calculation for tax reporting
- **Transaction Categorization**: Organize transactions with custom categories
- **Purchase Tracking**: Track Bitcoin purchases with cost basis for accurate accounting
- **QuickBooks Export**: Export transactions to QuickBooks CSV format with proper journal entries
- **Real-time Exchange Rates**: Historical and current Bitcoin exchange rates via CoinGecko
- **User Authentication**: Secure login/registration with company-based multi-tenancy

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Wouter
- **Backend**: Express.js, TypeScript, JWT authentication
- **Database**: SQLite with Drizzle ORM
- **Bitcoin**: Mempool.space API for transaction fetching, bitcoinjs-lib for validation
- **External APIs**: CoinGecko (exchange rates), Coinbase (historical rates)

## 📋 Prerequisites

- Node.js 18+
- SQLite (included, no setup required)
- CoinGecko API key (optional, for rate limits)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd paidin-app
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Required Environment Variables

# JWT Secret (REQUIRED - used for authentication tokens)
# Generate a strong random string: openssl rand -base64 32
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Session Secret (REQUIRED - used for session cookies)
# Can be the same as JWT_SECRET or a different value
# Generate a strong random string: openssl rand -base64 32
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# Application URL (REQUIRED for production)
# Used for email verification links
APP_URL=https://app.paidin.io

# CoinGecko API Key (OPTIONAL but recommended)
# Get one at: https://www.coingecko.com/en/api
# Without it, you'll be limited to free tier rate limits
COINGECKO_API_KEY=your-coingecko-api-key-here

# Node Environment
NODE_ENV=development

# Server Port (optional, defaults to 8080)
PORT=8080
```

### 3. Database Setup

The database is SQLite and will be created automatically. To apply schema changes:

```bash
npm run db:push
```

### 4. Development

Start the development server:

```bash
npm run dev
```

The app will be available at:
- Frontend: `http://localhost:3000` (Vite dev server)
- Backend: `http://localhost:8080` (Express API)

### 5. Production Build

Build for production:

```bash
npm run build
npm start
```

## 🗄️ Database Schema

The application uses the following main tables:

- **users**: User accounts with company-based multi-tenancy
- **companies**: Company/organization records
- **wallets**: Connected Bitcoin wallets (addresses and xpubs)
- **transactions**: Bitcoin transactions with USD values
- **categories**: Transaction categories for organization
- **purchases**: Bitcoin purchase records for cost basis
- **transaction_lots**: FIFO cost basis matching
- **exchange_rates**: Historical Bitcoin exchange rates
- **session**: User session storage

## 🔐 Authentication

The app uses JWT-based authentication. Users belong to companies and have access to their company's accounting data.

## 💰 Bitcoin Integration

### Wallet Support

- **Single Addresses**: Connect individual Bitcoin addresses
- **Extended Public Keys (xPub)**: Connect HD wallets (xpub, ypub, zpub)
- **Network Support**: Mainnet and Testnet
- **Address Types**: Legacy, P2SH (SegWit), Native SegWit, Taproot

### Transaction Fetching

Transactions are fetched from Mempool.space API:
- Automatic transaction import for connected wallets
- Support for external (receiving) and internal (change) addresses
- Transaction deduplication across multiple addresses
- Historical transaction data with USD values

### Cost Basis Calculation

- **FIFO Method**: First-In, First-Out cost basis matching
- **Purchase Tracking**: Track Bitcoin purchases with cost basis
- **Capital Gains/Loss**: Automatic calculation for tax reporting

## 📱 API Endpoints

### Authentication
- `POST /api/signup` - User registration
- `POST /api/login` - User login
- `GET /api/user` - Get current user
- `PATCH /api/user/profile` - Update user profile
- `PATCH /api/user/password` - Change password

### Accounting
- `GET /api/accounting/wallets` - List wallets
- `POST /api/accounting/wallets` - Add wallet
- `POST /api/accounting/wallets/:id/fetch-transactions` - Fetch transactions
- `GET /api/accounting/transactions` - List transactions (with pagination/filters)
- `GET /api/accounting/categories` - List categories
- `POST /api/accounting/categories` - Create category
- `PATCH /api/accounting/categories/:id` - Update category
- `DELETE /api/accounting/categories/:id` - Delete category
- `GET /api/accounting/purchases` - List purchases
- `POST /api/accounting/purchases` - Create purchase
- `PATCH /api/accounting/purchases/:id` - Update purchase
- `GET /api/accounting/transactions/:id/cost-basis` - Get cost basis for transaction
- `GET /api/accounting/transactions/cost-basis` - Batch cost basis calculation
- `GET /api/accounting/export/quickbooks` - Export to QuickBooks CSV
- `GET /api/accounting/rates/current` - Get current BTC rate
- `GET /api/accounting/rates/historical` - Get historical BTC rates

## 🚀 Deployment

> **⚠️ Production Checklist**: See [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) for detailed deployment steps and security considerations.

### Vercel/Netlify (Frontend)

1. Build the client: `npm run build`
2. Deploy the `dist/public` directory

### Railway/Render (Backend)

1. Set environment variables
2. Deploy the server directory
3. Configure database connection

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run check` - Type check
- `npm run db:push` - Push database schema

### Project Structure

```
├── client/                      # React frontend
│   ├── src/
│   │   ├── components/         # UI components (shadcn/ui)
│   │   ├── pages/              # Page components
│   │   ├── hooks/              # Custom hooks
│   │   └── lib/                # Utilities
├── server/                      # Express backend
│   ├── modules/
│   │   ├── accounting/         # Accounting module (wallets, transactions, etc.)
│   │   └── auth/               # Authentication module
│   ├── services/                # Business logic services
│   ├── db.ts                    # Database connection
│   └── index.ts                 # Server entry point
├── shared/                      # Shared types/schema (Drizzle)
└── dist/                        # Production build
```

> **Note on Legacy Code**: This repository was pivoted from a full operations platform to focus on Bitcoin accounting. Old code has been removed but is preserved in git history. To view previous versions, check git commits before the pivot date.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support, please open an issue in the repository or contact the development team.

---

**Note**: This application is for educational and development purposes. For production use, ensure proper security measures, environment configuration, and compliance with relevant regulations. 