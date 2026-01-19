// Stripe Price IDs configuration
// These map to the products created in Stripe Dashboard

export const STRIPE_PRICE_IDS = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || 'price_1Sei2FCSV1n6TiB5ng9RsH3f',
    annual: process.env.STRIPE_PRICE_STARTER_ANNUAL || 'price_1Sei2FCSV1n6TiB56rZz8ZYG',
  },
  growth: {
    monthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY || 'price_1SeiALCSV1n6TiB5pTCrTSL0',
    annual: process.env.STRIPE_PRICE_GROWTH_ANNUAL || 'price_1SeiALCSV1n6TiB5KfSLBDg6',
  },
  scale: {
    monthly: process.env.STRIPE_PRICE_SCALE_MONTHLY || 'price_1SeiDJCSV1n6TiB5RX6a8Si7',
    annual: process.env.STRIPE_PRICE_SCALE_ANNUAL || 'price_1SeiDJCSV1n6TiB5oqK2k3Bh',
  },
} as const;

export type PlanName = keyof typeof STRIPE_PRICE_IDS;
export type BillingCycle = 'monthly' | 'annual';

/**
 * Get Stripe Price ID for a plan and billing cycle
 */
export function getStripePriceId(plan: PlanName, billingCycle: BillingCycle): string {
  return STRIPE_PRICE_IDS[plan][billingCycle];
}

/**
 * Get plan name from Stripe Price ID
 */
export function getPlanFromPriceId(priceId: string): { plan: PlanName; billingCycle: BillingCycle } | null {
  for (const [plan, prices] of Object.entries(STRIPE_PRICE_IDS)) {
    if (prices.monthly === priceId) {
      return { plan: plan as PlanName, billingCycle: 'monthly' };
    }
    if (prices.annual === priceId) {
      return { plan: plan as PlanName, billingCycle: 'annual' };
    }
  }
  return null;
}
