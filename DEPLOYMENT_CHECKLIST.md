# Production Deployment Checklist

**Last Updated:** 2024-12-19  
**Status:** Complete - All environment variables documented

---

## Pre-Deployment Setup

### 1. Environment Variables - Backend (Fly.io)

Set these secrets in Fly.io using `fly secrets set`:

```bash
# Authentication & Security (REQUIRED)
fly secrets set SESSION_SECRET="$(openssl rand -base64 32)" --app paidin-app
fly secrets set JWT_SECRET="$(openssl rand -base64 32)" --app paidin-app
# Note: JWT_SECRET can be the same as SESSION_SECRET

# Application URLs (REQUIRED)
fly secrets set APP_URL="https://app.paidin.io" --app paidin-app
fly secrets set FRONTEND_URL="https://app.paidin.io" --app paidin-app
fly secrets set NETLIFY_URL="https://app.paidin.io" --app paidin-app

# Email Configuration (REQUIRED)
fly secrets set RESEND_API_KEY="re_your_resend_api_key" --app paidin-app
fly secrets set FROM_EMAIL="PaidIn <onboarding@paidin.io>" --app paidin-app
fly secrets set SUPPORT_EMAIL="support@paidin.io" --app paidin-app  # Optional

# Database (Optional - has defaults)
fly secrets set DATABASE_PATH="/app/data/paidin.db" --app paidin-app  # Optional

# Admin Configuration (Optional)
fly secrets set ADMIN_EMAIL="fidel@paidin.io" --app paidin-app  # For admin notifications

# Optional Services
fly secrets set COINGECKO_API_KEY="your_coingecko_api_key" --app paidin-app  # Optional but recommended

# Node Environment
fly secrets set NODE_ENV="production" --app paidin-app
# PORT is set in fly.toml, no need to set as secret
```

**Verify secrets are set:**
```bash
fly secrets list --app paidin-app
```

---

### 2. Environment Variables - Frontend (Netlify)

Set these in Netlify Dashboard → Site Settings → Environment Variables:

```bash
# Backend API URL (REQUIRED)
VITE_BACKEND_URL=https://paidin-app.fly.dev

# Optional Breez SDK (if using)
VITE_BREEZ_API_KEY=your_breez_api_key
VITE_BREEZ_NETWORK=mainnet
```

**Note:** After setting environment variables in Netlify, you must **trigger a new deploy** for them to take effect.

---

## Deployment Steps

### Step 1: Backend Deployment (Fly.io)

1. **Ensure all secrets are set** (see above)

2. **Deploy the application:**
   ```bash
   fly deploy --app paidin-app
   ```

3. **Verify deployment:**
   ```bash
   # Check health endpoint
   curl https://paidin-app.fly.dev/health
   
   # Check logs
   fly logs --app paidin-app
   ```

4. **Restart if needed:**
   ```bash
   fly machine restart --app paidin-app
   ```

---

### Step 2: Frontend Deployment (Netlify)

1. **Ensure environment variables are set** (see above)

2. **Trigger a new deploy:**
   - Go to Netlify Dashboard
   - Deploys → Trigger deploy → Deploy site
   - Or push to your main branch (auto-deploy)

3. **Verify deployment:**
   - Check that the site loads
   - Test login/signup
   - Verify API calls go to correct backend

---

## Post-Deployment Verification

### Health Checks

- [ ] Backend health endpoint: `https://paidin-app.fly.dev/health` returns `{"status":"ok"}`
- [ ] Frontend loads without errors
- [ ] No console errors in browser

### Authentication

- [ ] Can sign up new user
- [ ] Email verification link works
- [ ] Can log in with verified account
- [ ] JWT token is set correctly

### API Endpoints

- [ ] `/api/user` returns user data
- [ ] `/api/accounting/wallets` returns wallets (or empty array)
- [ ] `/api/accounting/transactions` returns transactions (or empty array)
- [ ] CORS allows requests from frontend domain

### Features

- [ ] Can connect a wallet
- [ ] Can fetch transactions
- [ ] Can categorize transactions
- [ ] Can export to QuickBooks
- [ ] Admin console accessible (if platform_admin)

### Email

- [ ] Verification emails are sent
- [ ] Admin notification emails are sent (if ADMIN_EMAIL is set)
- [ ] Email links point to correct frontend URL

### Database

- [ ] Database is writable at configured path
- [ ] Schema sync runs on startup (check logs)
- [ ] No database errors in logs

### Logging

- [ ] No console.logs in production logs (only errors)
- [ ] Error logs are informative
- [ ] No sensitive data in logs

---

## Troubleshooting

### Backend Issues

**Problem:** 500 errors on API calls
- Check Fly.io logs: `fly logs --app paidin-app`
- Verify all required environment variables are set
- Check database path is writable

**Problem:** CORS errors
- Verify `FRONTEND_URL` and `NETLIFY_URL` are set correctly
- Check that frontend domain matches allowed origins
- Verify `APP_URL` matches frontend domain

**Problem:** Email not sending
- Verify `RESEND_API_KEY` is set
- Verify `FROM_EMAIL` is set and domain is verified in Resend
- Check Resend dashboard for delivery status

### Frontend Issues

**Problem:** API calls fail with 404
- Verify `VITE_BACKEND_URL` is set in Netlify
- Trigger a new deploy after setting env vars
- Check browser console for actual request URL

**Problem:** Stale build
- Clear Netlify cache
- Trigger a new deploy
- Verify build logs show correct env vars

---

## Environment Variable Reference

### Required Backend Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `SESSION_SECRET` | Session encryption | Generated with `openssl rand -base64 32` |
| `JWT_SECRET` | JWT token signing | Generated with `openssl rand -base64 32` |
| `APP_URL` | Frontend URL for email links | `https://app.paidin.io` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://app.paidin.io` |
| `NETLIFY_URL` | Netlify URL for CORS | `https://app.paidin.io` |
| `RESEND_API_KEY` | Resend API key for emails | `re_...` |
| `FROM_EMAIL` | Email sender address | `PaidIn <onboarding@paidin.io>` |
| `NODE_ENV` | Environment mode | `production` |

### Optional Backend Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `SUPPORT_EMAIL` | Support contact email | `FROM_EMAIL` |
| `DATABASE_PATH` | Database file path | `/app/data/paidin.db` (prod) |
| `ADMIN_EMAIL` | Admin notification email | Not set |
| `COINGECKO_API_KEY` | CoinGecko API key | Free tier (rate limited) |
| `PORT` | Server port | `8080` (set in fly.toml) |

### Required Frontend Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_BACKEND_URL` | Backend API URL | `https://paidin-app.fly.dev` |

### Optional Frontend Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_BREEZ_API_KEY` | Breez SDK API key | `your_key` |
| `VITE_BREEZ_NETWORK` | Breez network | `mainnet` |

---

## Security Checklist

- [ ] All secrets are strong random strings (32+ characters)
- [ ] No API keys or secrets in code or git
- [ ] HTTPS enabled on all domains
- [ ] CORS properly configured (no wildcards in production)
- [ ] Secure cookies enabled in production
- [ ] Database path is secure and writable
- [ ] Error messages don't leak sensitive information
- [ ] Logs don't contain sensitive data

---

## Monitoring

### Recommended Monitoring

1. **Uptime Monitoring**
   - Set up ping to `/health` endpoint
   - Alert on downtime

2. **Error Tracking**
   - Set up error tracking (e.g., Sentry)
   - Monitor error rates

3. **Log Aggregation**
   - Use Fly.io logs or external service
   - Monitor for critical errors

4. **Performance Monitoring**
   - Monitor API response times
   - Track slow queries

---

## Rollback Procedure

If deployment fails:

1. **Backend (Fly.io):**
   ```bash
   # List releases
   fly releases --app paidin-app
   
   # Rollback to previous release
   fly releases rollback <release-id> --app paidin-app
   ```

2. **Frontend (Netlify):**
   - Go to Deploys in Netlify Dashboard
   - Find previous successful deploy
   - Click "Publish deploy"

---

## Support

For issues or questions:
- Check logs: `fly logs --app paidin-app`
- Review `PRODUCTION_READINESS_AUDIT.md` for known issues
- Check `PRODUCTION_CONFIGURATION.md` for configuration details
