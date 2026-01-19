# Wallet Creation Diagnostic Guide

## Most Common Failure Reasons

### 1. **Missing Breez API Key** ❌
Check if `VITE_BREEZ_API_KEY` is set in your `.env` file:
```bash
cd "/Users/fidelfunez/Documents/Dev Portfolio/Paidin App"
grep VITE_BREEZ_API_KEY .env
```

If missing, add it:
```
VITE_BREEZ_API_KEY=your-breez-api-key-here
VITE_BREEZ_NETWORK=regtest
```

### 2. **Breez SDK WebAssembly Load Failure** ❌
The SDK requires WebAssembly to load. Check browser console for:
- `Failed to load wasm module`
- `Breez SDK initialization failed`

### 3. **Wallet Connection Error** ❌
The `connect()` call might fail. Check for:
- Network errors
- Invalid API key
- Storage issues (IndexedDB)

### 4. **Backend Registration Failure** ❌
Even if wallet is created client-side, backend registration might fail:
- 401 Unauthorized (user not found or email verification expired)
- 500 Server Error

## How to Check What Failed

### Step 1: Check Browser Console
Open DevTools (F12) → Console tab, and look for:
- ✅ Success: `✅ Mnemonic generated`, `✅ Wallet connected`, `✅ Wallet registered`
- ❌ Failure: `Wallet creation failed: [error message]`

### Step 2: Check Backend Logs
In your backend terminal, look for:
- ✅ Success: `✅ Wallet registered: employee wallet for user [id], nodeId: [id]`
- ❌ Failure: `Wallet registration error: [error]`

### Step 3: Check Network Tab
Open DevTools → Network tab, filter by "breez", and check:
- `/api/wallets/breez/register` request
  - ✅ 200 OK = Wallet registered successfully
  - ❌ 400/401/500 = Registration failed

### Step 4: Check Database (if you can access it)
```bash
cd "/Users/fidelfunez/Documents/Dev Portfolio/Paidin App"
sqlite3 server/data.db "SELECT bw.*, u.email FROM breez_wallets bw JOIN users u ON bw.user_id = u.id WHERE u.email = 'YOUR_EMAIL@example.com';"
```

## Expected Console Logs (Success)
```
✅ Breez SDK initialized
✅ Mnemonic generated (24 words)
✅ Wallet created
✅ Node info retrieved: paidin_[hash]
✅ Wallet registered with backend: [walletId]
```

## Common Error Messages

### "Breez SDK initialization failed"
→ WebAssembly module failed to load
→ Check browser compatibility or network connection

### "Wallet connection failed"
→ API key might be invalid or missing
→ Check `VITE_BREEZ_API_KEY` in `.env`

### "Failed to register wallet: Authentication required"
→ Email verification window expired (>5 minutes)
→ User needs to log in first, then create wallet manually

### "Wallet creation failed: [CORS error]"
→ Backend API not accessible
→ Check `VITE_BACKEND_URL` in `.env`

## Quick Fix Checklist

- [ ] Check `.env` has `VITE_BREEZ_API_KEY` set
- [ ] Check `.env` has `VITE_BREEZ_NETWORK=regtest` (or `mainnet`)
- [ ] Restart frontend dev server after changing `.env`
- [ ] Check browser console for specific error messages
- [ ] Check backend is running and accessible
- [ ] Try signing up again and watch console logs in real-time
