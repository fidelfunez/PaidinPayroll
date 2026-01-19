/**
 * Breez Wallet Service (Client-Side)
 * Non-custodial wallet creation - keys never leave the client
 */

import init, {
  connect,
  defaultConfig,
  type BreezSdk,
  type Network,
  type Config,
  type ConnectRequest,
  type Seed,
  type GetInfoRequest,
  type ReceivePaymentRequest,
  type SendPaymentRequest,
} from '@breeztech/breez-sdk-spark/web';
import * as bip39 from 'bip39';
import { Buffer } from 'buffer';

// Make Buffer globally available for libraries that expect it (like bip39)
if (typeof window !== 'undefined' && !(window as any).Buffer) {
  (window as any).Buffer = Buffer;
}

let sdk: BreezSdk | null = null;
let isInitialized = false;

/**
 * Initialize Breez SDK (must be called before any other operations)
 */
export async function initializeBreezSDK(): Promise<void> {
  if (isInitialized) {
    console.log('ℹ️ Breez SDK already initialized');
    return;
  }

  try {
    console.log('🔄 Initializing Breez SDK...');
    // Initialize WebAssembly module
    await init();
    isInitialized = true;
    console.log('✅ Breez SDK initialized successfully');
  } catch (error: any) {
    console.error('❌ Failed to initialize Breez SDK:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    throw new Error(`Breez SDK initialization failed: ${error.message}`);
  }
}

/**
 * Generate a new mnemonic phrase (24 words)
 * This should be shown to the user for backup - NEVER store this!
 */
export function generateWalletMnemonic(): string {
  try {
    // Generate 256 bits (32 bytes) of entropy for 24-word mnemonic
    const entropy = new Uint8Array(32);
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(entropy);
    } else {
      throw new Error('Crypto API not available');
    }

    // Convert to Buffer-like format for bip39
    const entropyBuffer = Buffer.from(entropy);
    
    // Generate mnemonic using bip39
    const mnemonic = bip39.entropyToMnemonic(entropyBuffer.toString('hex'));
    
    return mnemonic;
  } catch (error: any) {
    console.error('Failed to generate mnemonic:', error);
    throw new Error(`Mnemonic generation failed: ${error.message}`);
  }
}

/**
 * Connect to Breez using a mnemonic (creates/restores wallet)
 * This creates the wallet on the client - keys never leave the browser
 */
export async function connectWallet(mnemonic: string): Promise<BreezSdk> {
  if (!isInitialized) {
    await initializeBreezSDK();
  }

  try {
    // Get API key from environment (should be set in vite.config or env)
    const apiKey = import.meta.env.VITE_BREEZ_API_KEY || '';
    const networkEnv = (import.meta.env.VITE_BREEZ_NETWORK as string) || 'regtest';
    
    console.log('🔄 Connecting wallet...', {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      network: networkEnv,
    });
    
    // Network type from SDK
    const network: Network = networkEnv === 'mainnet' ? 'mainnet' : 'regtest';
    
    // Create config
    const config: Config = defaultConfig(network);
    if (apiKey) {
      config.apiKey = apiKey;
    } else {
      console.warn('⚠️ No BREEZ_API_KEY found in environment variables');
    }

    // Create seed from mnemonic
    const seed: Seed = {
      type: 'mnemonic',
      mnemonic,
      passphrase: undefined,
    };

    // Connect wallet (creates wallet client-side)
    const connectRequest: ConnectRequest = {
      config,
      seed,
      storageDir: 'breez-wallet-storage', // Will use IndexedDB in browser
    };

    sdk = await connect(connectRequest);
    console.log('✅ Wallet connected successfully');
    return sdk;
  } catch (error: any) {
    console.error('❌ Failed to connect wallet:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    throw new Error(`Wallet connection failed: ${error.message}`);
  }
}

/**
 * Get wallet node information (includes nodeId needed for backend registration)
 * Note: Breez SDK may not expose nodeId directly, so we generate a unique identifier
 * based on wallet state or use a hash of the mnemonic (for identification purposes only)
 */
export async function getNodeInfo(mnemonic: string): Promise<{ id: string }> {
  if (!sdk) {
    throw new Error('Wallet not connected. Call connectWallet() first.');
  }

  try {
    // Sync wallet to ensure it's ready
    await sdk.syncWallet({});
    
    // Get wallet info
    const infoRequest: GetInfoRequest = {
      ensureSynced: true,
    };
    const info = await sdk.getInfo(infoRequest);
    
    // Generate a deterministic nodeId from mnemonic (first 16 chars of hash)
    // This is used for backend identification - actual wallet keys remain client-side
    const crypto = typeof window !== 'undefined' ? window.crypto : require('crypto').webcrypto;
    const encoder = new TextEncoder();
    const data = encoder.encode(mnemonic);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const nodeId = `paidin_${hashHex.substring(0, 32)}`;
    
    return { id: nodeId };
  } catch (error: any) {
    console.error('Failed to get node info:', error);
    throw new Error(`Failed to get node info: ${error.message}`);
  }
}

/**
 * Generate a Lightning invoice to receive payments
 * TODO: Implement full payment functionality using ReceivePaymentMethod
 */
export async function receivePayment(
  amountSats: number,
  description: string
): Promise<{ paymentRequest: string; fee: number }> {
  if (!sdk) {
    throw new Error('Wallet not connected. Call connectWallet() first.');
  }

  // TODO: Implement using ReceivePaymentMethod
  throw new Error('Payment functionality not yet implemented');
}

/**
 * Pay a Lightning invoice
 * TODO: Implement full payment functionality using PrepareSendPayment
 */
export async function sendPayment(invoice: string): Promise<{ paymentId: string; status: string }> {
  if (!sdk) {
    throw new Error('Wallet not connected. Call connectWallet() first.');
  }

  // TODO: Implement using PrepareSendPayment -> SendPayment flow
  throw new Error('Payment functionality not yet implemented');
}

/**
 * Register wallet with backend (only sends nodeId, never mnemonic!)
 */
export async function registerWalletWithBackend(
  nodeId: string,
  walletType: 'company' | 'employee',
  email?: string // Optional: for signup flow
): Promise<{ walletId: number }> {
  console.log('🔄 Registering wallet with backend...', { nodeId: nodeId.substring(0, 20) + '...', walletType, hasEmail: !!email });
  
  // Use backend URL directly (Vite proxy might not work for all requests)
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
  const apiUrl = `${backendUrl}/api/wallets/breez/register`;
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      nodeId,
      walletType,
      ...(email && { email }), // Include email if provided (for signup flow)
    }),
  });

  if (!response.ok) {
    // Clone response to read it multiple times if needed
    const responseClone = response.clone();
    // Try to parse error, but handle case where response might be HTML
    let error;
    try {
      error = await response.json();
    } catch (e) {
      // If JSON parse fails, read as text instead from clone
      const text = await responseClone.text();
      console.error('❌ Backend registration failed (non-JSON response):', {
        status: response.status,
        statusText: response.statusText,
        responsePreview: text.substring(0, 200),
      });
      throw new Error(`Failed to register wallet: ${response.status} ${response.statusText} - ${text.substring(0, 100)}`);
    }
    console.error('❌ Backend registration failed:', {
      status: response.status,
      statusText: response.statusText,
      error: error,
    });
    throw new Error(error.message || error.error || `Failed to register wallet (${response.status})`);
  }

  const result = await response.json();
  console.log('✅ Wallet registered with backend:', result);
  return result;
}

/**
 * Complete wallet creation flow:
 * 1. Generate mnemonic
 * 2. Connect wallet (creates wallet on client)
 * 3. Get node info
 * 4. Register with backend (only nodeId)
 * 
 * Returns: { mnemonic, nodeId, walletId }
 */
export async function createWallet(
  walletType: 'company' | 'employee',
  email?: string // Optional: for signup flow
): Promise<{
  mnemonic: string;
  nodeId: string;
  walletId: number;
}> {
  try {
    // Initialize SDK if not already done
    if (!isInitialized) {
      await initializeBreezSDK();
    }

    // Step 1: Generate mnemonic (user must backup!)
    // Note: This requires bip39 library for proper generation
    const mnemonic = generateWalletMnemonic();
    console.log('✅ Mnemonic generated (24 words)');

    // Step 2: Connect wallet using mnemonic (creates wallet client-side)
    await connectWallet(mnemonic);
    console.log('✅ Wallet created');

    // Step 3: Get node info (generate unique identifier for backend)
    const nodeInfo = await getNodeInfo(mnemonic);
    console.log('✅ Node info retrieved:', nodeInfo.id);

    // Step 4: Register wallet with backend (only nodeId, never mnemonic!)
    const { walletId } = await registerWalletWithBackend(nodeInfo.id, walletType, email);
    console.log('✅ Wallet registered with backend:', walletId);

    return {
      mnemonic, // User must backup this!
      nodeId: nodeInfo.id,
      walletId,
    };
  } catch (error: any) {
    console.error('Wallet creation failed:', error);
    throw error;
  }
}
