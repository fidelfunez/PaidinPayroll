# 🚀 Netlify + Fly.io Deployment Guide

## Overview
- **Frontend**: Deploy to Netlify (React app)
- **Backend**: Deploy to Fly.io (Express API)
- **Database**: PostgreSQL (Fly.io or external)

## 📋 Prerequisites

### 1. Install CLIs
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Install Fly CLI
curl -L https://fly.io/install.sh | sh
```

### 2. Set Up Accounts
- **Netlify**: Sign up at [netlify.com](https://netlify.com)
- **Fly.io**: Sign up at [fly.io](https://fly.io)

## 🗄️ Database Setup

### Option A: Fly.io PostgreSQL
```bash
# Create PostgreSQL database
fly postgres create paidin-db

# Attach to your app
fly postgres attach paidin-db --app paidin-backend
```

### Option B: External PostgreSQL
- Use Neon, Supabase, or your own PostgreSQL
- Get the connection URL

## 🚀 Backend Deployment (Fly.io)

### 1. Login to Fly.io
```bash
fly auth login
```

### 2. Set Environment Variables
```bash
# Set your database URL
export DATABASE_URL="postgresql://username:password@host:port/database"

# Set session secret
export SESSION_SECRET="your-super-secret-key-here"

# Deploy backend
./deploy-fly.sh
```

### 3. Or Deploy Manually
```bash
# Create app
fly apps create paidin-backend

# Set secrets
fly secrets set DATABASE_URL="$DATABASE_URL"
fly secrets set SESSION_SECRET="$SESSION_SECRET"
fly secrets set NODE_ENV="production"

# Deploy
fly deploy
```

## 🌐 Frontend Deployment (Netlify)

### 1. Login to Netlify
```bash
netlify login
```

### 2. Set Backend URL
After deploying the backend, get your Fly.io URL:
```bash
fly status --app paidin-backend
```

### 3. Deploy Frontend
```bash
# Build and deploy
./deploy-netlify.sh
```

### 4. Or Deploy Manually
```bash
# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist/public
```

### 5. Set Environment Variables in Netlify
Go to your Netlify dashboard → Site settings → Environment variables:
```
VITE_BACKEND_URL=https://paidin-backend.fly.dev
```

## 🔧 Environment Variables

### Backend (Fly.io)
```env
DATABASE_URL=postgresql://username:password@host:port/database
SESSION_SECRET=your-super-secret-key-here
NODE_ENV=production
```

### Frontend (Netlify)
```env
VITE_BACKEND_URL=https://paidin-backend.fly.dev
```

## 🎯 Quick Deploy Commands

### One-Command Deployment
```bash
# 1. Set environment variables
export DATABASE_URL="your-database-url"
export SESSION_SECRET="your-secret"

# 2. Deploy backend
./deploy-fly.sh

# 3. Deploy frontend
./deploy-netlify.sh
```

## 🔍 Troubleshooting

### Backend Issues
```bash
# Check logs
fly logs --app paidin-backend

# Check status
fly status --app paidin-backend

# Restart app
fly apps restart paidin-backend
```

### Frontend Issues
```bash
# Check build logs in Netlify dashboard
# Verify VITE_BACKEND_URL is set correctly
```

### Database Issues
```bash
# Check database connection
fly postgres connect --app paidin-backend

# Run migrations
fly ssh console --app paidin-backend
npm run db:push
```

## 🌐 URLs

After deployment:
- **Frontend**: `https://your-app.netlify.app`
- **Backend**: `https://paidin-backend.fly.dev`

## 🎉 Success Checklist

- [ ] Backend deployed to Fly.io
- [ ] Frontend deployed to Netlify
- [ ] Database connected and migrated
- [ ] Environment variables set
- [ ] Frontend can communicate with backend
- [ ] Authentication working
- [ ] All features functional

## 🚀 Ready for Demo!

Your MVP is now live and ready for demonstration!

### Demo Flow
1. **Register as Admin** → Show admin capabilities
2. **Add Employees** → Demonstrate team management
3. **Create Payroll** → Show payment processing
4. **Submit Expenses** → Demonstrate approval workflow
5. **Send Messages** → Show communication features

**Go ahead and deploy!** 🎉 