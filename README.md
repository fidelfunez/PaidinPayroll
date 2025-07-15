# PaidIn - Bitcoin Payroll Platform

A full-stack Bitcoin payroll and reimbursement platform built with React, TypeScript, Express.js, and PostgreSQL. Features real-time BTC conversions, admin controls, and Lightning Network integration via LNbits.

## 🚀 Features

- **User Authentication**: Secure login/registration with role-based access
- **Bitcoin Payroll**: Process salary payments in Bitcoin with real-time rate conversion
- **Expense Reimbursements**: Submit and approve expense claims
- **Real-time BTC Rates**: Live Bitcoin price integration via CoinGecko API
- **Admin Dashboard**: Comprehensive admin controls and analytics
- **Messaging System**: Internal communication between users
- **Lightning Network Integration**: Bitcoin payments via LNbits
- **Responsive Design**: Modern UI built with Tailwind CSS and Radix UI

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Radix UI
- **Backend**: Express.js, TypeScript, Passport.js
- **Database**: PostgreSQL with Drizzle ORM
- **Bitcoin**: LNbits integration for Lightning Network payments
- **Real-time**: WebSocket support for live updates

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- LNbits instance (for Bitcoin payments)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd paidin-app
npm install
```

### 2. Environment Setup

Copy the example environment file and configure your variables:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/paidin_db

# Session Configuration  
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# LNbits Configuration (for Bitcoin payments)
LNBITS_BASE_URL=https://your-lnbits-instance.com
LNBITS_API_KEY=your-lnbits-api-key
LNBITS_ADMIN_KEY=your-lnbits-admin-key

# Optional: Node Environment
NODE_ENV=development
```

### 3. Database Setup

Create your PostgreSQL database and run the migrations:

```bash
npm run db:push
```

### 4. Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5000`

### 5. Production Build

Build for production:

```bash
npm run build
npm start
```

## 🗄️ Database Schema

The application uses the following main tables:

- **users**: User accounts with role-based access
- **payroll_payments**: Bitcoin salary payments
- **expense_reimbursements**: Expense claims and reimbursements
- **btc_rate_history**: Historical Bitcoin exchange rates
- **conversations/messages**: Internal messaging system
- **session**: User session storage

## 🔐 Authentication

The app uses Passport.js with local strategy for authentication. Users can register as either:
- **Admin**: Full access to all features
- **Employee**: Limited access to personal data and submissions

## 💰 Bitcoin Integration

### BTCPay Server Setup

1. **Deploy BTCPay Server**: Use Docker, VPS, or hosted service
2. **Create Store**: Set up a store in your BTCPay Server instance
3. **Generate API Key**: Create an API key with invoice creation permissions
4. **Configure Environment**: Set the required environment variables

### Environment Variables

```env
BTCPAY_URL=https://your-btcpay-server.com
BTCPAY_API_KEY=your-btcpay-api-key
BTCPAY_STORE_ID=your-btcpay-store-id
```

### Payment Flow

1. **Invoice Creation**: Admin creates Bitcoin invoice via API
2. **Rate Conversion**: System fetches current BTC rate from CoinGecko
3. **Payment Processing**: BTCPay handles both Lightning and on-chain payments
4. **Status Updates**: Webhooks and polling update payment status
5. **Database Recording**: All transactions are stored locally

### Testing BTCPay Integration

```bash
# Test BTCPay configuration
node test-btcpay.js
```

### API Endpoints

- `POST /api/invoice` - Create new Bitcoin invoice
- `GET /api/invoice/:id` - Get invoice status and details
- `GET /api/invoices` - List all invoices
- `POST /api/invoice/webhook` - BTCPay webhook endpoint

## 📱 API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user

### Payroll
- `GET /api/payroll` - Get payroll payments
- `POST /api/payroll` - Create payroll payment
- `PATCH /api/payroll/:id` - Update payment status
- `POST /api/payroll/:id/process-bitcoin` - Process Bitcoin payment

### Expenses
- `GET /api/expenses` - Get expense reimbursements
- `POST /api/expenses` - Create expense claim
- `PATCH /api/expenses/:id` - Update expense status

### Bitcoin
- `GET /api/btc-rate` - Get current BTC rate
- `GET /api/btc-rate/history` - Get rate history

### Messaging
- `GET /api/conversations` - Get user conversations
- `POST /api/conversations` - Create conversation
- `GET /api/conversations/:id/messages` - Get messages
- `POST /api/conversations/:id/messages` - Send message

## 🚀 Deployment

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
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom hooks
│   │   └── lib/          # Utilities
├── server/                # Express backend
│   ├── routes.ts         # API routes
│   ├── auth.ts           # Authentication
│   ├── storage.ts        # Database operations
│   └── lnbits.ts         # Bitcoin integration
├── shared/               # Shared types/schema
└── dist/                 # Production build
```

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