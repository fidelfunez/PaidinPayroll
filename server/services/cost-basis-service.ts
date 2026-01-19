import { db } from "../db.js";
import { purchases, transactions, transactionLots } from "@shared/schema";
import { eq, and, gte, desc } from "drizzle-orm";

export interface TransactionLot {
  purchaseId: number;
  btcUsed: number;
  costBasisUsed: number;
  purchaseDate: Date;
  originalPurchasePricePerBtc: number;
}

export interface FIFOCostBasisResult {
  totalCostBasisUsd: number;
  lots: TransactionLot[];
  insufficientBtc: boolean;
  amountMatched: number;
  amountRequested: number;
}

/**
 * Calculate FIFO cost basis for a sent transaction
 * Matches transaction amount against purchases (oldest first)
 */
export async function calculateFIFOCostBasis(
  transactionId: number,
  companyId: number
): Promise<FIFOCostBasisResult | null> {
  // Get the transaction
  const [transaction] = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.id, transactionId),
        eq(transactions.companyId, companyId)
      )
    )
    .limit(1);

  if (!transaction) {
    return null;
  }

  // Only calculate cost basis for "sent" transactions
  if (transaction.txType !== 'sent') {
    return null;
  }

  const amountRequested = parseFloat(transaction.amountBtc.toString());
  if (amountRequested <= 0) {
    return null;
  }

  // Get all purchases with remaining BTC (oldest first for FIFO)
  const availablePurchases = await db
    .select()
    .from(purchases)
    .where(
      and(
        eq(purchases.companyId, companyId),
        gte(purchases.remainingBtc, 0.00000001) // At least 1 satoshi
      )
    )
    .orderBy(purchases.purchaseDate); // Oldest first for FIFO

  if (availablePurchases.length === 0) {
    return {
      totalCostBasisUsd: 0,
      lots: [],
      insufficientBtc: true,
      amountMatched: 0,
      amountRequested,
    };
  }

  // FIFO matching algorithm
  let amountNeeded = amountRequested;
  const lots: TransactionLot[] = [];
  let totalCostBasisUsd = 0;

  for (const purchase of availablePurchases) {
    if (amountNeeded <= 0) break;

    const purchaseAmount = parseFloat(purchase.amountBtc.toString());
    const purchaseCostBasis = parseFloat(purchase.costBasisUsd.toString());
    const remainingBtc = parseFloat(purchase.remainingBtc.toString());
    const pricePerBtc = purchaseAmount > 0 ? purchaseCostBasis / purchaseAmount : 0;

    if (remainingBtc <= 0) continue;

    let btcUsed: number;
    let costBasisUsed: number;

    if (remainingBtc >= amountNeeded) {
      // Use entire amountNeeded from this purchase
      btcUsed = amountNeeded;
      costBasisUsed = btcUsed * pricePerBtc;
      amountNeeded = 0;
    } else {
      // Use entire remainingBtc from this purchase
      btcUsed = remainingBtc;
      costBasisUsed = btcUsed * pricePerBtc;
      amountNeeded -= remainingBtc;
    }

    lots.push({
      purchaseId: purchase.id,
      btcUsed,
      costBasisUsed,
      purchaseDate: purchase.purchaseDate,
      originalPurchasePricePerBtc: pricePerBtc,
    });

    totalCostBasisUsd += costBasisUsed;
  }

  const amountMatched = amountRequested - amountNeeded;
  const insufficientBtc = amountNeeded > 0;

  return {
    totalCostBasisUsd,
    lots,
    insufficientBtc,
    amountMatched,
    amountRequested,
  };
}

/**
 * Create transaction lots in database
 */
export async function createTransactionLots(
  transactionId: number,
  lots: TransactionLot[],
  companyId: number
): Promise<void> {
  if (lots.length === 0) return;

  // Insert all lots
  await db.insert(transactionLots).values(
    lots.map((lot) => ({
      transactionId,
      purchaseId: lot.purchaseId,
      btcAmountUsed: lot.btcUsed,
      costBasisUsed: lot.costBasisUsed,
      createdAt: new Date(),
    }))
  );

  // Update purchase remainingBtc values
  for (const lot of lots) {
    const [purchase] = await db
      .select()
      .from(purchases)
      .where(eq(purchases.id, lot.purchaseId))
      .limit(1);

    if (purchase) {
      const currentRemaining = parseFloat(purchase.remainingBtc.toString());
      const newRemaining = Math.max(0, currentRemaining - lot.btcUsed);

      await db
        .update(purchases)
        .set({ remainingBtc: newRemaining })
        .where(eq(purchases.id, lot.purchaseId));
    }
  }
}

/**
 * Check if transaction already has cost basis calculated (has transaction lots)
 */
export async function hasTransactionLots(
  transactionId: number,
  companyId: number
): Promise<boolean> {
  const [transaction] = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.id, transactionId),
        eq(transactions.companyId, companyId)
      )
    )
    .limit(1);

  if (!transaction) return false;

  const existingLots = await db
    .select()
    .from(transactionLots)
    .where(eq(transactionLots.transactionId, transactionId))
    .limit(1);

  return existingLots.length > 0;
}

/**
 * Get existing transaction lots for a transaction
 */
export async function getTransactionLots(
  transactionId: number,
  companyId: number
): Promise<Array<{
  id: number;
  purchaseId: number;
  btcAmountUsed: number;
  costBasisUsed: number;
  purchase: {
    id: number;
    purchaseDate: Date;
    amountBtc: number;
    costBasisUsd: number;
  };
}>> {
  // Verify transaction belongs to company
  const [transaction] = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.id, transactionId),
        eq(transactions.companyId, companyId)
      )
    )
    .limit(1);

  if (!transaction) {
    return [];
  }

  // Get transaction lots
  const lots = await db
    .select()
    .from(transactionLots)
    .where(eq(transactionLots.transactionId, transactionId));

  // Get purchase details for each lot
  const lotsWithPurchases = await Promise.all(
    lots.map(async (lot) => {
      const [purchase] = await db
        .select()
        .from(purchases)
        .where(eq(purchases.id, lot.purchaseId))
        .limit(1);

      return {
        id: lot.id,
        purchaseId: lot.purchaseId,
        btcAmountUsed: lot.btcAmountUsed,
        costBasisUsed: lot.costBasisUsed,
        purchase: purchase ? {
          id: purchase.id,
          purchaseDate: purchase.purchaseDate,
          amountBtc: purchase.amountBtc,
          costBasisUsd: purchase.costBasisUsd,
        } : null,
      };
    })
  );

  return lotsWithPurchases.filter((lot) => lot.purchase !== null) as Array<{
    id: number;
    purchaseId: number;
    btcAmountUsed: number;
    costBasisUsed: number;
    purchase: {
      id: number;
      purchaseDate: Date;
      amountBtc: number;
      costBasisUsd: number;
    };
  }>;
}
