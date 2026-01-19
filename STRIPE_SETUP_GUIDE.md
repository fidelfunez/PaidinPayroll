# Stripe Setup Guide for PaidIn

## Step 1: Create Stripe Products & Prices

Go to your Stripe Dashboard → Products → Add Product

### Create Products (one for each plan):

#### 1. Starter Plan
- **Product Name**: `Starter`
- **Description**: `For small teams - Up to 10 employees`
- **Pricing Model**: Standard pricing
- **Recurring**: Yes
- **Price**: 
  - **Monthly**: $149.99 USD (billing period: Monthly)
  - **Annual**: $1,499.99 USD (billing period: Yearly)
- **Billing Period**: Create TWO prices (one monthly, one annual)
- After creating, **copy the Price IDs** (they start with `price_`)

#### 2. Growth Plan
- **Product Name**: `Growth`
- **Description**: `For growing businesses - Up to 50 employees`
- **Pricing Model**: Standard pricing
- **Recurring**: Yes
- **Price**: 
  - **Monthly**: $499.99 USD (billing period: Monthly)
  - **Annual**: $4,999.99 USD (billing period: Yearly)
- **Billing Period**: Create TWO prices (one monthly, one annual)
- After creating, **copy the Price IDs** (they start with `price_`)

#### 3. Scale Plan
- **Product Name**: `Scale`
- **Description**: `For scaling companies - Up to 100 employees`
- **Pricing Model**: Standard pricing
- **Recurring**: Yes
- **Price**: 
  - **Monthly**: $999.99 USD (billing period: Monthly)
  - **Annual**: $9,999.99 USD (billing period: Yearly)
- **Billing Period**: Create TWO prices (one monthly, one annual)
- After creating, **copy the Price IDs** (they start with `price_`)

### 📋 What You Need to Share:
After creating all products, share with me:
- `starter_monthly_price_id`: price_xxxxx
- `starter_annual_price_id`: price_xxxxx
- `growth_monthly_price_id`: price_xxxxx
- `growth_annual_price_id`: price_xxxxx
- `scale_monthly_price_id`: price_xxxxx
- `scale_annual_price_id`: price_xxxxx

---

## Step 2: Set Up Webhook Endpoint

### 2.1 Find Your Backend URL
Based on your Fly.io setup, your backend URL should be:
- `https://paidin-app.fly.dev` (or check your Fly.io dashboard)

### 2.2 Create Webhook in Stripe
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click **"Add endpoint"**
3. **Endpoint URL**: `https://paidin-app.fly.dev/api/webhooks/stripe`
   (Replace with your actual Fly.io backend URL if different)
4. **Description**: `PaidIn Subscription Webhooks`
5. **Events to send**: Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `payment_method.attached`
   - `setup_intent.succeeded`
6. Click **"Add endpoint"**

### 2.3 Get Webhook Secret
1. After creating the endpoint, click on it
2. In the **"Signing secret"** section, click **"Reveal"**
3. Copy the secret (starts with `whsec_...`)
4. **Share this secret with me** - we'll add it to your environment variables

---

## Step 3: Update Environment Variables

### Update your `.env` file in the PaidIn App project:

```env
# Stripe Configuration (LIVE MODE)
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_STRIPE_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

### Also update Fly.io secrets:

```bash
fly secrets set STRIPE_SECRET_KEY="sk_live_YOUR_STRIPE_SECRET_KEY_HERE"
fly secrets set STRIPE_PUBLISHABLE_KEY="pk_live_YOUR_STRIPE_PUBLISHABLE_KEY_HERE"
fly secrets set STRIPE_WEBHOOK_SECRET="whsec_YOUR_WEBHOOK_SECRET_HERE"
```

---

## Step 4: Test Webhook (After Implementation)

1. Use Stripe CLI to forward webhooks to your local server (for testing):
   ```bash
   stripe listen --forward-to http://localhost:8080/api/webhooks/stripe
   ```

2. Or use Stripe Dashboard → Webhooks → Send test webhook to test events

---

## What's Next?

Once you've:
1. ✅ Created all Products & Prices in Stripe
2. ✅ Set up the Webhook endpoint
3. ✅ Shared the Price IDs and Webhook Secret with me

I'll:
- Add the Price IDs to the code
- Complete the payment/subscription implementation
- Test the full flow
- Deploy everything!

Let me know when you have the Price IDs ready! 🚀