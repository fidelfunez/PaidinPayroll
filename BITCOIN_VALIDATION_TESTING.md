# Bitcoin Validation Testing Guide

## Endpoint

```
POST http://localhost:8080/api/accounting/wallets/validate
Content-Type: application/json

{
  "input": "your-address-or-xpub-here"
}
```

## Test Cases

### ✅ Valid Bitcoin Addresses (Mainnet)

#### 1. Legacy P2PKH Address (starts with 1)
```bash
curl -X POST http://localhost:8080/api/accounting/wallets/validate \
  -H "Content-Type: application/json" \
  -d '{"input": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"}'
```
**Expected Result:**
```json
{
  "valid": true,
  "inputType": "address",
  "addressType": "p2pkh",
  "network": "mainnet",
  "description": "Legacy (P2PKH)",
  "message": "Valid p2pkh address for mainnet"
}
```
*Note: This is Satoshi's genesis block address!*

---

#### 2. P2SH Address (starts with 3)
```bash
curl -X POST http://localhost:8080/api/accounting/wallets/validate \
  -H "Content-Type: application/json" \
  -d '{"input": "3J98t1WpEZ73CNmYviecrnyiWrnqRhWNLy"}'
```
**Expected Result:**
```json
{
  "valid": true,
  "inputType": "address",
  "addressType": "p2sh",
  "network": "mainnet",
  "description": "Script Hash (P2SH)",
  "message": "Valid p2sh address for mainnet"
}
```

---

#### 3. Native SegWit P2WPKH (starts with bc1q)
```bash
curl -X POST http://localhost:8080/api/accounting/wallets/validate \
  -H "Content-Type: application/json" \
  -d '{"input": "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"}'
```
**Expected Result:**
```json
{
  "valid": true,
  "inputType": "address",
  "addressType": "p2wpkh",
  "network": "mainnet",
  "description": "Native SegWit (P2WPKH)",
  "message": "Valid p2wpkh address for mainnet"
}
```

---

#### 4. Taproot P2TR (starts with bc1p)
```bash
curl -X POST http://localhost:8080/api/accounting/wallets/validate \
  -H "Content-Type: application/json" \
  -d '{"input": "bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr"}'
```
**Expected Result:**
```json
{
  "valid": true,
  "inputType": "address",
  "addressType": "p2tr",
  "network": "mainnet",
  "description": "Taproot (P2TR)",
  "message": "Valid p2tr address for mainnet"
}
```

---

### ✅ Valid Extended Public Keys (xpub)

#### 5. xpub (BIP44 - Legacy)
```bash
curl -X POST http://localhost:8080/api/accounting/wallets/validate \
  -H "Content-Type: application/json" \
  -d '{"input": "xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz"}'
```
**Expected Result:**
```json
{
  "valid": true,
  "inputType": "xpub",
  "xpubType": "xpub",
  "network": "mainnet",
  "description": "Extended Public Key - Legacy (BIP44)",
  "sampleAddresses": [
    "1LqBGSKuX5yYUonjxT5qGfpUsXKYYWeabA",
    "1Ak8PffB2meyfYnbXZR9EGfLfFZVpzJvQP",
    "1MNF5RSaabFwcbtJirJwKnDytsXXEsVsNb"
  ],
  "message": "Valid xpub for mainnet"
}
```

---

#### 6. ypub (BIP49 - P2SH-SegWit)
```bash
curl -X POST http://localhost:8080/api/accounting/wallets/validate \
  -H "Content-Type: application/json" \
  -d '{"input": "ypub6Ww3ibxVfGzLrAH1PNcjyAWenMTbbAosGNB6VvmSEgytSER9azLDWCxoJwW7Ke7icmizBMXrzBx9979FfaHxHcrArf3zbeJJJUZPf663zsP"}'
```
**Expected Result:**
```json
{
  "valid": true,
  "inputType": "xpub",
  "xpubType": "ypub",
  "network": "mainnet",
  "description": "Extended Public Key - P2SH-SegWit (BIP49)",
  "sampleAddresses": [
    "37VucYSaXLCAsxYyAPfbSi9eh4iEcbShgf",
    "3LtMnn87fqUeHBUG414p9CWwnoV6E2pNKS",
    "32vWqV1d3cNaEttswCqFteGpfsFMvP8Z8n"
  ],
  "message": "Valid ypub for mainnet"
}
```

---

#### 7. zpub (BIP84 - Native SegWit)
```bash
curl -X POST http://localhost:8080/api/accounting/wallets/validate \
  -H "Content-Type: application/json" \
  -d '{"input": "zpub6rFR7y4Q2AijBEqTUquhVz398htDFrtymD9xYYfG1m4wAcvPhXNfE3EfH1r1ADqtfSdVCToUG868RvUUkgDKf31mGDtKsAYz2oz2AGutZYs"}'
```
**Expected Result:**
```json
{
  "valid": true,
  "inputType": "xpub",
  "xpubType": "zpub",
  "network": "mainnet",
  "description": "Extended Public Key - Native SegWit (BIP84)",
  "sampleAddresses": [
    "bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu",
    "bc1qnjg0jd8228aq7egyzacy8cys3knf9xvrerkf9g",
    "bc1q5shngj24323nsrmxv99st02na6srekfctt30ch"
  ],
  "message": "Valid zpub for mainnet"
}
```

---

### ✅ Valid Testnet Addresses

#### 8. Testnet P2PKH (starts with m or n)
```bash
curl -X POST http://localhost:8080/api/accounting/wallets/validate \
  -H "Content-Type: application/json" \
  -d '{"input": "mkHS9ne12qx9pS9VojpwU5xtRd4T7X7ZUt"}'
```
**Expected Result:**
```json
{
  "valid": true,
  "inputType": "address",
  "addressType": "p2pkh",
  "network": "testnet",
  "description": "Legacy (P2PKH)",
  "message": "Valid p2pkh address for testnet"
}
```

---

#### 9. Testnet SegWit (starts with tb1)
```bash
curl -X POST http://localhost:8080/api/accounting/wallets/validate \
  -H "Content-Type: application/json" \
  -d '{"input": "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx"}'
```
**Expected Result:**
```json
{
  "valid": true,
  "inputType": "address",
  "addressType": "p2wpkh",
  "network": "testnet",
  "description": "Native SegWit (P2WPKH)",
  "message": "Valid p2wpkh address for testnet"
}
```

---

### ❌ Invalid Test Cases

#### 10. Invalid Address (wrong checksum)
```bash
curl -X POST http://localhost:8080/api/accounting/wallets/validate \
  -H "Content-Type: application/json" \
  -d '{"input": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfN9"}'
```
**Expected Result:**
```json
{
  "valid": false,
  "inputType": "address",
  "error": "Invalid Bitcoin address format"
}
```

---

#### 11. Random String
```bash
curl -X POST http://localhost:8080/api/accounting/wallets/validate \
  -H "Content-Type: application/json" \
  -d '{"input": "thisisnotabitcoinaddress"}'
```
**Expected Result:**
```json
{
  "valid": false,
  "inputType": "address",
  "error": "Invalid Bitcoin address format"
}
```

---

#### 12. Empty Input
```bash
curl -X POST http://localhost:8080/api/accounting/wallets/validate \
  -H "Content-Type: application/json" \
  -d '{"input": ""}'
```
**Expected Result:**
```json
{
  "error": "Missing or invalid input",
  "usage": "POST with body: { input: 'address or xpub' }"
}
```

---

## Testing in Browser (Postman Alternative)

You can also test in your browser console or Postman:

```javascript
// Example in browser console or Postman
fetch('http://localhost:8080/api/accounting/wallets/validate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    input: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

---

## Quick Test Script

Save this as `test-validation.sh`:

```bash
#!/bin/bash

echo "🧪 Testing Bitcoin Validation Endpoint"
echo "======================================"
echo ""

echo "✅ Test 1: Legacy Address (Satoshi's address)"
curl -s -X POST http://localhost:8080/api/accounting/wallets/validate \
  -H "Content-Type: application/json" \
  -d '{"input": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"}' | jq
echo ""

echo "✅ Test 2: SegWit Address"
curl -s -X POST http://localhost:8080/api/accounting/wallets/validate \
  -H "Content-Type: application/json" \
  -d '{"input": "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"}' | jq
echo ""

echo "✅ Test 3: xpub (shows 3 sample derived addresses)"
curl -s -X POST http://localhost:8080/api/accounting/wallets/validate \
  -H "Content-Type: application/json" \
  -d '{"input": "xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz"}' | jq
echo ""

echo "❌ Test 4: Invalid Address"
curl -s -X POST http://localhost:8080/api/accounting/wallets/validate \
  -H "Content-Type: application/json" \
  -d '{"input": "notavalidaddress"}' | jq
echo ""

echo "✅ All tests complete!"
```

Then run:
```bash
chmod +x test-validation.sh
./test-validation.sh
```

---

## What to Test

1. ✅ **Legacy addresses** (starts with 1)
2. ✅ **P2SH addresses** (starts with 3)
3. ✅ **SegWit addresses** (starts with bc1q)
4. ✅ **Taproot addresses** (starts with bc1p)
5. ✅ **xpub/ypub/zpub** (should show sample derived addresses)
6. ✅ **Testnet addresses** (different prefixes)
7. ❌ **Invalid addresses** (should return error)
8. ❌ **Random strings** (should return error)

---

## Next Steps

Once validation works:
1. ✅ Update wallet creation to use validation before storing
2. ✅ Build transaction fetching from Mempool.space API
3. ✅ Display transactions with USD values
