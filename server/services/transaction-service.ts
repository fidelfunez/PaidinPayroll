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
const REQUEST_DELAY = 150; // 150ms delay between requests to be polite

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
 * Fetch all transactions for a Bitcoin address
 */
export async function fetchAddressTransactions(
  address: string,
  network: 'mainnet' | 'testnet' = 'mainnet'
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
      
      console.log(`Fetching transactions from: ${url}`);
      
      const response = await fetchWithTimeout(url);
      
      // Handle specific error codes
      if (response.status === 429) {
        throw new Error('RATE_LIMIT');
      }
      if (response.status === 404) {
        // Address exists but has no transactions
        return [];
      }
      if (response.status === 503) {
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
 */
export function parseTransaction(
  rawTx: MempoolTransaction,
  userAddress: string,
  network: 'mainnet' | 'testnet' = 'mainnet'
): ParsedTransaction {
  // Determine if user sent or received
  const userInputs = rawTx.vin.filter(
    input => input.prevout?.scriptpubkey_address === userAddress
  );
  const userOutputs = rawTx.vout.filter(
    output => output.scriptpubkey_address === userAddress
  );
  
  const isSent = userInputs.length > 0;
  const isReceived = userOutputs.length > 0;
  
  // Determine transaction type
  let txType: 'sent' | 'received' | 'self';
  let amountSatoshis: number;
  
  if (isSent && isReceived) {
    // Self-transfer (consolidation)
    txType = 'self';
    // Amount is just what moved (excluding change back to self)
    const totalInput = userInputs.reduce((sum, input) => sum + input.prevout.value, 0);
    const totalOutput = userOutputs.reduce((sum, output) => sum + output.value, 0);
    amountSatoshis = Math.abs(totalInput - totalOutput);
  } else if (isSent) {
    // Sent transaction
    txType = 'sent';
    // Amount is total input from user minus change back to user
    const totalInput = userInputs.reduce((sum, input) => sum + input.prevout.value, 0);
    const totalOutput = userOutputs.reduce((sum, output) => sum + output.value, 0);
    amountSatoshis = totalInput - totalOutput;
  } else {
    // Received transaction
    txType = 'received';
    // Amount is sum of outputs to user
    amountSatoshis = userOutputs.reduce((sum, output) => sum + output.value, 0);
  }
  
  // Convert satoshis to BTC
  const amountBtc = amountSatoshis / 100000000;
  const feeBtc = rawTx.fee / 100000000;
  
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
  
  for (let i = 0; i < addresses.length; i += concurrency) {
    const batch = addresses.slice(i, i + concurrency);
    
    const batchResults = await Promise.all(
      batch.map(async (address) => {
        try {
          const transactions = await fetchAddressTransactions(address, network);
          return { address, transactions };
        } catch (error: any) {
          console.error(`Failed to fetch transactions for ${address}:`, error.message);
          return { address, transactions: [] };
        }
      })
    );
    
    results.push(...batchResults);
    
    // Polite delay between batches to avoid rate limiting
    if (i + concurrency < addresses.length) {
      await delay(REQUEST_DELAY);
    }
  }
  
  return results;
}

/**
 * Scan a single chain (external or internal) of an xpub
 */
async function scanXpubChain(
  xpub: string,
  network: 'mainnet' | 'testnet',
  chain: number,
  chainName: string,
  deriveAddressesFromXpub: any,
  allTransactionsMap: Map<string, TransactionWithUsd>
): Promise<{ addressesChecked: number; addressesWithTransactions: number }> {
  const GAP_LIMIT = 20;
  const BATCH_SIZE = 20;
  const MAX_ADDRESSES = 200;
  const CONCURRENCY = 3;
  
  
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
        
        
        // Parse and add transactions
        for (const rawTx of transactions) {
          const parsedTx = parseTransaction(rawTx, address, network);
          
          
          // Deduplicate by txId
          if (!allTransactionsMap.has(parsedTx.txId)) {
            allTransactionsMap.set(parsedTx.txId, parsedTx as any);
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
  const allTransactionsMap = new Map<string, TransactionWithUsd>();
  
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
    allTransactionsMap
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
    allTransactionsMap
  );
  totalAddressesChecked += internalResults.addressesChecked;
  totalAddressesWithTransactions += internalResults.addressesWithTransactions;
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Scan Complete!`);
  console.log(`  Total addresses checked: ${totalAddressesChecked}`);
  console.log(`  Addresses with transactions: ${totalAddressesWithTransactions}`);
  console.log(`  Unique transactions found: ${allTransactionsMap.size}`);
  console.log(`${'='.repeat(60)}\n`);
  
  // Convert map to array
  const allTransactions = Array.from(allTransactionsMap.values());
  
  if (allTransactions.length === 0) {
    return [];
  }
  
  // Calculate USD values for all transactions
  console.log(`Calculating USD values for ${allTransactions.length} transactions...`);
  const transactionsWithUsd = await calculateUsdValues(allTransactions);
  
  // Sort by timestamp (newest first)
  transactionsWithUsd.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  
  console.log(`✓ xpub scan complete. Found ${transactionsWithUsd.length} transactions.`);
  
  return transactionsWithUsd;
}

