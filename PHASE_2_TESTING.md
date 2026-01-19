# Testing Phase 2: Wallet Storage

## Quick Test Guide

### Prerequisites
1. Backend running: `npm run dev`
2. Frontend running: `npm run dev:client`
3. Browser open to: `http://localhost:5173/wallets`

### Test 1: Add Valid Address ✅
1. Click "Add Wallet"
2. Name: "My Bitcoin Wallet"
3. Input: `1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa` (Satoshi's address from test page)
4. Click "Add Wallet"
5. **Expected:** Modal closes, success toast, wallet appears in list

**Verify:**
- ✅ Wallet name is "My Bitcoin Wallet"
- ✅ Type shows "Address"
- ✅ Network badge shows "mainnet"
- ✅ Address is truncated: `1A1zP1eP5QGe...DivfNa`
- ✅ Bitcoin icon displayed

### Test 2: Add Valid xpub ✅
1. Click "Add Wallet"
2. Name: "Business Account"
3. Input: `xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz`
4. Click "Add Wallet"
5. **Expected:** Success

**Verify:**
- ✅ Type shows "Extended Public Key"
- ✅ Key icon displayed (not Bitcoin icon)
- ✅ xpub is truncated

### Test 3: Add Invalid Address ❌
1. Click "Add Wallet"
2. Name: "Test"
3. Input: `invalid-address-here`
4. Click "Add Wallet"
5. **Expected:** Red error banner shows "Invalid Bitcoin address format"
6. **Modal stays open** for correction

### Test 4: Add Duplicate ❌
1. Try adding the same address from Test 1 again
2. **Expected:** Error: "This wallet is already connected"

### Test 5: Empty Fields ❌
1. Click "Add Wallet"
2. Leave name or input empty
3. Click "Add Wallet"
4. **Expected:** Error: "Please provide both wallet name and address/xpub"

### Test 6: Delete Wallet ✅
1. Click trash icon on any wallet card
2. Confirmation dialog appears
3. Click "Delete"
4. **Expected:** Wallet removed, success toast

### Test 7: Cancel Delete ✅
1. Click trash icon
2. Click "Cancel" in dialog
3. **Expected:** Dialog closes, wallet remains

## What to Look For

### UI Polish ✅
- Modal has white solid background (from earlier fix)
- Orange accent buttons
- Proper spacing and padding
- Responsive grid (1 column mobile, 2 columns desktop)

### Error Handling ✅
- Inline validation errors in modal (red banner)
- Can't delete if transactions exist (Phase 3 will test this)
- Can't add duplicates
- Can't add invalid addresses

### Data Display ✅
- Wallet name
- Type (Address vs Extended Public Key)
- Network badge (color-coded)
- Truncated address/xpub
- Created date
- Proper icons (Bitcoin vs Key)

## Known Limitations (By Design)

1. **Lightning wallets not supported yet** - Only on-chain for MVP
2. **No transaction count shown** - Will add in Phase 3
3. **Can't edit wallet name** - Can delete and re-add if needed
4. **No wallet balance** - Phase 3 will fetch transactions

## Next Phase Preview

**Phase 3 will add:**
- Fetch transaction history from blockchain APIs
- Display transaction count on wallet cards
- Show last transaction date
- Scan xpub-derived addresses
- Store all transactions in database

---

**All tests passing?** 🎉 **Phase 2 is complete! Ready for Phase 3!**
