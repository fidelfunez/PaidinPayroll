# 🎭 Three-Tier Role System Testing Guide

## 🚀 Quick Start

1. **Start the server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Open your browser** to `http://localhost:8080`

## 👥 Test User Credentials

| Role | Email | Username | Password | Expected Navigation |
|------|-------|----------|----------|-------------------|
| **Super Admin** | superadmin@paidin.com | superadmin | test123 | Treasury Management + All Admin Features |
| **Admin** | admin@paidin.com | admin | test123 | Admin Features (NO Bitcoin Access) |
| **Employee** | employee@paidin.com | employee | test123 | Personal Features Only |

## 🧪 Testing Checklist

### 1. Super Admin Testing (👑)

**Login as:** `superadmin@paidin.com` / `test123`

**Expected Navigation:**
- ✅ **Treasury Management** section (NEW!)
  - Bitcoin Wallet
  - Payment Processing
  - Transaction History
  - Bitcoin Settings
- ✅ **Overview** section
  - Dashboard
  - Employees
  - Financial Analytics (NEW!)
- ✅ **Finance & Payroll** section
  - Payroll
  - Bulk Payroll
  - Reimbursements
  - Withdrawal Methods
- ✅ All other admin sections

**Test Actions:**
1. Click on "Bitcoin Wallet" - should show wallet page
2. Click on "Payment Processing" - should show payment processing page
3. Click on "Transaction History" - should show transaction history
4. Click on "Bitcoin Settings" - should show Bitcoin configuration
5. Click on "Financial Analytics" - should show financial dashboard

### 2. Admin Testing (👨‍💼)

**Login as:** `admin@paidin.com` / `test123`

**Expected Navigation:**
- ❌ **NO Treasury Management** section
- ✅ **Overview** section
  - Dashboard
  - Employees
  - Analytics (NOT Financial Analytics)
- ✅ **Finance & Payroll** section
  - Payroll Schedule (NOT direct Bitcoin access)
  - Bulk Payroll
  - Reimbursements
  - Withdrawal Methods
- ✅ All other admin sections

**Test Actions:**
1. Verify NO "Treasury Management" section in sidebar
2. Try to access Super Admin pages directly:
   - Go to `/bitcoin-settings` - should show "Access Denied"
   - Go to `/process-payments` - should show "Access Denied"
   - Go to `/transactions` - should show "Access Denied"
   - Go to `/financial-analytics` - should show "Access Denied"

### 3. Employee Testing (👷‍♂️)

**Login as:** `employee@paidin.com` / `test123`

**Expected Navigation:**
- ❌ **NO Treasury Management** section
- ❌ **NO Admin sections**
- ✅ **Overview** section
  - Dashboard
  - My Expenses
  - Invoices
- ✅ **Time & Leave** section
  - Time Tracking
  - Time Off
- ✅ **Personal** section
  - Profile
  - Files
  - Benefits
- ✅ **Accounting** section
  - Financial Dashboard (personal only)
- ✅ **Finance & Tax** section
  - Withdrawal Method
  - Tax & Compliance
- ✅ **Communication** section
  - Notifications
  - Messages
- ✅ **Help Center** section
- ✅ **Settings** section

**Test Actions:**
1. Verify limited navigation (no admin features)
2. Try to access Super Admin pages directly:
   - Go to `/bitcoin-settings` - should show "Access Denied"
   - Go to `/process-payments` - should show "Access Denied"
   - Go to `/transactions` - should show "Access Denied"
   - Go to `/financial-analytics` - should show "Access Denied"
3. Try to access Admin pages directly:
   - Go to `/employees` - should show "Access Denied" or limited view
   - Go to `/payroll` - should show "Access Denied" or limited view

## 🔐 API Testing (Optional)

You can also test the backend permissions using curl or Postman:

### Test Super Admin Endpoints
```bash
# Login as super admin first, then test these endpoints
curl -X GET http://localhost:8080/api/lightning/balance \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"

curl -X POST http://localhost:8080/api/payroll/1/create-lightning-invoice \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

### Test Admin Endpoints (Should Work)
```bash
# Login as admin, these should work
curl -X GET http://localhost:8080/api/payroll \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"

curl -X GET http://localhost:8080/api/employees \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

### Test Super Admin Endpoints as Admin (Should Fail)
```bash
# Login as admin, these should return 403 Forbidden
curl -X GET http://localhost:8080/api/lightning/balance \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"

curl -X POST http://localhost:8080/api/payroll/1/create-lightning-invoice \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

## ✅ Success Criteria

### Super Admin
- [ ] Can see "Treasury Management" section
- [ ] Can access all Bitcoin-related pages
- [ ] Can see "Financial Analytics" instead of just "Analytics"
- [ ] Has full access to all admin features

### Admin
- [ ] Cannot see "Treasury Management" section
- [ ] Gets "Access Denied" when trying to access Super Admin pages
- [ ] Can access all regular admin features
- [ ] Cannot execute Bitcoin operations

### Employee
- [ ] Cannot see admin sections
- [ ] Gets "Access Denied" when trying to access admin/Super Admin pages
- [ ] Can access personal features only
- [ ] Limited to employee-specific functionality

## 🎯 Key Security Features to Verify

1. **Separation of Duties**: Admin can manage data but not move Bitcoin
2. **Principle of Least Privilege**: Each role has minimum required access
3. **Clear Visual Indicators**: "Super Admin Only" badges on restricted pages
4. **Backend Protection**: API endpoints properly restricted
5. **Frontend Protection**: Pages show access denied for unauthorized roles

## 🐛 Troubleshooting

If something doesn't work as expected:

1. **Check browser console** for JavaScript errors
2. **Check server logs** for backend errors
3. **Verify user roles** in the database
4. **Clear browser cache** and try again
5. **Check network tab** for failed API calls

## 🎉 Expected Result

You should see three completely different navigation experiences:
- **Super Admin**: Full access including Bitcoin treasury management
- **Admin**: HR/accounting access but no Bitcoin operations
- **Employee**: Personal features only

This demonstrates the security and usability of your three-tier Bitcoin payroll system!
