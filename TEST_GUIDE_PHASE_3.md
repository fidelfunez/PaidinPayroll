# Quick Test Guide - Phase 3

## Prerequisites
1. Backend server running: `npm run dev` (in PaidIn App folder)
2. Frontend running: `npm run dev:client`
3. Logged in to the app

## Test 1: Fetch Satoshi's Genesis Transaction ⭐

**This is the simplest test - Satoshi's address has exactly 1 transaction!**

1. Go to Wallets page
2. Click "Add Wallet"
3. Enter:
   - **Name:** `Satoshi Genesis`
   - **Address/xpub:** `1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa`
4. Click "Add Wallet"
5. You should see the wallet card appear
6. Click "Fetch Transactions" button
7. Watch the button show spinner: "Fetching Transactions..."
8. Wait 5-10 seconds
9. Should see toast: **"Added 1 new transaction(s). 0 duplicates skipped."**
10. Go to Transactions page
11. Should see 1 received transaction:
    - Date: 1/3/2009 (or similar - genesis block)
    - Type: ↓ Received (green)
    - Amount: 50.00000000 BTC
    - USD Value: $0.00 (BTC had no value in 2009)
    - Transaction ID: Click it → opens Mempool.space
12. Click the transaction ID link → should open Mempool.space in new tab

**Expected Result:** ✅ 1 transaction fetched and displayed correctly

---

## Test 2: Fetch Empty Wallet

**Test that empty wallets are handled gracefully**

1. Go to Wallets page
2. Click "Add Wallet"
3. Enter:
   - **Name:** `Empty Test Wallet`
   - **Address/xpub:** `bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh`
4. Click "Add Wallet"
5. Click "Fetch Transactions"
6. Should see toast: **"Added 0 new transaction(s). 0 duplicates skipped."** or **"No transactions found for this wallet"**
7. Go to Transactions page
8. Should show: "Connect a wallet and fetch transactions to get started" (if first test)
   - Or just the Satoshi transaction from Test 1

**Expected Result:** ✅ No error, graceful empty state message

---

## Test 3: Duplicate Prevention

**Test that clicking fetch twice doesn't duplicate transactions**

1. Go to Wallets page
2. Find "Satoshi Genesis" wallet from Test 1
3. Click "Fetch Transactions" again
4. Wait 5-10 seconds
5. Should see toast: **"Added 0 new transaction(s). 1 duplicates skipped."**
6. Go to Transactions page
7. Should still see only 1 transaction (not 2)

**Expected Result:** ✅ Duplicates are detected and skipped

---

## Test 4: Filters Work

**Test the transaction filters**

1. Go to Transactions page
2. You should see Satoshi's transaction
3. **Test Type Filter:**
   - Change type filter to "Sent" → transaction disappears
   - Change back to "Received" → transaction appears
   - Change to "All Types" → transaction appears
4. **Test Wallet Filter:**
   - Select "Satoshi Genesis" wallet → transaction appears
   - Select "Empty Test Wallet" → transaction disappears
   - Select "All Wallets" → transaction appears
5. **Test Search:**
   - Type first 8 characters of transaction ID
   - Transaction should appear
   - Type random text
   - Transaction disappears

**Expected Result:** ✅ All filters work correctly

---

## Test 5: Transaction Link

**Test that Mempool.space links work**

1. Go to Transactions page
2. Click the transaction ID link (blue text with external link icon)
3. Should open new tab: `https://mempool.space/tx/[hash]`
4. Should show Satoshi's genesis block transaction on Mempool.space

**Expected Result:** ✅ Link opens correct page in new tab

---

## Test 6: Delete Wallet (Should Fail)

**Test that wallets with transactions can't be deleted**

1. Go to Wallets page
2. Try to delete "Satoshi Genesis" wallet (click trash icon)
3. Should see error: **"Cannot delete wallet with existing transactions"**
4. Wallet should still be there

**Expected Result:** ✅ Wallet with transactions is protected from deletion

---

## Optional: Test with Your Own Address

If you have a Bitcoin address with transactions:

1. Add your wallet
2. Click "Fetch Transactions"
3. Wait (may take longer if you have many transactions)
4. Check Transactions page
5. Verify:
   - Sent transactions show ↑ (red)
   - Received transactions show ↓ (green)
   - Amounts look correct
   - USD values look reasonable
   - Transaction links work

---

## What to Check in Console

Open browser DevTools (F12) and check Console tab:

**During fetch, you should see:**
```
Fetching transactions from: https://mempool.space/api/address/1A1z...
Need exchange rates for X unique dates
```

**Should NOT see:**
- Any red errors
- Any failed API calls (except maybe 401 if you're logged out)

---

## If Something Goes Wrong

### "Not Authenticated" error
- Make sure you're logged in
- Try refreshing the page
- Check localStorage has 'authToken'

### "Request timed out"
- Mempool.space might be slow
- Wait a minute and try again
- Check your internet connection

### "Rate limit exceeded"
- You made too many requests too quickly
- Wait 30 seconds and try again

### No transactions appear after successful fetch
- Check browser console for errors
- Make sure you're on the Transactions page (not Wallets page)
- Try refreshing the Transactions page

### Fetch button stuck on "Fetching..."
- Refresh the page
- Check backend terminal for errors
- Make sure backend is still running

---

## Success Criteria

If all 6 tests pass:
- ✅ Transaction fetching works
- ✅ Duplicate prevention works
- ✅ Filters work
- ✅ Links work
- ✅ Error handling works
- ✅ Data integrity maintained

**Phase 3 is ready for production!** 🎉
