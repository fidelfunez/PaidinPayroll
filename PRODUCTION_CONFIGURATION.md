# Production Configuration Checklist

## Issue: "Failed to Fetch" on Signup

This document outlines all the configuration needed for production deployment.

---

## 1. Frontend Configuration (Netlify)

### Required Environment Variables in Netlify

Go to Netlify Dashboard → Site Settings → Environment Variables and add:

```env
VITE_BACKEND_URL=https://paidin-app.fly.dev
```

**Why:** The frontend needs to know where the backend API is located. Without this, it tries to use relative paths which fail in production.

**How to set:**
1. Go to https://app.netlify.com
2. Select your site
3. Site Settings → Environment Variables
4. Add `VITE_BACKEND_URL` = `https://paidin-app.fly.dev`
5. Redeploy

---

## 2. Backend Configuration (Fly.io)

### Required Environment Variables in Fly.io

Check current secrets:
```bash
fly secrets list --app paidin-app
```

**Required secrets:**
- ✅ `SESSION_SECRET` - Already set
- ✅ `NODE_ENV=production` - Already set
- ✅ `PORT=8080` - Already set in fly.toml
- ❌ `FRONTEND_URL` - **NEEDS TO BE SET** (your Netlify URL)
- ❌ `NETLIFY_URL` - **NEEDS TO BE SET** (your Netlify URL)
- ❌ `RESEND_API_KEY` - **NEEDS TO BE SET** (for email verification)
- ❌ `FROM_EMAIL` - **NEEDS TO BE SET** (e.g., `PaidIn <onboarding@paidin.io>`)
- ❌ `APP_URL` - **NEEDS TO BE SET** (your Netlify frontend URL for email links)
- ❌ `JWT_SECRET` - **NEEDS TO BE SET** (if not using SESSION_SECRET)

**Set missing secrets:**
```bash
# Get your Netlify URL (e.g., https://your-site.netlify.app or https://app.paidin.io)
NETLIFY_URL="https://your-netlify-site.netlify.app"

fly secrets set FRONTEND_URL="$NETLIFY_URL" --app paidin-app
fly secrets set NETLIFY_URL="$NETLIFY_URL" --app paidin-app
fly secrets set APP_URL="$NETLIFY_URL" --app paidin-app
fly secrets set RESEND_API_KEY="re_your_key_here" --app paidin-app
fly secrets set FROM_EMAIL="PaidIn <onboarding@paidin.io>" --app paidin-app
fly secrets set JWT_SECRET="your-jwt-secret-here" --app paidin-app
```

---

## 3. CORS Configuration

### Current Status
✅ CORS is configured in `server/index.ts` to accept:
- `https://app.paidin.io`
- `FRONTEND_URL` environment variable
- `NETLIFY_URL` environment variable
- Localhost origins (for development)

### Fix Needed
Make sure your Netlify URL is added to CORS. The backend reads from `FRONTEND_URL` or `NETLIFY_URL` environment variables.

**Action:** Set `FRONTEND_URL` and `NETLIFY_URL` in Fly.io secrets (see above).

---

## 4. Health Check Issue

### Problem
The Fly.io health check is failing because the server might not be listening correctly.

### Current Configuration
- Health check path: `/health`
- Expected port: `8080`
- Server listens on: `0.0.0.0:8080` ✅

### Verify Server is Running
```bash
# Check if server is responding
curl https://paidin-app.fly.dev/health

# Check machine status
fly status --app paidin-app

# View logs
fly logs --app paidin-app
```

---

## 5. API Endpoint Verification

### Test Signup Endpoint
```bash
curl -X POST https://paidin-app.fly.dev/api/signup \
  -H "Content-Type: application/json" \
  -H "Origin: https://your-netlify-site.netlify.app" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "username": "testuser",
    "password": "Test123!@#",
    "companyName": "Test Company"
  }'
```

**Expected responses:**
- ✅ `201 Created` - Success
- ❌ `404 Not Found` - Route not registered (deployment issue)
- ❌ `401 Unauthorized` - CORS issue
- ❌ `500 Internal Server Error` - Backend error

---

## 6. Network Connectivity

### Check if Backend is Accessible
```bash
# Test from your machine
curl -v https://paidin-app.fly.dev/health

# Test from browser console (on Netlify site)
fetch('https://paidin-app.fly.dev/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

**Common issues:**
- ❌ CORS blocking the request
- ❌ Backend not running
- ❌ Wrong URL in frontend
- ❌ SSL certificate issues

---

## 7. Email Service Configuration

### Required for Signup Flow
The signup endpoint sends verification emails. If `RESEND_API_KEY` is not set:
- Signup will succeed
- But email won't be sent
- User can't verify account

**Action:** Set `RESEND_API_KEY` in Fly.io secrets.

---

## 8. Database Configuration

### Current Setup
- SQLite database stored in `/app/data` (Fly.io volume)
- Volume name: `paidin_data`
- ✅ Already configured in `fly.toml`

### Verify Database Access
The database should be automatically created. Check logs for database errors.

---

## 9. Build Configuration

### Frontend Build (Netlify)
- ✅ Build command: `npm run build`
- ✅ Publish directory: `dist/public`
- ❌ **Missing:** `VITE_BACKEND_URL` environment variable

### Backend Build (Fly.io)
- ✅ Dockerfile builds correctly
- ✅ Server code is bundled
- ✅ Health check configured

---

## 10. Quick Fix Checklist

### Immediate Actions Required:

1. **Set Netlify Environment Variable:**
   ```
   VITE_BACKEND_URL=https://paidin-app.fly.dev
   ```
   Then redeploy Netlify site.

2. **Set Fly.io Secrets:**
   ```bash
   fly secrets set FRONTEND_URL="https://your-netlify-site.netlify.app" --app paidin-app
   fly secrets set NETLIFY_URL="https://your-netlify-site.netlify.app" --app paidin-app
   fly secrets set APP_URL="https://your-netlify-site.netlify.app" --app paidin-app
   ```

3. **Restart Fly.io Machine:**
   ```bash
   fly machine restart --app paidin-app
   ```

4. **Test the Connection:**
   - Open browser console on Netlify site
   - Run: `fetch('https://paidin-app.fly.dev/health').then(r => r.json()).then(console.log)`
   - Should return: `{ status: 'ok', timestamp: '...' }`

---

## 11. Debugging Steps

### If "Failed to Fetch" persists:

1. **Check Browser Console:**
   - Open DevTools → Network tab
   - Try signup
   - Look for the failed request
   - Check the error message

2. **Check CORS:**
   - Look for CORS errors in console
   - Verify `Access-Control-Allow-Origin` header in response
   - Should include your Netlify URL

3. **Check Backend Logs:**
   ```bash
   fly logs --app paidin-app
   ```
   Look for:
   - Server startup messages
   - Request logs
   - Error messages

4. **Test Backend Directly:**
   ```bash
   curl -X POST https://paidin-app.fly.dev/api/signup \
     -H "Content-Type: application/json" \
     -d '{"firstName":"Test","lastName":"User","email":"test@test.com","username":"test","password":"Test123!@#","companyName":"Test"}'
   ```

5. **Verify Routes are Registered:**
   Check that `/api/signup` endpoint exists in the deployed code.

---

## 12. Common Issues & Solutions

### Issue: "Failed to Fetch"
**Causes:**
- ❌ `VITE_BACKEND_URL` not set in Netlify
- ❌ CORS not configured correctly
- ❌ Backend not running
- ❌ Network connectivity issue

**Solution:**
1. Set `VITE_BACKEND_URL` in Netlify
2. Set `FRONTEND_URL` in Fly.io
3. Redeploy both

### Issue: "404 Not Found" on `/api/signup`
**Causes:**
- ❌ Route not registered
- ❌ Old deployment running
- ❌ Build issue

**Solution:**
1. Redeploy Fly.io: `fly deploy --app paidin-app`
2. Restart machine: `fly machine restart --app paidin-app`
3. Check logs for route registration

### Issue: "CORS Error"
**Causes:**
- ❌ Frontend URL not in CORS allowed origins
- ❌ `FRONTEND_URL` not set in Fly.io

**Solution:**
1. Set `FRONTEND_URL` in Fly.io secrets
2. Restart machine
3. Verify CORS headers in response

### Issue: "401 Unauthorized"
**Causes:**
- ❌ CORS credentials issue
- ❌ Session/cookie configuration

**Solution:**
- Check CORS `credentials: true` is set (already configured)
- Verify cookie settings in production

---

## 13. Production URLs

Update these with your actual URLs:

- **Frontend (Netlify):** `https://your-site.netlify.app` or `https://app.paidin.io`
- **Backend (Fly.io):** `https://paidin-app.fly.dev`

---

## 14. Testing After Configuration

### Step 1: Test Health Endpoint
```javascript
// In browser console on Netlify site
fetch('https://paidin-app.fly.dev/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

### Step 2: Test Signup Endpoint
```javascript
// In browser console
fetch('https://paidin-app.fly.dev/api/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    username: 'testuser',
    password: 'Test123!@#',
    companyName: 'Test Company'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

### Step 3: Test from Signup Page
1. Go to your Netlify site
2. Navigate to `/signup`
3. Fill out the form
4. Submit
5. Check browser console for errors
6. Check Network tab for request details

---

## 15. Next Steps

1. ✅ Set `VITE_BACKEND_URL` in Netlify
2. ✅ Set `FRONTEND_URL`, `NETLIFY_URL`, `APP_URL` in Fly.io
3. ✅ Set `RESEND_API_KEY` and `FROM_EMAIL` in Fly.io (for emails)
4. ✅ Redeploy Netlify site
5. ✅ Restart Fly.io machine
6. ✅ Test signup flow
7. ✅ Check email delivery

---

## Summary

The "Failed to Fetch" error is most likely caused by:
1. **Missing `VITE_BACKEND_URL` in Netlify** - Frontend doesn't know backend URL
2. **Missing CORS configuration** - Backend doesn't allow Netlify origin
3. **Backend not running** - Machine might be stopped

Fix these three issues first, then test again.
