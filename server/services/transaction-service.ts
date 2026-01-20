import { getExchangeRate } from '../modules/accounting/exchange-rate-service.js';

interface MempoolTransaction {
  txid: string;
  version: number;
  locktime: number;
  vin: Array<{
    txid: string;
    vout: number;
    prevout: {
      scriptpubkey: string;
      scriptpubkey_asm: string;
      scriptpubkey_type: string;
      scriptpubkey_address: string;
      value: number;
    };
    scriptsig: string;
    scriptsig_asm: string;
    witness: string[];
    is_coinbase: boolean;
    sequence: number;
  }>;
  vout: Array<{
    scriptpubkey: string;
    scriptpubkey_asm: string;
    scriptpubkey_type: string;
    scriptpubkey_address?: string;
    value: number;
  }>;
  size: number;
  weight: number;
  fee: number;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
}

interface ParsedTransaction {
  txId: string;
  timestamp: Date;
  txType: 'sent' | 'received' | 'self';
  amountBtc: number;
  feeBtc: number;
  confirmations: number;
  blockHeight?: number;
}

interface TransactionWithUsd extends ParsedTransaction {
  usdValue: number;
  feeUsd: number;
  exchangeRate: number;
}

const MEMPOOL_BASE_URL = 'https://mempool.space/api';
const MEMPOOL_TESTNET_URL = 'https://mempool.space/testnet/api';
const REQUEST_TIMEOUT = 30000; // 30 seconds
const REQUEST_DELAY = 500; // 500ms delay between requests to avoid rate limits
const MAX_RETRIES = 3; // Retry failed requests up to 3 times
const RETRY_DELAY = 2000; // 2 seconds delay before retrying

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url: string, timeout = REQUEST_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

/**
 * Delay helper for rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch all transactions for a Bitcoin address with retry logic
 */
export async function fetchAddressTransactions(
  address: string,
  network: 'mainnet' | 'testnet' = 'mainnet',
  retryCount: number = 0
): Promise<MempoolTransaction[]> {
  const baseUrl = network === 'testnet' ? MEMPOOL_TESTNET_URL : MEMPOOL_BASE_URL;
  const allTransactions: MempoolTransaction[] = [];
  let lastTxId: string | null = null;
  
  try {
    // Fetch transactions in batches (Mempool returns 25 per page)
    do {
      const url = lastTxId
        ? `${baseUrl}/address/${address}/txs/chain/${lastTxId}`
        : `${baseUrl}/address/${address}/txs`;
      
      if (retryCount === 0) {
        console.log(`Fetching transactions from: ${url}`);
      }
      
      const response = await fetchWithTimeout(url);
      
      // Handle specific error codes
      if (response.status === 429) {
        // Rate limited - retry with exponential backoff
        if (retryCount < MAX_RETRIES) {
          const retryDelay = RETRY_DELAY * Math.pow(2, retryCount);
          console.log(`Rate limited. Retrying in ${retryDelay}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
          await delay(retryDelay);
          return fetchAddressTransactions(address, network, retryCount + 1);
        }
        throw new Error('RATE_LIMIT');
      }
      if (response.status === 404) {
        // Address exists but has no transactions
        return [];
      }
      if (response.status === 503) {
        // Service unavailable - retry
        if (retryCount < MAX_RETRIES) {
          const retryDelay = RETRY_DELAY * Math.pow(2, retryCount);
          console.log(`Service unavailable. Retrying in ${retryDelay}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
          await delay(retryDelay);
          return fetchAddressTransactions(address, network, retryCount + 1);
        }
        throw new Error('SERVICE_UNAVAILABLE');
      }
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const batch: MempoolTransaction[] = await response.json();
      
      // Filter to only confirmed transactions
      const confirmedBatch = batch.filter(tx => tx.status.confirmed);
      
      allTransactions.push(...confirmedBatch);
      
      // Set up for next page
      if (batch.length === 25) {
        lastTxId = batch[batch.length - 1].txid;
        // Be polite: add delay between requests
        await delay(REQUEST_DELAY);
      } else {
        // No more pages
        lastTxId = null;
      }
    } while (lastTxId);
    
    console.log(`Fetched ${allTransactions.length} confirmed transactions for ${address}`);
    return allTransactions;
    
  } catch (error: any) {
    if (error.message === 'RATE_LIMIT') {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }
    if (error.message === 'SERVICE_UNAVAILABLE') {
      throw new Error('Mempool.space is currently unavailable. Please try again later.');
    }
    if (error.message === 'Request timed out') {
      throw new Error('Request timed out. The blockchain API may be slow. Please try again.');
    }
    
    console.error('Error fetching transactions:', error);
    throw new Error('Unable to fetch transactions from blockchain. Please try again later.');
  }
}

/**
 * Parse a raw Mempool transaction into our format
 * @param rawTx - Raw transaction from Mempool API
 * @param userAddress - Single address (for single address wallets) or one of the wallet addresses
 * @param network - Network type
 * @param walletAddresses - Optional: Set of all addresses in the wallet (for xpub wallets to detect change transactions)
 */
export function parseTransaction(
  rawTx: MempoolTransaction,
  userAddress: string,
  network: 'mainnet' | 'testnet' = 'mainnet',
  walletAddresses?: Set<string>
): ParsedTransaction {
  // Use wallet addresses if provided, otherwise just use the single userAddress
  const addressesToCheck = walletAddresses || new Set([userAddress]);
  
  // Determine if user sent or received
  const userInputs = rawTx.vin.filter(
    input => addressesToCheck.has(input.prevout?.scriptpubkey_address || '')
  );
  const userOutputs = rawTx.vout.filter(
    output => addressesToCheck.has(output.scriptpubkey_address || '')
  );
  
  // Also find external outputs (to addresses not in the wallet)
  const externalOutputs = rawTx.vout.filter(
    output => output.scriptpubkey_address && !addressesToCheck.has(output.scriptpubkey_address)
  );
  
  const isSent = userInputs.length > 0;
  const isReceived = userOutputs.length > 0;
  
  // Calculate totals
  const totalInputSatoshis = userInputs.reduce((sum, input) => sum + (input.prevout?.value || 0), 0);
  const totalOutputSatoshis = userOutputs.reduce((sum, output) => sum + (output.value || 0), 0);
  const totalExternalOutputSatoshis = externalOutputs.reduce((sum, output) => sum + (output.value || 0), 0);
  const feeSatoshis = rawTx.fee || 0;
  
  // Determine transaction type
  let txType: 'sent' | 'received' | 'self';
  let amountSatoshis: number;
  
  if (isSent && isReceived) {
    // Transaction involves user addresses in both inputs and outputs
    // This could be:
    // 1. Change transaction: output amount ≈ input amount (minus fee), external output is small or zero
    // 2. Self-transfer/consolidation: actual value movement between your addresses
    // 3. Regular send with change: significant external output, small change back
    
    const netAmount = totalInputSatoshis - totalOutputSatoshis - totalExternalOutputSatoshis;
    const feeTolerance = Math.max(feeSatoshis * 2, 1000); // At least 1000 satoshis tolerance, or 2x fee
    
    // Calculate the ratio of wallet output to input
    const outputToInputRatio = totalInputSatoshis > 0 ? totalOutputSatoshis / totalInputSatoshis : 0;
    
    // Check if this is a change transaction:
    // - Wallet output is close to input (within fee tolerance + small external output)
    // - Output ratio is high (e.g., > 0.8, meaning most of the input came back as change)
    // - External output is small compared to change output (or zero)
    const isChangeTransaction = 
      Math.abs(totalInputSatoshis - totalOutputSatoshis - feeSatoshis) <= feeTolerance &&
      outputToInputRatio > 0.8 && // At least 80% of input came back as change
      totalExternalOutputSatoshis < totalOutputSatoshis * 0.5; // External output is less than 50% of change
    
    if (isChangeTransaction) {
      // Change transaction - sending from one of your addresses to another (change address)
      txType = 'self';
      amountSatoshis = 0; // Net amount is just the fee, no actual value moved
    } else if (totalExternalOutputSatoshis > 0) {
      // Regular send transaction with change back
      txType = 'sent';
      amountSatoshis = totalExternalOutputSatoshis; // Amount actually sent externally
    } else {
      // Self-transfer with actual value movement (e.g., consolidation)
      txType = 'self';
      amountSatoshis = Math.abs(totalInputSatoshis - totalOutputSatoshis - feeSatoshis);
    }
  } else if (isSent) {
    // Sent transaction - money left the wallet (no change back to wallet)
    txType = 'sent';
    // Use external output amount (what was actually sent), not total input
    amountSatoshis = totalExternalOutputSatoshis > 0 
      ? totalExternalOutputSatoshis 
      : totalInputSatoshis - feeSatoshis; // Fallback if no external outputs (shouldn't happen)
  } else {
    // Received transaction
    txType = 'received';
    amountSatoshis = totalOutputSatoshis;
  }
  
  // Convert satoshis to BTC
  const amountBtc = amountSatoshis / 100000000;
  const feeBtc = feeSatoshis / 100000000;
  
  // Get timestamp from block time
  const timestamp = rawTx.status.block_time
    ? new Date(rawTx.status.block_time * 1000)
    : new Date();
  
  // Calculate confirmations (rough estimate based on current time)
  // For accounting, we only care that it's confirmed (>0)
  const confirmations = rawTx.status.confirmed ? 6 : 0;
  
  return {
    txId: rawTx.txid,
    timestamp,
    txType,
    amountBtc,
    feeBtc,
    confirmations,
    blockHeight: rawTx.status.block_height,
  };
}

/**
 * Calculate USD values for transactions using exchange rates
 */
export async function calculateUsdValues(
  transactions: ParsedTransaction[]
): Promise<TransactionWithUsd[]> {
  const transactionsWithUsd: TransactionWithUsd[] = [];
  const uniqueDates = new Set<string>();
  
  // Collect unique dates to minimize rate API calls
  for (const tx of transactions) {
    const dateStr = tx.timestamp.toISOString().split('T')[0];
    uniqueDates.add(dateStr);
  }
  
  console.log(`Need exchange rates for ${uniqueDates.size} unique dates`);
  
  // Process each transaction
  for (const tx of transactions) {
    try {
      const rate = await getExchangeRate(tx.timestamp);
      
      transactionsWithUsd.push({
        ...tx,
        usdValue: tx.amountBtc * rate,
        feeUsd: tx.feeBtc * rate,
        exchangeRate: rate,
      });
    } catch (error) {
      console.error(`Failed to get exchange rate for ${tx.timestamp}:`, error);
      throw new Error('Unable to fetch exchange rates. Please try again later.');
    }
  }
  
  return transactionsWithUsd;
}

/**
 * Main entry point: Fetch, parse, and calculate USD values for an address
 */
export async function fetchAndProcessTransactions(
  address: string,
  network: 'mainnet' | 'testnet' = 'mainnet'
): Promise<TransactionWithUsd[]> {
  // Step 1: Fetch from blockchain
  const rawTransactions = await fetchAddressTransactions(address, network);
  
  if (rawTransactions.length === 0) {
    return [];
  }
  
  // Step 2: Parse transactions
  const parsedTransactions = rawTransactions.map(tx => 
    parseTransaction(tx, address, network)
  );
  
  // Step 3: Calculate USD values
  const transactionsWithUsd = await calculateUsdValues(parsedTransactions);
  
  return transactionsWithUsd;
}

/**
 * Helper function to process addresses in batches with concurrency control
 */
async function fetchAddressBatchWithConcurrency(
  addresses: string[],
  network: 'mainnet' | 'testnet',
  concurrency: number = 3
): Promise<Array<{ address: string; transactions: MempoolTransaction[] }>> {
  const results: Array<{ address: string; transactions: MempoolTransaction[] }> = [];
  const failedAddresses: Array<{ address: string; retries: number }> = [];
  
  // First pass: try to fetch all addresses
  for (let i = 0; i < addresses.length; i += concurrency) {
    const batch = addresses.slice(i, i + concurrency);
    
    const batchResults = await Promise.all(
      batch.map(async (address) => {
        try {
          const transactions = await fetchAddressTransactions(address, network, 0);
          return { address, transactions, success: true };
        } catch (error: any) {
          if (error.message === 'RATE_LIMIT' || error.message === 'SERVICE_UNAVAILABLE') {
            // Will retry later
            failedAddresses.push({ address, retries: 0 });
            return { address, transactions: [], success: false };
          }
          console.error(`Failed to fetch transactions for ${address}:`, error.message);
          return { address, transactions: [], success: false };
        }
      })
    );
    
    // Add successful results
    for (const result of batchResults) {
      if (result.success) {
        results.push({ address: result.address, transactions: result.transactions });
      }
    }
    
    // Polite delay between batches to avoid rate limiting
    if (i + concurrency < addresses.length) {
      await delay(REQUEST_DELAY);
    }
  }
  
  // Retry failed addresses with exponential backoff
  if (failedAddresses.length > 0) {
    console.log(`Retrying ${failedAddresses.length} failed addresses...`);
    for (const { address } of failedAddresses) {
      try {
        // Wait longer before retrying failed addresses
        await delay(RETRY_DELAY);
        const transactions = await fetchAddressTransactions(address, network, 0);
        results.push({ address, transactions });
        console.log(`✓ Successfully fetched transactions for ${address.substring(0, 20)}...`);
      } catch (error: any) {
        console.error(`Failed to fetch transactions for ${address} after retry:`, error.message);
        // Still add empty result so we don't break the flow
        results.push({ address, transactions: [] });
      }
    }
  }
  
  return results;
}

/**
 * Scan a single chain (external or internal) of an xpub
 * Returns raw transactions and addresses found
 */
async function scanXpubChain(
  xpub: string,
  network: 'mainnet' | 'testnet',
  chain: number,
  chainName: string,
  deriveAddressesFromXpub: any,
  allRawTransactionsMap: Map<string, MempoolTransaction>,
  allWalletAddresses: Set<string>
): Promise<{ addressesChecked: number; addressesWithTransactions: number }> {
  const GAP_LIMIT = 20;
  const BATCH_SIZE = 10; // Reduced batch size to avoid rate limits
  const MAX_ADDRESSES = 200;
  const CONCURRENCY = 2; // Reduced concurrency to avoid rate limits
  
  
  let currentIndex = 0;
  let consecutiveEmptyAddresses = 0;
  let addressesChecked = 0;
  let addressesWithTransactions = 0;
  
  console.log(`\nScanning ${chainName} chain (${chain === 0 ? 'receiving' : 'change'})...`);
  
  while (consecutiveEmptyAddresses < GAP_LIMIT && currentIndex < MAX_ADDRESSES) {
    const startTime = Date.now();
    
    // Derive batch of addresses for this chain
    console.log(`  Deriving ${chainName} addresses ${currentIndex} to ${currentIndex + BATCH_SIZE - 1}...`);
    const addresses = deriveAddressesFromXpub(xpub, BATCH_SIZE, currentIndex, chain);
    
    // Add all addresses to the wallet addresses set
    addresses.forEach(addr => allWalletAddresses.add(addr));
    
    // Fetch transactions for all addresses in this batch
    console.log(`  Checking ${chainName} addresses ${currentIndex} to ${currentIndex + BATCH_SIZE - 1}...`);
    const batchResults = await fetchAddressBatchWithConcurrency(addresses, network, CONCURRENCY);
    
    // Process results
    let batchHadTransactions = false;
    for (const { address, transactions } of batchResults) {
      addressesChecked++;
      
      if (transactions.length > 0) {
        batchHadTransactions = true;
        addressesWithTransactions++;
        consecutiveEmptyAddresses = 0;
        
        console.log(`    ✓ ${chainName} address ${address.substring(0, 20)}... has ${transactions.length} transaction(s)`);
        
        // Store raw transactions (deduplicated by txId)
        for (const rawTx of transactions) {
          if (!allRawTransactionsMap.has(rawTx.txid)) {
            allRawTransactionsMap.set(rawTx.txid, rawTx);
          }
        }
      } else {
        consecutiveEmptyAddresses++;
      }
    }
    
    const elapsed = Date.now() - startTime;
    console.log(`  ${chainName} batch ${currentIndex}-${currentIndex + BATCH_SIZE - 1} completed in ${elapsed}ms`);
    
    if (!batchHadTransactions) {
      console.log(`  No transactions in ${chainName} batch. Gap: ${consecutiveEmptyAddresses}/${GAP_LIMIT}`);
      
    }
    
    currentIndex += BATCH_SIZE;
  }
  
  if (currentIndex >= MAX_ADDRESSES) {
    console.warn(`  ⚠️  Reached ${MAX_ADDRESSES} address limit on ${chainName} chain`);
  } else {
    console.log(`  ✓ ${chainName} chain gap limit reached`);
  }
  
  
  return { addressesChecked, addressesWithTransactions };
}

/**
 * Fetch and process all transactions for an xpub (HD wallet)
 * Uses gap limit algorithm to find all used addresses
 * Scans BOTH external (receiving) and internal (change) chains
 * 
 * @param xpub - Extended public key (xpub/ypub/zpub)
 * @param network - mainnet or testnet
 * @returns All transactions from the HD wallet
 */
export async function fetchXpubTransactions(
  xpub: string,
  network: 'mainnet' | 'testnet' = 'mainnet'
): Promise<TransactionWithUsd[]> {
  // Store raw transactions (will be re-parsed with full wallet context)
  const allRawTransactionsMap = new Map<string, MempoolTransaction>();
  // Store all wallet addresses (external + internal chains)
  const allWalletAddresses = new Set<string>();
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Starting HD wallet scan for ${xpub.substring(0, 20)}... on ${network}`);
  console.log(`${'='.repeat(60)}`);
  
  // Import the validator
  const { deriveAddressesFromXpub } = await import('../modules/accounting/bitcoin-validator.js');
  
  let totalAddressesChecked = 0;
  let totalAddressesWithTransactions = 0;
  
  // Scan external chain (receiving addresses) - chain 0
  const externalResults = await scanXpubChain(
    xpub,
    network,
    0,
    'External',
    deriveAddressesFromXpub,
    allRawTransactionsMap,
    allWalletAddresses
  );
  totalAddressesChecked += externalResults.addressesChecked;
  totalAddressesWithTransactions += externalResults.addressesWithTransactions;
  
  // Scan internal chain (change addresses) - chain 1
  const internalResults = await scanXpubChain(
    xpub,
    network,
    1,
    'Internal',
    deriveAddressesFromXpub,
    allRawTransactionsMap,
    allWalletAddresses
  );
  totalAddressesChecked += internalResults.addressesChecked;
  totalAddressesWithTransactions += internalResults.addressesWithTransactions;
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Scan Complete!`);
  console.log(`  Total addresses checked: ${totalAddressesChecked}`);
  console.log(`  Addresses with transactions: ${totalAddressesWithTransactions}`);
  console.log(`  Unique transactions found: ${allRawTransactionsMap.size}`);
  console.log(`  Total wallet addresses: ${allWalletAddresses.size}`);
  console.log(`${'='.repeat(60)}\n`);
  
  // Now parse all transactions with knowledge of all wallet addresses
  // This allows us to correctly identify change transactions
  console.log(`Parsing ${allRawTransactionsMap.size} transactions with full wallet context...`);
  const allParsedTransactions: ParsedTransaction[] = [];
  
  for (const [txId, rawTx] of allRawTransactionsMap) {
    // Parse with all wallet addresses - this will correctly detect change transactions
    const parsedTx = parseTransaction(rawTx, '', network, allWalletAddresses);
    allParsedTransactions.push(parsedTx);
  }
  
  if (allParsedTransactions.length === 0) {
    return [];
  }
  
  // Calculate USD values for all transactions
  console.log(`Calculating USD values for ${allParsedTransactions.length} transactions...`);
  const transactionsWithUsd = await calculateUsdValues(allParsedTransactions);
  
  // Sort by timestamp (newest first)
  transactionsWithUsd.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  
  console.log(`✓ xpub scan complete. Found ${transactionsWithUsd.length} transactions.`);
  
  return transactionsWithUsd;
}

