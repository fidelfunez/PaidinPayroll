import { Router } from "express";
import { db } from "../../db.js";
import { wallets, transactions, categories, purchases, transactionLots, exchangeRates } from "@shared/schema";
import { eq, and, desc, sql, inArray, gte, lte } from "drizzle-orm";
import { getExchangeRate, batchGetExchangeRates, getCurrentRate } from "./exchange-rate-service.js";
import { validateBitcoinAddress, validateXpub, deriveAddressesFromXpub, getAddressTypeDescription } from "./bitcoin-validator.js";
import { fetchAndProcessTransactions, fetchXpubTransactions } from "../../services/transaction-service.js";
import { 
  calculateFIFOCostBasis, 
  createTransactionLots, 
  hasTransactionLots, 
  getTransactionLots
} from "../../services/cost-basis-service.js";
import { requireAuth } from "../../auth.js";

const router = Router();

// Apply authentication middleware to all accounting routes
router.use(requireAuth);

// ===========================
// WALLETS
// ===========================

// Validate Bitcoin address or xpub
router.post("/wallets/validate", async (req, res) => {
  try {
    const { input } = req.body;
    
    if (!input || typeof input !== 'string') {
      return res.status(400).json({ 
        valid: false,
        error: "Missing or invalid input"
      });
    }

    const trimmedInput = input.trim();

    // Check if it's an xpub
    const xpubPrefixes = ['xpub', 'ypub', 'zpub', 'tpub', 'upub', 'vpub'];
    const isXpub = xpubPrefixes.some(prefix => trimmedInput.startsWith(prefix));

    if (isXpub) {
      // Validate as xpub
      const result = validateXpub(trimmedInput);
      
      if (result.valid) {
        // Derive first few addresses as preview
        const sampleAddresses = deriveAddressesFromXpub(trimmedInput, 3);
        
        return res.json({
          valid: true,
          inputType: 'xpub',
          xpubType: result.type,
          network: result.network,
          description: getAddressTypeDescription(result.type!),
          sampleAddresses: sampleAddresses,
          message: `Valid ${result.type} for ${result.network}`
        });
      } else {
        return res.json({
          valid: false,
          inputType: 'xpub',
          error: result.error
        });
      }
    } else {
      // Validate as address
      const result = validateBitcoinAddress(trimmedInput);
      
      if (result.valid) {
        return res.json({
          valid: true,
          inputType: 'address',
          addressType: result.type,
          network: result.network,
          description: getAddressTypeDescription(result.type!),
          message: `Valid ${result.type} address for ${result.network}`
        });
      } else {
        return res.json({
          valid: false,
          inputType: 'address',
          error: result.error
        });
      }
    }
  } catch (error: any) {
    console.error("Error validating Bitcoin input:", error);
    res.status(500).json({ 
      error: "Validation failed",
      message: error.message 
    });
  }
});

// Get all wallets for current user's company
// Query param: ?includeArchived=true to include archived wallets (for display purposes)
router.get("/wallets", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const companyId = req.user.companyId || req.user.company?.id;
    if (!companyId) {
      console.error("User authenticated but no companyId:", { userId: req.user.id, user: req.user });
      return res.status(400).json({ error: "User account is not associated with a company. Please contact support." });
    }

    const includeArchived = req.query.includeArchived === 'true';

    const whereConditions = [eq(wallets.companyId, companyId)];
    
    // Only filter by isActive if not including archived wallets
    if (!includeArchived) {
      whereConditions.push(eq(wallets.isActive, true));
    }

    const userWallets = await db
      .select()
      .from(wallets)
      .where(and(...whereConditions))
      .orderBy(desc(wallets.createdAt));

    res.json(userWallets);
  } catch (error: any) {
    console.error("Error fetching wallets:", error);
    res.status(500).json({ error: "Failed to fetch wallets" });
  }
});

// Create new wallet
router.post("/wallets", async (req, res) => {
  try {
    const userId = req.user?.id;
    const companyId = req.user?.companyId;
    
    if (!userId || !companyId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { input, name } = req.body;

    // Validate required fields
    if (!input || !name) {
      return res.status(400).json({ 
        valid: false,
        error: "Missing required fields: input and name" 
      });
    }

    if (typeof input !== 'string' || typeof name !== 'string') {
      return res.status(400).json({ 
        valid: false,
        error: "Input and name must be strings" 
      });
    }

    const trimmedInput = input.trim();
    const trimmedName = name.trim();

    if (!trimmedInput || !trimmedName) {
      return res.status(400).json({ 
        valid: false,
        error: "Input and name cannot be empty" 
      });
    }

    // Validate Bitcoin address or xpub
    const xpubPrefixes = ['xpub', 'ypub', 'zpub', 'tpub', 'upub', 'vpub'];
    const isXpub = xpubPrefixes.some(prefix => trimmedInput.startsWith(prefix));
    
    let validationResult;
    let network: string;
    let inputType: string;

    if (isXpub) {
      validationResult = validateXpub(trimmedInput);
      if (!validationResult.valid) {
        return res.status(400).json({
          valid: false,
          error: validationResult.error || 'Invalid extended public key'
        });
      }
      network = validationResult.network || 'mainnet';
      inputType = 'xpub';
    } else {
      validationResult = validateBitcoinAddress(trimmedInput);
      if (!validationResult.valid) {
        return res.status(400).json({
          valid: false,
          error: validationResult.error || 'Invalid Bitcoin address'
        });
      }
      network = validationResult.network || 'mainnet';
      inputType = 'address';
    }

    // Check for duplicates (check ALL wallets, including archived)
    const existingWallet = await db
      .select()
      .from(wallets)
      .where(
        and(
          eq(wallets.companyId, companyId),
          eq(wallets.walletData, trimmedInput)
          // No isActive filter - check all wallets (active and archived) for duplicates
        )
      )
      .limit(1);

    if (existingWallet.length > 0) {
      const wallet = existingWallet[0];
      const status = wallet.isActive ? 'connected' : 'archived';
      return res.status(400).json({
        valid: false,
        error: `This address is already ${status}. You cannot add the same address twice.`
      });
    }

    // Create wallet
    const [newWallet] = await db
      .insert(wallets)
      .values({
        userId,
        companyId,
        walletType: 'on-chain',
        walletData: trimmedInput,
        name: trimmedName,
        network,
        isActive: true, // Explicitly set active for new wallets
        deletedAt: null,
        createdAt: new Date(),
      })
      .returning();

    res.status(201).json({
      success: true,
      wallet: {
        ...newWallet,
        inputType,
        validationType: isXpub ? validationResult.type : validationResult.type,
      }
    });
  } catch (error: any) {
    console.error("Error creating wallet:", error);
    console.error("Error stack:", error.stack);
    console.error("Request user:", req.user ? { id: req.user.id, companyId: req.user.companyId, company: req.user.company } : 'no user');
    console.error("Request body:", { input: req.body?.input?.substring(0, 20) + '...', name: req.body?.name });
    
    // Return error with message in production too (for debugging)
    res.status(500).json({ 
      valid: false,
      error: "Failed to create wallet",
      message: error.message || "Unknown error",
      // Include error details in production for now to help debug
      details: error.message
    });
  }
});

// Archive wallet (soft delete)
router.patch("/wallets/:id/archive", async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    
    if (!companyId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const walletId = parseInt(req.params.id);
    
    if (isNaN(walletId)) {
      return res.status(400).json({ error: "Invalid wallet ID" });
    }

    // Check wallet exists and belongs to this company
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(
        and(
          eq(wallets.id, walletId),
          eq(wallets.companyId, companyId)
        )
      )
      .limit(1);

    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    // Check if already archived
    if (!wallet.isActive) {
      return res.json({ 
        success: true,
        message: "Wallet is already archived" 
      });
    }

    // Archive wallet (soft delete)
    await db
      .update(wallets)
      .set({
        isActive: false,
        deletedAt: new Date(),
      })
      .where(eq(wallets.id, walletId));

    res.json({ 
      success: true,
      message: "Wallet archived successfully. All transactions are preserved." 
    });
  } catch (error: any) {
    console.error("Error archiving wallet:", error);
    res.status(500).json({ error: "Failed to archive wallet" });
  }
});

// Fetch transactions from blockchain for a wallet
router.post("/wallets/:id/fetch-transactions", async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    
    if (!companyId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const walletId = parseInt(req.params.id);
    
    if (isNaN(walletId)) {
      return res.status(400).json({ error: "Invalid wallet ID" });
    }

    // Get wallet from database
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(
        and(
          eq(wallets.id, walletId),
          eq(wallets.companyId, companyId)
        )
      )
      .limit(1);

    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    // Only support on-chain wallets
    if (wallet.walletType !== 'on-chain') {
      return res.status(400).json({ 
        error: "Only on-chain addresses and xpubs are supported for transaction fetching" 
      });
    }

    // Detect if it's an xpub or single address
    const xpubPrefixes = ['xpub', 'ypub', 'zpub', 'tpub', 'upub', 'vpub'];
    const isXpub = xpubPrefixes.some(prefix => wallet.walletData.startsWith(prefix));

    if (process.env.NODE_ENV !== 'production') {
      console.log(`Fetching transactions for wallet ${walletId} (${wallet.name})`);
      console.log(`Type: ${isXpub ? 'xPub (HD Wallet)' : 'Single Address'}, Network: ${wallet.network}`);
    }

    // Fetch and process transactions from blockchain
    let fetchedTransactions;
    
    if (isXpub) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Scanning HD wallet (xpub)...`);
      }
      fetchedTransactions = await fetchXpubTransactions(
        wallet.walletData,
        wallet.network as 'mainnet' | 'testnet'
      );
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Fetching single address: ${wallet.walletData}`);
      }
      fetchedTransactions = await fetchAndProcessTransactions(
        wallet.walletData,
        wallet.network as 'mainnet' | 'testnet'
      );
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`Fetched ${fetchedTransactions.length} transactions from blockchain`);
    }

    if (fetchedTransactions.length === 0) {
      return res.json({
        success: true,
        stats: {
          fetched: 0,
          added: 0,
          skipped: 0,
          failed: 0
        },
        message: "No transactions found for this wallet"
      });
    }

    // Check for existing transactions by txId (company-wide to find duplicates)
    const existingTransactions = await db
      .select({ 
        id: transactions.id,
        txId: transactions.txId,
        walletId: transactions.walletId 
      })
      .from(transactions)
      .where(eq(transactions.companyId, companyId));

    const existingTxMap = new Map(existingTransactions.map(tx => [tx.txId, tx]));

    // Separate transactions into: new, already in this wallet, or in different wallet
    const newTransactions: typeof fetchedTransactions = [];
    let reassignedCount = 0;
    let skippedCount = 0;

    for (const tx of fetchedTransactions) {
      const existing = existingTxMap.get(tx.txId);
      
      if (!existing) {
        // Brand new transaction
        newTransactions.push(tx);
      } else if (existing.walletId === walletId) {
        // Already belongs to this wallet - skip
        skippedCount++;
      } else {
        // Exists but belongs to different wallet - reassign it
        try {
          await db
            .update(transactions)
            .set({ walletId: walletId })
            .where(eq(transactions.id, existing.id));
          reassignedCount++;
          if (process.env.NODE_ENV !== 'production') {
            console.log(`Reassigned transaction ${tx.txId.substring(0, 12)}... from wallet ${existing.walletId} to wallet ${walletId}`);
          }
        } catch (error: any) {
          console.error(`Failed to reassign transaction ${tx.txId}:`, error);
        }
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`${newTransactions.length} new transactions, ${reassignedCount} reassigned, ${skippedCount} already in this wallet`);
    }

    // Insert new transactions
    let addedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const tx of newTransactions) {
      try {
        await db.insert(transactions).values({
          walletId: walletId,
          companyId: companyId,
          txId: tx.txId,
          amountBtc: tx.amountBtc.toString(),
          usdValue: tx.usdValue.toString(),
          feeBtc: tx.feeBtc.toString(),
          feeUsd: tx.feeUsd.toString(),
          timestamp: tx.timestamp,
          txType: tx.txType,
          status: 'confirmed',
          confirmations: tx.confirmations,
          exchangeRate: tx.exchangeRate.toString(),
          createdAt: new Date(),
        });
        addedCount++;
      } catch (error: any) {
        console.error(`Failed to save transaction ${tx.txId}:`, error);
        failedCount++;
        errors.push(`Transaction ${tx.txId.substring(0, 8)}...: ${error.message}`);
      }
    }

    const response = {
      success: true,
      stats: {
        fetched: fetchedTransactions.length,
        added: addedCount,
        reassigned: reassignedCount,
        skipped: skippedCount,
        failed: failedCount
      }
    };

    if (failedCount > 0) {
      return res.status(207).json({ // 207 Multi-Status for partial success
        ...response,
        errors,
        message: `Added ${addedCount} transaction(s)${reassignedCount > 0 ? `, reassigned ${reassignedCount} transaction(s)` : ''}, ${failedCount} failed`
      });
    }

    let message = `Transactions Fetched.`;
    if (addedCount > 0) message += ` Added ${addedCount} new transaction(s).`;
    if (reassignedCount > 0) message += ` Reassigned ${reassignedCount} transaction(s) to this wallet.`;
    if (skippedCount > 0) message += ` ${skippedCount} duplicate transaction(s) skipped.`;

    res.json({
      ...response,
      message: message || "No new transactions found"
    });

  } catch (error: any) {
    console.error("Error fetching transactions:", error);
    
    // Return user-friendly error messages
    if (error.message.includes('Rate limit')) {
      return res.status(429).json({ 
        error: "Too many requests. Please wait a moment and try again." 
      });
    }
    if (error.message.includes('timed out')) {
      return res.status(504).json({ 
        error: "Request timed out. The blockchain API may be slow. Please try again." 
      });
    }
    if (error.message.includes('unavailable')) {
      return res.status(503).json({ 
        error: "Blockchain API is currently unavailable. Please try again later." 
      });
    }
    if (error.message.includes('exchange rate')) {
      return res.status(500).json({ 
        error: "Unable to fetch exchange rates. Please try again later." 
      });
    }
    
    res.status(500).json({ 
      error: "Unable to fetch transactions. Please try again later." 
    });
  }
});

// ===========================
// TRANSACTIONS
// ===========================

// Get all transactions for current user's company (with pagination)
router.get("/transactions", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const companyId = req.user.companyId || req.user.company?.id;
    if (!companyId) {
      console.error("User authenticated but no companyId:", { userId: req.user.id, user: req.user });
      return res.status(400).json({ error: "User account is not associated with a company. Please contact support." });
    }

    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    // Get total count of transactions for this company
    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(transactions)
      .where(eq(transactions.companyId, companyId));

    const totalTransactions = Number(count);
    const totalPages = Math.ceil(totalTransactions / limit);

    // Get paginated transactions
    const companyTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.companyId, companyId))
      .orderBy(desc(transactions.timestamp))
      .limit(limit)
      .offset(offset);

    // Return paginated response
    res.json({
      data: companyTransactions,
      pagination: {
        page,
        limit,
        total: totalTransactions,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error: any) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// Debug endpoint: Count transactions per wallet
router.get("/transactions/debug/counts", async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get transaction counts grouped by wallet_id
    const counts = await db
      .select({
        walletId: transactions.walletId,
        count: sql<number>`COUNT(*)`,
      })
      .from(transactions)
      .where(eq(transactions.companyId, companyId))
      .groupBy(transactions.walletId);

    // Get wallet names for reference
    const walletIds = counts.map(c => c.walletId);
    const walletList = walletIds.length > 0
      ? await db
          .select({ id: wallets.id, name: wallets.name })
          .from(wallets)
          .where(inArray(wallets.id, walletIds))
      : [];

    const walletMap = new Map(walletList.map(w => [w.id, w.name]));

    const result = counts.map(c => ({
      walletId: c.walletId,
      walletName: walletMap.get(c.walletId) || 'Unknown Wallet',
      transactionCount: Number(c.count),
    }));

    res.json({
      success: true,
      walletCounts: result,
      totalTransactions: result.reduce((sum, w) => sum + w.transactionCount, 0),
    });
  } catch (error: any) {
    console.error("Error counting transactions:", error);
    res.status(500).json({ error: "Failed to count transactions" });
  }
});

// Debug endpoint: Check transactions for a specific wallet by address/tx_hash
router.get("/transactions/debug/wallet/:walletId", async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const walletId = parseInt(req.params.walletId);
    
    if (!companyId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get all transactions for this wallet
    const walletTransactions = await db
      .select({
        id: transactions.id,
        txId: transactions.txId,
        walletId: transactions.walletId,
        timestamp: transactions.timestamp,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.companyId, companyId),
          eq(transactions.walletId, walletId)
        )
      )
      .orderBy(desc(transactions.timestamp));

    // Also check if any of these tx_ids exist under other wallet_ids
    const txIds = walletTransactions.map(tx => tx.txId);
    const allTransactionsWithSameTxIds = txIds.length > 0
      ? await db
          .select({
            id: transactions.id,
            txId: transactions.txId,
            walletId: transactions.walletId,
          })
          .from(transactions)
          .where(
            and(
              eq(transactions.companyId, companyId),
              inArray(transactions.txId, txIds)
            )
          )
      : [];

    // Group by txId to see duplicates
    const txIdMap = new Map<string, typeof allTransactionsWithSameTxIds>();
    for (const tx of allTransactionsWithSameTxIds) {
      if (!txIdMap.has(tx.txId)) {
        txIdMap.set(tx.txId, []);
      }
      txIdMap.get(tx.txId)!.push(tx);
    }

    const duplicates = Array.from(txIdMap.entries())
      .filter(([_, txList]) => txList.length > 1)
      .map(([txId, txList]) => ({
        txId: txId.substring(0, 16) + '...',
        transactions: txList.map(tx => ({
          id: tx.id,
          walletId: tx.walletId,
        })),
      }));

    res.json({
      success: true,
      walletId: walletId,
      transactionCount: walletTransactions.length,
      transactions: walletTransactions.map(tx => ({
        id: tx.id,
        txId: tx.txId.substring(0, 16) + '...',
        timestamp: tx.timestamp,
      })),
      duplicatesFound: duplicates.length,
      duplicates: duplicates,
    });
  } catch (error: any) {
    console.error("Error checking wallet transactions:", error);
    res.status(500).json({ error: "Failed to check wallet transactions" });
  }
});

// Import transactions (manual or from wallet)
router.post("/transactions/import", async (req, res) => {
  try {
    const userId = req.user?.id;
    const companyId = req.user?.companyId;
    
    if (!userId || !companyId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { walletId, transactionsData } = req.body;

    if (!walletId || !Array.isArray(transactionsData)) {
      return res.status(400).json({ error: "Invalid request data" });
    }

    // Insert transactions
    const insertedTransactions = await db
      .insert(transactions)
      .values(
        transactionsData.map((tx: any) => ({
          walletId,
          companyId,
          txId: tx.txId,
          amountBtc: tx.amountBtc,
          usdValue: tx.usdValue,
          feeBtc: tx.feeBtc || 0,
          feeUsd: tx.feeUsd || 0,
          timestamp: tx.timestamp,
          txType: tx.txType,
          status: tx.status || 'confirmed',
          confirmations: tx.confirmations || 0,
          exchangeRate: tx.exchangeRate,
          memo: tx.memo,
          notes: tx.notes,
          createdAt: Date.now(),
        }))
      )
      .returning();

    res.status(201).json(insertedTransactions);
  } catch (error: any) {
    console.error("Error importing transactions:", error);
    res.status(500).json({ error: "Failed to import transactions" });
  }
});

// Update transaction (categorize, add notes)
router.patch("/transactions/:id", async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const transactionId = parseInt(req.params.id);
    
    if (!companyId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { categoryId, notes, counterparty } = req.body;

    const [updatedTransaction] = await db
      .update(transactions)
      .set({
        categoryId: categoryId || null,
        notes: notes || null,
        counterparty: counterparty || null,
      })
      .where(
        and(
          eq(transactions.id, transactionId),
          eq(transactions.companyId, companyId)
        )
      )
      .returning();

    if (!updatedTransaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json(updatedTransaction);
  } catch (error: any) {
    console.error("Error updating transaction:", error);
    res.status(500).json({ error: "Failed to update transaction" });
  }
});

// ===========================
// CATEGORIES
// ===========================

// Get all categories for current user's company
router.get("/categories", async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const companyCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.companyId, companyId))
      .orderBy(desc(categories.createdAt));

    res.json(companyCategories);
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Create new category
router.post("/categories", async (req, res) => {
  try {
    const userId = req.user?.id;
    const companyId = req.user?.companyId;
    
    if (!userId || !companyId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { name, quickbooksAccount, categoryType } = req.body;

    if (!name || !categoryType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const [newCategory] = await db
      .insert(categories)
      .values({
        userId,
        companyId,
        name,
        quickbooksAccount: quickbooksAccount || null,
        categoryType,
        isDefault: false,
        createdAt: new Date(),
      })
      .returning();

    res.status(201).json(newCategory);
  } catch (error: any) {
    console.error("Error creating category:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
});

// Update category
router.patch("/categories/:id", async (req, res) => {
  try {
    const userId = req.user?.id;
    const companyId = req.user?.companyId;
    const categoryId = parseInt(req.params.id);
    
    if (!userId || !companyId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { name, quickbooksAccount, categoryType } = req.body;

    // Verify category belongs to user's company
    const [existingCategory] = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.id, categoryId),
          eq(categories.companyId, companyId)
        )
      );

    if (!existingCategory) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Update category
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (quickbooksAccount !== undefined) updateData.quickbooksAccount = quickbooksAccount || null;
    if (categoryType !== undefined) updateData.categoryType = categoryType;

    const [updatedCategory] = await db
      .update(categories)
      .set(updateData)
      .where(
        and(
          eq(categories.id, categoryId),
          eq(categories.companyId, companyId)
        )
      )
      .returning();

    res.json(updatedCategory);
  } catch (error: any) {
    console.error("Error updating category:", error);
    res.status(500).json({ error: "Failed to update category" });
  }
});

// Delete category
router.delete("/categories/:id", async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const categoryId = parseInt(req.params.id);
    
    if (!companyId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Verify category belongs to user's company
    const [existingCategory] = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.id, categoryId),
          eq(categories.companyId, companyId)
        )
      );

    if (!existingCategory) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Check if category is used by any transactions
    const transactionsUsingCategory = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.companyId, companyId),
          eq(transactions.categoryId, categoryId)
        )
      );

    const count = Number(transactionsUsingCategory[0]?.count || 0);
    
    if (count > 0) {
      return res.status(400).json({ 
        error: `Cannot delete category. ${count} transaction${count === 1 ? '' : 's'} use this category.`,
        transactionCount: count
      });
    }

    // Delete category
    await db
      .delete(categories)
      .where(
        and(
          eq(categories.id, categoryId),
          eq(categories.companyId, companyId)
        )
      );

    res.json({ success: true, message: "Category deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting category:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

// ===========================
// PURCHASES
// ===========================

// Get all purchases for current user's company
router.get("/purchases", async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const companyPurchases = await db
      .select()
      .from(purchases)
      .where(eq(purchases.companyId, companyId))
      .orderBy(purchases.purchaseDate); // Oldest first for FIFO

    res.json(companyPurchases);
  } catch (error: any) {
    console.error("Error fetching purchases:", error);
    res.status(500).json({ error: "Failed to fetch purchases" });
  }
});

// Create new purchase
router.post("/purchases", async (req, res) => {
  try {
    const userId = req.user?.id;
    const companyId = req.user?.companyId;
    
    if (!userId || !companyId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { amountBtc, costBasisUsd, purchaseDate, source } = req.body;

    // Validation
    if (!amountBtc || !costBasisUsd || !purchaseDate) {
      return res.status(400).json({ error: "Missing required fields: amountBtc, costBasisUsd, purchaseDate" });
    }

    const btcAmount = parseFloat(amountBtc);
    const usdCost = parseFloat(costBasisUsd);

    if (isNaN(btcAmount) || btcAmount <= 0) {
      return res.status(400).json({ error: "amountBtc must be a positive number" });
    }

    if (btcAmount < 0.00000001) {
      return res.status(400).json({ error: "amountBtc must be at least 0.00000001 BTC" });
    }

    if (isNaN(usdCost) || usdCost <= 0) {
      return res.status(400).json({ error: "costBasisUsd must be a positive number" });
    }

    // Parse and validate date
    let purchaseDateObj: Date;
    try {
      // Parse YYYY-MM-DD and create date at local midnight (not UTC)
      const [year, month, day] = purchaseDate.split('-').map(Number);
      purchaseDateObj = new Date(year, month - 1, day, 0, 0, 0, 0);
      
      // Validate date is not in the future
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (purchaseDateObj > today) {
        return res.status(400).json({ error: "Purchase date cannot be in the future" });
      }
    } catch (error) {
      return res.status(400).json({ error: "Invalid purchase date format. Use YYYY-MM-DD" });
    }

    // Create purchase with remainingBtc initially set to amountBtc
    const [newPurchase] = await db
      .insert(purchases)
      .values({
        userId,
        companyId,
        amountBtc: btcAmount,
        costBasisUsd: usdCost,
        purchaseDate: purchaseDateObj,
        remainingBtc: btcAmount, // Initially, all BTC is remaining
        source: source || null,
        createdAt: new Date(),
      })
      .returning();

    res.status(201).json(newPurchase);
  } catch (error: any) {
    console.error("Error creating purchase:", error);
    res.status(500).json({ error: "Failed to create purchase" });
  }
});

// Update purchase
router.patch("/purchases/:id", async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const purchaseId = parseInt(req.params.id);
    
    if (!companyId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { amountBtc, costBasisUsd, purchaseDate, source } = req.body;

    // Verify purchase belongs to user's company
    const [existingPurchase] = await db
      .select()
      .from(purchases)
      .where(
        and(
          eq(purchases.id, purchaseId),
          eq(purchases.companyId, companyId)
        )
      );

    if (!existingPurchase) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    // Check if purchase is used in transaction_lots
    const lotsUsingPurchase = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(transactionLots)
      .where(eq(transactionLots.purchaseId, purchaseId));

    const count = Number(lotsUsingPurchase[0]?.count || 0);
    
    if (count > 0) {
      return res.status(400).json({ 
        error: `Cannot edit purchase. It is used by ${count} transaction${count === 1 ? '' : 's'} for cost basis calculation.`,
        transactionCount: count
      });
    }

    // Parse and validate date if provided
    let purchaseDateObj: Date | undefined;
    if (purchaseDate) {
      try {
        const [year, month, day] = purchaseDate.split('-').map(Number);
        purchaseDateObj = new Date(year, month - 1, day, 0, 0, 0, 0);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (purchaseDateObj > today) {
          return res.status(400).json({ error: "Purchase date cannot be in the future" });
        }
      } catch (error) {
        return res.status(400).json({ error: "Invalid purchase date format. Use YYYY-MM-DD" });
      }
    }

    // Build update data
    const updateData: any = {};
    if (amountBtc !== undefined) {
      const btcAmount = parseFloat(amountBtc);
      if (isNaN(btcAmount) || btcAmount <= 0) {
        return res.status(400).json({ error: "amountBtc must be a positive number" });
      }
      if (btcAmount < 0.00000001) {
        return res.status(400).json({ error: "amountBtc must be at least 0.00000001 BTC" });
      }
      updateData.amountBtc = btcAmount;
      // If amount changes, update remainingBtc proportionally
      const originalAmount = parseFloat(existingPurchase.amountBtc.toString());
      const remainingAmount = parseFloat(existingPurchase.remainingBtc.toString());
      const ratio = remainingAmount / originalAmount;
      updateData.remainingBtc = btcAmount * ratio;
    }
    if (costBasisUsd !== undefined) {
      const usdCost = parseFloat(costBasisUsd);
      if (isNaN(usdCost) || usdCost <= 0) {
        return res.status(400).json({ error: "costBasisUsd must be a positive number" });
      }
      updateData.costBasisUsd = usdCost;
    }
    if (purchaseDateObj) {
      updateData.purchaseDate = purchaseDateObj;
    }
    if (source !== undefined) {
      updateData.source = source || null;
    }

    const [updatedPurchase] = await db
      .update(purchases)
      .set(updateData)
      .where(
        and(
          eq(purchases.id, purchaseId),
          eq(purchases.companyId, companyId)
        )
      )
      .returning();

    res.json(updatedPurchase);
  } catch (error: any) {
    console.error("Error updating purchase:", error);
    res.status(500).json({ error: "Failed to update purchase" });
  }
});

// ===========================
// COST BASIS
// ===========================

// Get cost basis for a single transaction (with write-through: calculates and stores if not exists)
router.get("/transactions/:id/cost-basis", async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const transactionId = parseInt(req.params.id);
    
    if (!companyId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get transaction
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
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Only calculate cost basis for "sent" transactions
    if (transaction.txType !== 'sent') {
      return res.json({
        transactionId,
        txType: transaction.txType,
        message: "Cost basis only applies to sent transactions",
        costBasisUsd: 0,
        gainLossUsd: 0,
        lots: [],
      });
    }

    const amountBtc = parseFloat(transaction.amountBtc.toString());
    const saleValueUsd = parseFloat(transaction.usdValue.toString());

    // Check if transaction lots already exist (idempotent behavior)
    const hasLots = await hasTransactionLots(transactionId, companyId);
    
    let costBasisResult;
    let lotsFromDB;

    if (hasLots) {
      // Return existing lots
      lotsFromDB = await getTransactionLots(transactionId, companyId);
      const totalCostBasis = lotsFromDB.reduce((sum, lot) => sum + parseFloat(lot.costBasisUsed.toString()), 0);
      
      costBasisResult = {
        totalCostBasisUsd: totalCostBasis,
        lots: lotsFromDB.map(lot => ({
          purchaseId: lot.purchaseId,
          btcUsed: parseFloat(lot.btcAmountUsed.toString()),
          costBasisUsed: parseFloat(lot.costBasisUsed.toString()),
          purchaseDate: lot.purchase.purchaseDate,
          originalPurchasePricePerBtc: parseFloat(lot.purchase.costBasisUsd.toString()) / parseFloat(lot.purchase.amountBtc.toString()),
        })),
        insufficientBtc: false,
        amountMatched: amountBtc,
        amountRequested: amountBtc,
      };
    } else {
      // Calculate FIFO cost basis (this doesn't write to DB yet)
      costBasisResult = await calculateFIFOCostBasis(transactionId, companyId);
      
      if (!costBasisResult) {
        return res.status(500).json({ error: "Failed to calculate cost basis" });
      }

      // Write-through: Create transaction lots and update purchases
      if (costBasisResult.lots.length > 0) {
        await createTransactionLots(transactionId, costBasisResult.lots, companyId);
      }

      // Fetch the newly created lots from DB
      lotsFromDB = await getTransactionLots(transactionId, companyId);
    }

    const costBasisUsd = costBasisResult.totalCostBasisUsd;
    const gainLossUsd = saleValueUsd - costBasisUsd;

    res.json({
      transactionId,
      txType: transaction.txType,
      amountBtc,
      saleValueUsd,
      costBasisUsd,
      gainLossUsd,
      lots: lotsFromDB.map(lot => ({
        purchaseId: lot.purchaseId,
        purchaseDate: lot.purchase.purchaseDate,
        btcUsed: parseFloat(lot.btcAmountUsed.toString()),
        costBasisUsed: parseFloat(lot.costBasisUsed.toString()),
        originalPurchasePricePerBtc: parseFloat(lot.purchase.costBasisUsd.toString()) / parseFloat(lot.purchase.amountBtc.toString()),
      })),
      insufficientBtc: costBasisResult.insufficientBtc,
      amountMatched: costBasisResult.amountMatched,
      amountRequested: costBasisResult.amountRequested,
    });
  } catch (error: any) {
    console.error("Error getting cost basis:", error);
    res.status(500).json({ error: "Failed to get cost basis", message: error.message });
  }
});

// Get cost basis for multiple transactions (batch endpoint for QuickBooks export)
router.get("/transactions/cost-basis", async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    
    if (!companyId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Parse transaction IDs from query string
    const transactionIdsParam = req.query.transactionIds as string | undefined;
    
    if (!transactionIdsParam) {
      return res.status(400).json({ error: "Missing transactionIds parameter. Use ?transactionIds=1,2,3" });
    }

    const transactionIds = transactionIdsParam
      .split(',')
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id) && id > 0);

    if (transactionIds.length === 0) {
      return res.status(400).json({ error: "Invalid transactionIds. Must be comma-separated numbers" });
    }

    // Get all transactions at once
    const txs = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.companyId, companyId),
          inArray(transactions.id, transactionIds)
        )
      );

    // Calculate cost basis for each transaction
    const results = await Promise.all(
      txs.map(async (tx) => {
        // Only calculate for "sent" transactions
        if (tx.txType !== 'sent') {
          return {
            transactionId: tx.id,
            txType: tx.txType,
            costBasisUsd: 0,
            gainLossUsd: 0,
            message: "Cost basis only applies to sent transactions",
            lots: [],
          };
        }

        const amountBtc = parseFloat(tx.amountBtc.toString());
        const saleValueUsd = parseFloat(tx.usdValue.toString());

        // Check if transaction lots already exist
        const hasLots = await hasTransactionLots(tx.id, companyId);
        let costBasisUsd = 0;
        let lotsFromDB: any[] = [];

        if (hasLots) {
          // Return existing lots
          lotsFromDB = await getTransactionLots(tx.id, companyId);
          costBasisUsd = lotsFromDB.reduce((sum, lot) => sum + parseFloat(lot.costBasisUsed.toString()), 0);
        } else {
          // Calculate and store FIFO cost basis (write-through)
          const costBasisResult = await calculateFIFOCostBasis(tx.id, companyId);
          
          if (costBasisResult) {
            costBasisUsd = costBasisResult.totalCostBasisUsd;
            
            // Write-through: Create transaction lots and update purchases
            if (costBasisResult.lots.length > 0) {
              await createTransactionLots(tx.id, costBasisResult.lots, companyId);
              // Fetch the newly created lots from DB
              lotsFromDB = await getTransactionLots(tx.id, companyId);
            }
          }
        }

        const gainLossUsd = saleValueUsd - costBasisUsd;

        return {
          transactionId: tx.id,
          txType: tx.txType,
          amountBtc,
          saleValueUsd,
          costBasisUsd,
          gainLossUsd,
          lots: lotsFromDB.map((lot) => ({
            purchaseId: lot.purchaseId,
            purchaseDate: lot.purchase.purchaseDate,
            btcUsed: parseFloat(lot.btcAmountUsed.toString()),
            costBasisUsed: parseFloat(lot.costBasisUsed.toString()),
            originalPurchasePricePerBtc: parseFloat(lot.purchase.costBasisUsd.toString()) / parseFloat(lot.purchase.amountBtc.toString()),
          })),
        };
      })
    );

    res.json({
      success: true,
      count: results.length,
      transactions: results,
    });
  } catch (error: any) {
    console.error("Error getting batch cost basis:", error);
    res.status(500).json({ error: "Failed to get cost basis", message: error.message });
  }
});

// ===========================
// QUICKBOOKS EXPORT
// ===========================

// Generate QuickBooks CSV export
router.get("/export/quickbooks", async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Parse date range filters (optional)
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    // Build where clause with optional date filtering
    // Parse dates as local dates (not UTC) to match user's date picker selection
    const whereConditions = [eq(transactions.companyId, companyId)];
    if (startDate) {
      // Parse YYYY-MM-DD and create date at local midnight (not UTC)
      const [year, month, day] = startDate.split('-').map(Number);
      const start = new Date(year, month - 1, day, 0, 0, 0, 0); // Local midnight
      whereConditions.push(gte(transactions.timestamp, start));
    }
    if (endDate) {
      // Parse YYYY-MM-DD and create date at local end of day (not UTC)
      const [year, month, day] = endDate.split('-').map(Number);
      const end = new Date(year, month - 1, day, 23, 59, 59, 999); // Local end of day
      whereConditions.push(lte(transactions.timestamp, end));
    }

    // Get transactions with optional date filtering
    const txs = await db
      .select({
        transaction: transactions,
        category: categories,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(...whereConditions))
      .orderBy(transactions.timestamp); // Oldest first for QuickBooks

    if (txs.length === 0) {
      return res.status(400).json({ error: "No transactions found for the selected date range" });
    }

    // Extract "sent" transaction IDs for cost basis calculation
    const sentTransactionIds = txs
      .filter(row => row.transaction.txType === 'sent')
      .map(row => row.transaction.id);

    // Batch calculate cost basis for all sent transactions
    const costBasisMap = new Map<number, { costBasisUsd: number; gainLossUsd: number }>();
    
    if (sentTransactionIds.length > 0) {
      // Calculate cost basis for each sent transaction
      await Promise.all(
        sentTransactionIds.map(async (txId) => {
          try {
            const hasLots = await hasTransactionLots(txId, companyId);
            let costBasisUsd = 0;

            if (hasLots) {
              // Get existing lots
              const lots = await getTransactionLots(txId, companyId);
              costBasisUsd = lots.reduce((sum, lot) => sum + parseFloat(lot.costBasisUsed.toString()), 0);
            } else {
              // Calculate and store FIFO cost basis (write-through)
              const costBasisResult = await calculateFIFOCostBasis(txId, companyId);
              if (costBasisResult) {
                costBasisUsd = costBasisResult.totalCostBasisUsd;
                
                // Write-through: Create transaction lots if they don't exist
                if (costBasisResult.lots.length > 0) {
                  await createTransactionLots(txId, costBasisResult.lots, companyId);
                }
              }
            }

            // Get transaction to calculate gain/loss
            const [tx] = txs.filter(row => row.transaction.id === txId);
            if (tx) {
              const saleValueUsd = parseFloat(tx.transaction.usdValue.toString());
              const gainLossUsd = saleValueUsd - costBasisUsd;
              
              costBasisMap.set(txId, { costBasisUsd, gainLossUsd });
            }
          } catch (error) {
            console.error(`Error calculating cost basis for transaction ${txId}:`, error);
            // Continue without cost basis for this transaction
          }
        })
      );
    }

    // Generate CSV in standard QuickBooks 4-column format: Date,Description,Credit,Debit
    // Note: QuickBooks requires only Credit OR Debit per row (other should be empty)
    const csvRows: string[] = [];
    
    for (const row of txs) {
      const tx = row.transaction;
      const cat = row.category;
      
      // Format date as MM/DD/YYYY (US format, commonly accepted by QuickBooks)
      const txDate = new Date(tx.timestamp);
      const dateStr = `${(txDate.getMonth() + 1).toString().padStart(2, '0')}/${txDate.getDate().toString().padStart(2, '0')}/${txDate.getFullYear()}`;
      
      // Escape quotes helper
      const escapeDescription = (desc: string) => desc.replace(/"/g, '""');
      
      const amount = parseFloat(tx.usdValue.toString());

      // Handle different transaction types
      // CSV format: Date,Description,Debit,Credit
      if (tx.txType === 'received') {
        // Received: Credit (money in) - no cost basis needed
        let description = `Bitcoin received`;
        if (cat?.name) {
          description += ` - ${cat.name}`;
        }
        if (tx.memo || tx.notes) {
          description += ` (${tx.memo || tx.notes})`;
        }
        csvRows.push(`${dateStr},"${escapeDescription(description)}",,${amount.toFixed(2)}`);
        
      } else if (tx.txType === 'sent') {
        // Sent transactions: Generate journal entries with cost basis
        const costBasisInfo = costBasisMap.get(tx.id);
        const expenseAccount = cat?.quickbooksAccount || "Bitcoin Expense";
        
        // Expense description
        let expenseDescription = `Expense - ${cat?.name || "Bitcoin Payment"}`;
        if (tx.memo || tx.notes) {
          expenseDescription += ` (${tx.memo || tx.notes})`;
        }

        if (costBasisInfo && costBasisInfo.costBasisUsd > 0) {
          // Sent with cost basis: Generate 3-line journal entry
          const costBasis = costBasisInfo.costBasisUsd;
          const gainLoss = costBasisInfo.gainLossUsd;
          
          // Line 1: Expense Debit (full amount)
          csvRows.push(`${dateStr},"${escapeDescription(expenseDescription)}",${amount.toFixed(2)},`);
          
          // Line 2: Bitcoin Asset Credit (cost basis)
          csvRows.push(`${dateStr},"Bitcoin Asset - Cost Basis",,${costBasis.toFixed(2)}`);
          
          // Line 3: Capital Gains/Loss Credit or Debit
          if (gainLoss >= 0) {
            // Gain: Credit
            csvRows.push(`${dateStr},"Capital Gains - Bitcoin",,${gainLoss.toFixed(2)}`);
          } else {
            // Loss: Debit (negative becomes positive debit)
            const lossAmount = Math.abs(gainLoss);
            csvRows.push(`${dateStr},"Capital Loss - Bitcoin",${lossAmount.toFixed(2)},`);
          }
        } else {
          // Sent without cost basis: Simple 2-line entry
          // Line 1: Expense Debit (full amount)
          csvRows.push(`${dateStr},"${escapeDescription(expenseDescription)}",${amount.toFixed(2)},`);
          
          // Line 2: Bitcoin Asset Credit (full amount)
          csvRows.push(`${dateStr},"Bitcoin Asset",,${amount.toFixed(2)}`);
        }
        
      } else if (tx.txType === 'self') {
        // Self transaction: Show as internal transfer
        let description = `Bitcoin self - Internal Transfer`;
        if (cat?.name) {
          description += ` - ${cat.name}`;
        }
        if (tx.memo || tx.notes) {
          description += ` (${tx.memo || tx.notes})`;
        }
        csvRows.push(`${dateStr},"${escapeDescription(description)}",${amount.toFixed(2)},`);
      }
    }

    // QuickBooks standard 4-column format header: Date,Description,Debit,Credit
    const csvHeader = "Date,Description,Debit,Credit\n";
    const csv = csvHeader + csvRows.join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="quickbooks-export-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error: any) {
    console.error("Error generating QuickBooks export:", error);
    res.status(500).json({ error: "Failed to generate export" });
  }
});

// ===========================
// EXCHANGE RATES
// ===========================

// Get current BTC/USD rate
router.get("/rates/current", async (req, res) => {
  try {
    const rate = await getCurrentRate();
    
    res.json({ 
      rate, 
      rateFormatted: `$${rate.toFixed(2)}`,
      timestamp: Date.now(),
      source: "coingecko",
    });
  } catch (error: any) {
    console.error("Error fetching BTC rate:", error);
    res.status(500).json({ error: "Failed to fetch exchange rate", message: error.message });
  }
});

// TEST: Check if API key works with simple price endpoint
router.get("/test-api-key", async (req, res) => {
  try {
    const apiKey = process.env.COINGECKO_API_KEY;
    
    if (!apiKey) {
      return res.status(400).json({ error: "No API key configured" });
    }
    
    // Try the simple price endpoint (available on Demo tier)
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&x_cg_demo_api_key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    res.json({
      success: response.ok,
      status: response.status,
      apiKeyPrefix: apiKey.substring(0, 10) + '...',
      endpoint: '/simple/price',
      data: data,
      message: response.ok ? 'API key works!' : 'API key failed'
    });
    
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get historical rates
router.get("/rates/historical", async (req, res) => {
  try {
    const { from, to } = req.query;

    let query = db.select().from(exchangeRates).orderBy(desc(exchangeRates.timestamp));

    if (from) {
      query = query.where(eq(exchangeRates.timestamp, parseInt(from as string)));
    }

    const rates = await query.limit(100);
    res.json(rates);
  } catch (error: any) {
    console.error("Error fetching historical rates:", error);
    res.status(500).json({ error: "Failed to fetch rates" });
  }
});

// TEST ENDPOINT: Get exchange rate for a specific date
// Usage: /api/accounting/test-exchange-rate?date=2024-01-15
router.get("/test-exchange-rate", async (req, res) => {
  try {
    const dateParam = req.query.date as string;
    
    if (!dateParam) {
      return res.status(400).json({ 
        error: "Missing date parameter", 
        usage: "?date=YYYY-MM-DD (e.g., ?date=2024-01-15)" 
      });
    }
    
    // Parse the date
    const date = new Date(dateParam);
    
    if (isNaN(date.getTime())) {
      return res.status(400).json({ 
        error: "Invalid date format", 
        usage: "?date=YYYY-MM-DD (e.g., ?date=2024-01-15)" 
      });
    }
    
    // Get the exchange rate (with caching)
    const rate = await getExchangeRate(date);
    
    res.json({
      success: true,
      date: dateParam,
      normalizedDate: date.toISOString().split('T')[0],
      rate,
      rateFormatted: `$${rate.toFixed(2)}`,
      source: "coingecko",
      cached: true, // Check logs to see if it was actually cached
    });
    
  } catch (error: any) {
    console.error("Error in test-exchange-rate endpoint:", error);
    res.status(500).json({ 
      error: "Failed to fetch exchange rate",
      message: error.message 
    });
  }
});

// TEST ENDPOINT: Batch get multiple exchange rates
// Usage: /api/accounting/test-batch-rates?dates=2024-01-15,2024-01-16,2024-01-17
router.get("/test-batch-rates", async (req, res) => {
  try {
    const datesParam = req.query.dates as string;
    
    if (!datesParam) {
      return res.status(400).json({ 
        error: "Missing dates parameter", 
        usage: "?dates=YYYY-MM-DD,YYYY-MM-DD (e.g., ?dates=2024-01-15,2024-01-16)" 
      });
    }
    
    // Parse the dates
    const dateStrings = datesParam.split(',');
    const dates = dateStrings.map(d => new Date(d.trim()));
    
    // Validate dates
    const invalidDates = dates.filter(d => isNaN(d.getTime()));
    if (invalidDates.length > 0) {
      return res.status(400).json({ 
        error: "Invalid date format in one or more dates", 
        usage: "?dates=YYYY-MM-DD,YYYY-MM-DD (e.g., ?dates=2024-01-15,2024-01-16)" 
      });
    }
    
    // Get rates for all dates
    const rateMap = await batchGetExchangeRates(dates);
    
    // Convert map to array for response
    const rates = Array.from(rateMap.entries()).map(([date, rate]) => ({
      date,
      rate,
      rateFormatted: `$${rate.toFixed(2)}`,
    }));
    
    res.json({
      success: true,
      count: rates.length,
      rates,
      source: "coingecko",
    });
    
  } catch (error: any) {
    console.error("Error in test-batch-rates endpoint:", error);
    res.status(500).json({ 
      error: "Failed to fetch exchange rates",
      message: error.message 
    });
  }
});

// Cleanup duplicate transactions (one-time cleanup endpoint)
// Removes duplicate transactions based on tx_hash within the same company
// Keeps the oldest transaction (by id), deletes the rest
router.post("/transactions/cleanup-duplicates", async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    
    if (!companyId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`Starting duplicate transaction cleanup for company ${companyId}...`);
    }

    // Get all transactions for this company, ordered by id (oldest first)
    const allTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.companyId, companyId))
      .orderBy(transactions.id);

    if (allTransactions.length === 0) {
      return res.json({
        success: true,
        message: "No transactions found",
        stats: {
          duplicatesFound: 0,
          duplicatesRemoved: 0
        }
      });
    }

    // Group transactions by txId
    const txIdMap = new Map<string, typeof allTransactions>();
    for (const tx of allTransactions) {
      if (!txIdMap.has(tx.txId)) {
        txIdMap.set(tx.txId, []);
      }
      txIdMap.get(tx.txId)!.push(tx);
    }

    // Find duplicates (tx_ids with more than one transaction)
    const duplicateTxIds: string[] = [];
    const idsToDelete: number[] = [];

    for (const [txId, txList] of txIdMap.entries()) {
      if (txList.length > 1) {
        duplicateTxIds.push(txId);
        // Keep the first one (oldest by id), mark rest for deletion
        const toKeep = txList[0];
        const toDelete = txList.slice(1);
        idsToDelete.push(...toDelete.map(tx => tx.id));
        if (process.env.NODE_ENV !== 'production') {
          console.log(`Found ${txList.length} duplicates for tx_id ${txId.substring(0, 12)}... Keeping ${toKeep.id}, deleting ${toDelete.length}`);
        }
      }
    }

    if (duplicateTxIds.length === 0) {
      return res.json({
        success: true,
        message: "No duplicate transactions found",
        stats: {
          duplicatesFound: 0,
          duplicatesRemoved: 0
        }
      });
    }

    console.log(`Found ${duplicateTxIds.length} duplicate transaction IDs, removing ${idsToDelete.length} duplicates...`);

    // Delete all duplicate transactions in one batch
    if (idsToDelete.length > 0) {
      await db
        .delete(transactions)
        .where(inArray(transactions.id, idsToDelete));
    }

    const totalRemoved = idsToDelete.length;

    console.log(`Cleanup complete. Removed ${totalRemoved} duplicate transactions.`);

    res.json({
      success: true,
      message: `Successfully removed ${totalRemoved} duplicate transaction(s)`,
      stats: {
        duplicatesFound: totalRemoved,
        duplicatesRemoved: totalRemoved,
        duplicateTxIds: duplicateTxIds.length
      }
    });

  } catch (error: any) {
    console.error("Error cleaning up duplicate transactions:", error);
    res.status(500).json({ 
      error: "Failed to cleanup duplicate transactions",
      message: error.message 
    });
  }
});

// ===========================
// TEST DATA CLEANUP (for testing/demo page)
// ===========================

// Delete all test data (transactions, purchases, transaction_lots, test categories)
router.delete("/test-data", async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    
    if (!companyId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    console.log(`Clearing test data for company ${companyId}...`);

    // Delete in order (respecting foreign key constraints)
    
    // 1. Transaction lots (references transactions)
    await db.delete(transactionLots);
    
    // 2. Transactions (references wallets and categories)
    await db.delete(transactions).where(eq(transactions.companyId, companyId));
    
    // 3. Purchases (standalone, but filtered by company)
    await db.delete(purchases).where(eq(purchases.companyId, companyId));
    
    // 4. Test categories (optional - only delete test categories like "Salary", "Expense", "Withdrawal")
    const testCategoryNames = ['Salary', 'Expense', 'Withdrawal'];
    const allCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.companyId, companyId));
    
    const testCategories = allCategories.filter(cat => testCategoryNames.includes(cat.name));
    
    if (testCategories.length > 0) {
      const testCategoryIds = testCategories.map(c => c.id);
      await db.delete(categories).where(inArray(categories.id, testCategoryIds));
    }

    res.json({
      success: true,
      message: "Test data cleared successfully",
      cleared: {
        transactionLots: "all",
        transactions: "all",
        purchases: "all",
        testCategories: testCategories.length
      }
    });

  } catch (error: any) {
    console.error("Error clearing test data:", error);
    res.status(500).json({ 
      error: "Failed to clear test data",
      message: error.message 
    });
  }
});

export default router;
