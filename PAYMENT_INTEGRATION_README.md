# Payment Integration System

A comprehensive payment integration system for PaidIn that enables seamless bank-to-Bitcoin transactions using Plaid, Stripe, Strike API, and Breez SDK.

## 🚀 Overview

This system provides a complete payment flow that allows companies to:
1. **Link bank accounts** via Plaid for ACH authorization
2. **Process ACH debits** through Stripe
3. **Convert USD to BTC** using Strike API
4. **Manage Lightning wallets** with Breez SDK
5. **Enable employee swaps** between BTC and USD

## 🏗️ Architecture

### Core Components

- **Plaid Service**: Bank account linking and ACH authorization
- **Stripe Service**: ACH payment processing and webhook handling
- **Strike Service**: USD to BTC conversion and Lightning payments
- **Breez Service**: Lightning wallet management
- **Payment Orchestrator**: Coordinates the entire payment flow
- **Queue System**: Asynchronous job processing with BullMQ
- **Webhook Infrastructure**: Handles external service callbacks
- **Security Layer**: Rate limiting, encryption, and audit logging

### Database Schema

The system extends the existing database with new tables:

- `plaid_accounts`: Connected bank accounts
- `payment_intents`: Stripe payment intents
- `conversions`: USD to BTC conversions
- `breez_wallets`: Lightning wallet instances
- `wallet_transactions`: Unified transaction ledger
- `webhook_events`: Audit log for webhook events

## 🔧 Setup

### Prerequisites

- Node.js 18+
- Redis server
- SQLite database
- API keys for all services

### Environment Variables

Create a `.env` file with the following variables:

```env
# Plaid Configuration
PLAID_CLIENT_ID=your-plaid-client-id
PLAID_SECRET=your-plaid-secret
PLAID_ENV=sandbox

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-stripe-webhook-secret

# Strike API Configuration
STRIKE_API_KEY=your-strike-api-key
STRIKE_BASE_URL=https://api.strike.me
STRIKE_WEBHOOK_SECRET=your-strike-webhook-secret

# Breez SDK Configuration
BREEZ_API_KEY=your-breez-api-key
BREEZ_NETWORK=testnet
BREEZ_WEBHOOK_SECRET=your-breez-webhook-secret

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key
```

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run database migrations:
```bash
npm run db:push
```

3. Start Redis server:
```bash
redis-server
```

4. Start the application:
```bash
npm run dev
```

## 📚 API Endpoints

### Payment Operations

#### Plaid Integration
- `POST /api/payments/plaid/link-token` - Get Plaid Link token
- `POST /api/payments/plaid/exchange-token` - Exchange public token
- `GET /api/payments/plaid/accounts` - List connected accounts
- `DELETE /api/payments/plaid/accounts/:id` - Remove account

#### Wallet Funding
- `POST /api/payments/fund-wallet` - Fund company wallet
- `GET /api/payments/status/:id` - Check payment status
- `GET /api/payments/transactions` - Get transaction history

#### Employee Operations
- `POST /api/payments/swap` - BTC/USD swap
- `POST /api/payments/payout` - Employee payout

### Wallet Management

#### Wallet Operations
- `GET /api/wallets/company` - Get company wallet
- `GET /api/wallets/employee/:userId` - Get employee wallet
- `POST /api/wallets/breez/initialize` - Initialize wallet
- `POST /api/wallets/breez/invoice` - Generate invoice
- `POST /api/wallets/breez/pay` - Pay invoice
- `GET /api/wallets/balance` - Get wallet balance
- `POST /api/wallets/sync` - Sync wallet

### Admin Endpoints

#### Payment Management
- `GET /api/admin/payments` - List all payments
- `GET /api/admin/payments/:id` - Payment details
- `POST /api/admin/payments/:id/retry` - Retry failed payment
- `GET /api/admin/payments/metrics` - Payment metrics
- `GET /api/admin/payments/health` - System health
- `GET /api/admin/payments/alerts` - Security alerts

#### Webhook Management
- `GET /api/admin/webhooks` - Webhook event logs
- `POST /api/admin/webhooks/:id/replay` - Replay webhook

### Webhook Endpoints

- `POST /api/webhooks/stripe` - Stripe webhooks
- `POST /api/webhooks/strike` - Strike webhooks
- `POST /api/webhooks/breez` - Breez webhooks

## 🔄 Payment Flow

### Company Wallet Funding

1. **User initiates funding** via frontend
2. **Plaid Link** opens for bank account selection
3. **Public token** exchanged for access token
4. **Stripe PaymentIntent** created with ACH details
5. **Payment confirmed** and webhook received
6. **Strike quote** created for USD to BTC conversion
7. **Quote executed** and BTC amount calculated
8. **Breez invoice** generated for company wallet
9. **Strike pays** the Lightning invoice
10. **Wallet balance** updated and transaction logged

### Employee Swap (USD to BTC)

1. **Employee requests swap** with USD amount
2. **Strike quote** created for conversion
3. **Quote executed** to get BTC amount
4. **Breez invoice** generated for employee wallet
5. **Strike pays** the Lightning invoice
6. **Employee wallet** receives BTC

### Employee Swap (BTC to USD)

1. **Employee requests swap** with BTC amount
2. **Breez invoice** generated to receive BTC
3. **Strike swap** initiated for BTC to USD
4. **USD amount** credited to employee account

## 🛡️ Security Features

### Rate Limiting
- General API: 100 requests/15 minutes
- Payment operations: 10 requests/5 minutes
- Webhook endpoints: 50 requests/1 minute
- Login attempts: 5 attempts/15 minutes

### Security Headers
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection

### Encryption
- All sensitive data encrypted at rest
- API keys and tokens encrypted
- Webhook signature verification
- Request size limiting

### Audit Logging
- All payment operations logged
- Suspicious activity detection
- Security event monitoring
- Failed operation tracking

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run payment integration tests
npm run test:payment

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Coverage

The test suite covers:
- Service integrations (Plaid, Stripe, Strike, Breez)
- Payment orchestrator flows
- Error handling scenarios
- Webhook processing
- Security validations

## 📊 Monitoring

### Health Checks

- `GET /api/health` - Basic health check
- `GET /api/admin/payments/health` - Payment system health
- `GET /api/admin/payments/metrics` - Performance metrics
- `GET /api/admin/payments/alerts` - Security alerts

### Metrics Tracked

- Transaction success/failure rates
- Processing times
- Error rates
- Queue status
- Memory usage
- Webhook processing

## 🔧 Configuration

### Security Configuration

The system uses a comprehensive security configuration that can be customized via environment variables:

```env
# Rate Limiting
RATE_LIMIT_GENERAL_WINDOW=900000
RATE_LIMIT_GENERAL_MAX=100
RATE_LIMIT_PAYMENT_WINDOW=300000
RATE_LIMIT_PAYMENT_MAX=10

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://paidin-app.fly.dev

# Security Headers
SECURITY_CSP=true
SECURITY_HSTS=true
SECURITY_NO_SNIFF=true

# API Keys
API_KEYS_ENABLED=false
API_KEYS=key1,key2,key3

# IP Whitelisting
IP_WHITELIST_ENABLED=false
IP_WHITELIST=127.0.0.1,192.168.1.1
```

## 🚨 Error Handling

### Error Types

- `PaymentError`: Base payment error class
- `PlaidError`: Plaid service errors
- `StripeError`: Stripe service errors
- `StrikeError`: Strike API errors
- `BreezError`: Breez SDK errors
- `ValidationError`: Input validation errors
- `InsufficientFundsError`: Wallet balance errors

### Retry Logic

- Exponential backoff for retryable errors
- Circuit breaker pattern for external services
- Maximum retry attempts with failure handling
- Dead letter queue for failed jobs

## 📈 Performance

### Optimization Features

- Connection pooling for database
- Redis caching for frequently accessed data
- Asynchronous job processing
- Request/response compression
- Database query optimization

### Scalability

- Horizontal scaling with Redis
- Queue-based processing
- Stateless service design
- Load balancer ready

## 🔍 Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Ensure Redis server is running
   - Check REDIS_URL configuration

2. **Plaid Link Token Creation Failed**
   - Verify PLAID_CLIENT_ID and PLAID_SECRET
   - Check PLAID_ENV setting

3. **Stripe Payment Intent Failed**
   - Verify STRIPE_SECRET_KEY
   - Check webhook endpoint configuration

4. **Strike API Errors**
   - Verify STRIKE_API_KEY
   - Check API rate limits

5. **Breez Wallet Initialization Failed**
   - Verify BREEZ_API_KEY
   - Check network configuration

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=payment:*
```

## 📝 Logging

### Log Levels

- `ERROR`: Critical errors requiring immediate attention
- `WARN`: Warning conditions that should be monitored
- `INFO`: General information about system operation
- `DEBUG`: Detailed information for debugging

### Log Categories

- `payment:plaid`: Plaid service operations
- `payment:stripe`: Stripe service operations
- `payment:strike`: Strike API operations
- `payment:breez`: Breez SDK operations
- `payment:orchestrator`: Payment flow coordination
- `payment:webhook`: Webhook processing
- `payment:security`: Security events

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Standards

- Use TypeScript for type safety
- Follow existing code patterns
- Add comprehensive error handling
- Include unit tests for new features
- Document public APIs

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation
- Contact the development team

---

**Note**: This payment integration system is designed for production use with proper security measures. Always test thoroughly in a sandbox environment before deploying to production.
