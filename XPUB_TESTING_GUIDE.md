# xPub Support Testing Guide

## What's New
✅ **xPub/HD Wallet Support** - Fetch ALL transactions from an HD wallet with one click!

Instead of adding individual addresses one by one, you can now add your wallet's xpub (extended public key) and automatically fetch transactions from ALL addresses in your wallet.

---

## How to Get Your xPub

### BlueWallet
1. Open BlueWallet
2. Select your wallet
3. Tap the 3 dots (⋯) menu
4. Tap "Export/Backup"
5. Scroll down to "Show Master Fingerprint and XPUB"
6. Choose the xpub type:
   - **zpub** - Native SegWit (bc1... addresses) - RECOMMENDED
   - **ypub** - Wrapped SegWit (3... addresses)
   - **xpub** - Legacy (1... addresses)
7. Copy the full xpub string (starts with zpub/ypub/xpub)

### Other Wallets
- **Electrum**: Wallet menu → Information → Master Public Key
- **Ledger Live**: Account → Wrench icon → Advanced → Extended Public Key
- **Trezor Suite**: Account settings → Show public key

---

## Testing Steps

### Test 1: Add Your BlueWallet xPub

1. Go to **Wallets** page in PaidIn
2. Click "Add Wallet"
3. Enter:
   - **Name:** My BlueWallet
   - **xpub:** (paste your zpub/ypub/xpub)
4. Click "Add Wallet"
5. You should see it validated and added with type "xPub"

### Test 2: Fetch All Transactions

1. Find your newly added wallet
2. Click **"Fetch Transactions"**
3. You should see: "Scanning Wallet Addresses..." (may take 10-60 seconds)
4. Watch the backend terminal for progress logs:
   ```
   Deriving addresses 0 to 19...
   Checking addresses 0 to 19 for transactions...
   ✓ Address bc1q... has 2 transaction(s)
   Batch 0-19 completed in 8523ms
   ```
5. Wait for completion

### Test 3: Verify Results

1. Check the success toast - should show:
   - "Added X new transaction(s)"
   - Number should match your BlueWallet transaction count
2. Go to **Transactions** page
3. Verify transactions match your BlueWallet:
   - Same dates
   - Same amounts
   - Same types (sent/received)

---

## What to Expect

### Small Wallet (1-10 transactions)
- **Time:** 5-15 seconds
- **Addresses checked:** 20-40
- **What you'll see:** "Checking addresses 0-19..." then done

### Medium Wallet (10-50 transactions)
- **Time:** 15-30 seconds  
- **Addresses checked:** 40-80
- **What you'll see:** Multiple batches logged in terminal

### Large Wallet (100+ transactions)
- **Time:** 30-60 seconds
- **Addresses checked:** 100+
- **What you'll see:** Many batches, progress through terminal logs

### Empty/Fresh Wallet
- **Time:** 5-10 seconds
- **Addresses checked:** 20 (gap limit reached immediately)
- **What you'll see:** "No transactions found"

---

## Behind The Scenes (Gap Limit Algorithm)

The system uses the **BIP44 gap limit standard**:

1. Start at address index 0
2. Derive 20 addresses (batch)
3. Check each for transactions
4. If ANY have transactions → derive next batch (20-39)
5. If ALL 20 are empty → STOP (gap limit reached)

This is how Bitcoin wallets know when to stop looking for more addresses!

**Example:**
```
Addresses 0-19:   5 have transactions  → Continue
Addresses 20-39:  2 have transactions  → Continue  
Addresses 40-59:  0 have transactions  → STOP (gap limit)
Total checked: 60 addresses
```

---

## Troubleshooting

### "Error: Invalid xpub"
- Double-check you copied the FULL xpub (not just part of it)
- Make sure it starts with xpub/ypub/zpub/tpub/upub/vpub
- No spaces or extra characters

### "Added 0 transactions" but you have transactions
- You might have given the wrong xpub type
- Try a different xpub format (zpub vs ypub vs xpub)
- Your transactions might be on a different account/wallet

### Takes longer than 60 seconds
- Check backend terminal logs - is it still working?
- Very active wallets (200+ addresses) can take longer
- If stuck, restart backend and try again

### "Request timed out"
- Mempool.space might be slow
- Wait a minute and try again
- Check your internet connection

---

## Advanced: Testing with Known xPub

If you want to test without using your real wallet, you can use test xpubs:

**Note:** Finding valid public test xpubs is difficult since most are private. Best to test with your own wallet's xpub.

---

## Expected Backend Logs

When fetching an xPub, you should see detailed logs:

```
Fetching transactions for wallet 3 (My BlueWallet)
Type: xPub (HD Wallet), Network: mainnet
Scanning HD wallet (xpub)...
Starting xpub scan for zpub6rFR7y4Q2AijBEq... on mainnet
Deriving addresses 0 to 19...
Checking addresses 0 to 19 for transactions...
  ✓ Address bc1qcr8te4kr609gcawu... has 1 transaction(s)
  ✓ Address bc1qnjg0jd8228aq7egy... has 2 transaction(s)
  Batch 0-19 completed in 8234ms
Deriving addresses 20 to 39...
Checking addresses 20 to 39 for transactions...
  No transactions found in this batch. Gap counter: 20/20
✓ Reached gap limit of 20 consecutive empty addresses. Scan complete.
Scan summary: Checked 40 addresses, found 2 with transactions
Total unique transactions: 3
Calculating USD values for 3 transactions...
✓ xpub scan complete. Found 3 transactions.
Fetched 3 transactions from blockchain
3 new transactions (0 duplicates skipped)
Successfully added 3 transactions
```

---

## Success Criteria

✅ xPub wallet added successfully  
✅ Fetch button shows "Scanning Wallet Addresses..."  
✅ Backend logs show progress through address batches  
✅ All transactions found (matches BlueWallet count)  
✅ Transactions display correctly on Transactions page  
✅ Can fetch again without duplicating transactions  

---

## What This Means for Matthew

**Before xPub support:**
- "Give me all your addresses with transactions"
- Manual, error-prone, incomplete

**After xPub support:**
- "Give me your wallet's xpub"
- Automatic, complete, perfect

This is **critical** for the MVP because most Bitcoin users use HD wallets (BlueWallet, Ledger, Electrum, etc.). Without xPub support, they'd have to manually find and add dozens of addresses!

---

## Phase 3 Now COMPLETE! 🎉

With xPub support, Phase 3 Transaction Fetching is fully complete:
- ✅ Single address fetching
- ✅ xPub/HD wallet fetching
- ✅ Sent/received transaction parsing
- ✅ USD value calculation
- ✅ Display with filters
- ✅ Blockchain explorer links
- ✅ Duplicate detection
- ✅ Error handling

## Phase 4 Status: COMPLETE! 🎉

**Phase 4: Categories + QuickBooks Export + Cost Basis** ✅
- ✅ Transaction categorization
- ✅ QuickBooks CSV export
- ✅ FIFO cost basis calculation
- ✅ Capital gains/loss tracking

**See `PHASE_4_COMPLETE.md` for full implementation details!**
