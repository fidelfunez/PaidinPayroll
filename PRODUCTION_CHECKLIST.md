# Production Deployment Checklist

## Pre-Deployment

### 1. Environment Variables ✅
- [ ] Copy `.env.example` to `.env` in production
- [ ] Set `JWT_SECRET` (generate with: `openssl rand -base64 32`)
- [ ] Set `SESSION_SECRET` (can be same as JWT_SECRET)
- [ ] Set `APP_URL` to your production domain (e.g., `https://app.paidin.io`)
- [ ] Set `COINGECKO_API_KEY` (optional but recommended)
- [ ] Set `NODE_ENV=production`
- [ ] Verify `PORT` is set correctly (default: 8080)

### 2. Security ✅
- [ ] **CRITICAL**: Ensure `JWT_SECRET` and `SESSION_SECRET` are strong random strings
- [ ] Verify CORS origins include your production domain in `server/index.ts`
- [ ] Ensure HTTPS is enabled in production
- [ ] Verify secure cookies are enabled (already configured for production)
- [ ] Check that no API keys or secrets are hardcoded

### 3. Database ✅
- [ ] SQLite database will be created automatically
- [ ] Ensure database directory is writable
- [ ] Run `npm run db:push` to apply schema if needed
- [ ] Backup database before deployment

### 4. Build & Test ✅
- [ ] Run `npm run build` successfully
- [ ] Test production build locally: `npm start`
- [ ] Verify all API endpoints work
- [ ] Test authentication flow
- [ ] Test transaction fetching
- [ ] Test QuickBooks export

### 5. Server Configuration ✅
- [ ] Verify server starts without errors
- [ ] Check health endpoint: `GET /health`
- [ ] Verify static file serving works
- [ ] Test SPA routing (404s serve index.html)

### 6. External Services ✅
- [ ] CoinGecko API key configured (or using free tier)
- [ ] Mempool.space API accessible (no auth required)
- [ ] Email service configured (if using email verification)

### 7. Monitoring & Logging ✅
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Configure log aggregation
- [ ] Set up uptime monitoring
- [ ] Configure alerts for critical errors

## Deployment Steps

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set environment variables** in your hosting platform

3. **Start the server**
   ```bash
   npm start
   ```

4. **Verify deployment**
   - Check health endpoint
   - Test login/signup
   - Test core features

## Post-Deployment

- [ ] Monitor error logs for first 24 hours
- [ ] Test all critical user flows
- [ ] Verify email verification links work
- [ ] Check database is persisting data
- [ ] Monitor API rate limits (CoinGecko)
- [ ] Verify CORS is working for frontend

## Rollback Plan

If issues occur:
1. Revert to previous git commit
2. Rebuild and redeploy
3. Restore database backup if needed

## Notes

- **SQLite**: Database is file-based, ensure persistent storage
- **CORS**: Update `allowedOrigins` in `server/index.ts` for production domain
- **Rate Limits**: CoinGecko free tier is 10-50 calls/minute
- **Email**: Email verification requires email service configuration

## Common Issues

1. **"JWT_SECRET is required"**: Set environment variable
2. **CORS errors**: Add production domain to `allowedOrigins`
3. **Database errors**: Check file permissions on database directory
4. **Email not sending**: Configure email service in `server/utils/email-service.ts`
