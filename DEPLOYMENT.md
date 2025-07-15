# 🚀 PaidIn MVP Deployment Guide

## Quick Deploy Options

### Option 1: Railway (Recommended)
1. **Connect Repository**: Push to GitHub and connect to Railway
2. **Environment Variables**: Set these in Railway dashboard:
   ```env
   DATABASE_URL=your-postgres-url
   SESSION_SECRET=your-secret-key
   NODE_ENV=production
   ```
3. **Deploy**: Railway will auto-deploy on push

### Option 2: Render
1. **Create Web Service**: Connect your GitHub repo
2. **Build Command**: `npm run build`
3. **Start Command**: `npm start`
4. **Environment Variables**: Same as above

### Option 3: Vercel + Railway
- **Frontend**: Deploy to Vercel (React app)
- **Backend**: Deploy to Railway (Express API)
- **Database**: Use Railway's PostgreSQL

## Environment Setup

### Required Variables
```env
DATABASE_URL=postgresql://username:password@host:port/database
SESSION_SECRET=your-super-secret-key-here
NODE_ENV=production
```

### Optional Variables (for future Bitcoin features)
```env
LNBITS_BASE_URL=https://your-lnbits-instance.com
LNBITS_API_KEY=your-lnbits-api-key
LNBITS_ADMIN_KEY=your-lnbits-admin-key
BTCPAY_URL=https://your-btcpay-server.com
BTCPAY_API_KEY=your-btcpay-api-key
BTCPAY_STORE_ID=your-btcpay-store-id
```

## Database Setup

### Option A: Railway PostgreSQL
1. Create PostgreSQL service in Railway
2. Copy the connection URL to `DATABASE_URL`
3. Run migrations: `npm run db:push`

### Option B: External PostgreSQL
1. Use services like Neon, Supabase, or your own PostgreSQL
2. Set `DATABASE_URL` to your connection string
3. Run migrations: `npm run db:push`

## Local Testing

```bash
# Install dependencies
npm install

# Set up environment
cp env.example .env
# Edit .env with your values

# Run database migrations
npm run db:push

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

## MVP Features Ready

✅ **User Authentication** (Login/Register)  
✅ **Role-based Access** (Admin/Employee)  
✅ **Dashboard** with stats and activity  
✅ **Payroll Management** (without Bitcoin)  
✅ **Expense Reimbursements**  
✅ **Employee Management**  
✅ **Messaging System**  
✅ **Profile Management**  
✅ **Responsive UI**  

## What's Working Now

- **Authentication**: Full login/register system
- **Dashboard**: Real-time stats and activity feed
- **Payroll**: Create and manage salary payments (USD only)
- **Expenses**: Submit and approve expense claims
- **Employees**: Admin can manage employee list
- **Messaging**: Internal communication system
- **Profile**: User profile management

## Future Bitcoin Integration

The Bitcoin functionality is ready to be enabled later:
- BTCPay Server integration is complete
- Database schema supports Bitcoin payments
- API endpoints are ready
- Just need to configure BTCPay environment variables

## Quick Start Commands

```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Database migrations
npm run db:push

# Type checking
npm run check
```

## Troubleshooting

### Build Issues
- Ensure Node.js 18+ is installed
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`

### Database Issues
- Check `DATABASE_URL` format
- Ensure PostgreSQL is accessible
- Run migrations: `npm run db:push`

### Runtime Issues
- Check environment variables
- Verify `SESSION_SECRET` is set
- Check logs for specific errors

## Ready for Demo! 🎉

The MVP is fully functional for demonstrating:
- User registration and authentication
- Admin dashboard with employee management
- Payroll and expense workflows
- Real-time messaging
- Responsive design

**Deploy and show it off!** 🚀 