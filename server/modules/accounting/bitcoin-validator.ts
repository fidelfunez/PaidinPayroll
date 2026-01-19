import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';

// Initialize ECC library for Taproot support
bitcoin.initEccLib(ecc);

// Initialize BIP32 with the elliptic curve library
const bip32 = BIP32Factory(ecc);

/**
 * Bitcoin address validation result
 */
export interface AddressValidationResult {
  valid: boolean;
  type?: 'p2pkh' | 'p2sh' | 'p2wpkh' | 'p2wsh' | 'p2tr' | 'unknown';
  network?: 'mainnet' | 'testnet';
  error?: string;
}

/**
 * xpub validation result
 */
export interface XpubValidationResult {
  valid: boolean;
  type?: 'xpub' | 'ypub' | 'zpub' | 'tpub' | 'upub' | 'vpub';
  network?: 'mainnet' | 'testnet';
  error?: string;
}

/**
 * Validate a Bitcoin address
 * Supports: P2PKH, P2SH, P2WPKH, P2WSH, P2TR (Taproot)
 * 
 * @param address - Bitcoin address to validate
 * @returns Validation result with type and network
 */
export function validateBitcoinAddress(address: string): AddressValidationResult {
  if (!address || typeof address !== 'string') {
    return {
      valid: false,
      error: 'Address must be a non-empty string'
    };
  }

  // Trim whitespace
  address = address.trim();

  // For base58 addresses (legacy P2PKH and P2SH), try fromBase58Check first
  if (!address.startsWith('bc1') && !address.startsWith('tb1')) {
    try {
      const decoded = bitcoin.address.fromBase58Check(address);
      
      // Check if it's mainnet or testnet based on version byte
      let network: 'mainnet' | 'testnet';
      let type: 'p2pkh' | 'p2sh';
      
      if (decoded.version === bitcoin.networks.bitcoin.pubKeyHash) {
        // Mainnet P2PKH (version 0x00)
        network = 'mainnet';
        type = 'p2pkh';
      } else if (decoded.version === bitcoin.networks.bitcoin.scriptHash) {
        // Mainnet P2SH (version 0x05)
        network = 'mainnet';
        type = 'p2sh';
      } else if (decoded.version === bitcoin.networks.testnet.pubKeyHash) {
        // Testnet P2PKH (version 0x6f)
        network = 'testnet';
        type = 'p2pkh';
      } else if (decoded.version === bitcoin.networks.testnet.scriptHash) {
        // Testnet P2SH (version 0xc4)
        network = 'testnet';
        type = 'p2sh';
      } else {
        return {
          valid: false,
          error: 'Unknown address version'
        };
      }
      
      return {
        valid: true,
        type,
        network
      };
    } catch (base58Error: any) {
      return {
        valid: false,
        error: 'Invalid Bitcoin address format'
      };
    }
  }

  // For bech32 addresses (SegWit and Taproot), use toOutputScript
  try {
    const decoded = bitcoin.address.toOutputScript(address, bitcoin.networks.bitcoin);
    const type = detectAddressType(address, decoded);
    
    return {
      valid: true,
      type,
      network: 'mainnet'
    };
  } catch (mainnetError: any) {
    // Try testnet
    try {
      const decoded = bitcoin.address.toOutputScript(address, bitcoin.networks.testnet);
      const type = detectAddressType(address, decoded);
      
      return {
        valid: true,
        type,
        network: 'testnet'
      };
    } catch (testnetError: any) {
      return {
        valid: false,
        error: 'Invalid Bitcoin address format'
      };
    }
  }
}

/**
 * Detect the type of Bitcoin address from the script
 */
function detectAddressType(address: string, script: Buffer): 'p2pkh' | 'p2sh' | 'p2wpkh' | 'p2wsh' | 'p2tr' | 'unknown' {
  // Legacy P2PKH (starts with 1 or m/n for testnet)
  if (address.startsWith('1') || address.startsWith('m') || address.startsWith('n')) {
    return 'p2pkh';
  }
  
  // P2SH (starts with 3 or 2 for testnet)
  if (address.startsWith('3') || address.startsWith('2')) {
    return 'p2sh';
  }
  
  // Bech32 addresses (SegWit)
  if (address.startsWith('bc1') || address.startsWith('tb1')) {
    // Check length to determine type
    const dataLength = address.length;
    
    // P2WPKH: bc1q... (42 chars for mainnet)
    if (address.startsWith('bc1q') || address.startsWith('tb1q')) {
      if (dataLength === 42 || dataLength === 43) {
        return 'p2wpkh';
      }
      // P2WSH: bc1q... (62 chars for mainnet)
      if (dataLength === 62 || dataLength === 63) {
        return 'p2wsh';
      }
    }
    
    // P2TR (Taproot): bc1p... (62 chars)
    if (address.startsWith('bc1p') || address.startsWith('tb1p')) {
      return 'p2tr';
    }
  }
  
  return 'unknown';
}

/**
 * Validate an extended public key (xpub, ypub, zpub)
 * 
 * @param xpub - Extended public key to validate
 * @returns Validation result with type and network
 */
export function validateXpub(xpub: string): XpubValidationResult {
  if (!xpub || typeof xpub !== 'string') {
    return {
      valid: false,
      error: 'xpub must be a non-empty string'
    };
  }

  // Trim whitespace
  xpub = xpub.trim();

  // Detect xpub type from prefix
  const type = detectXpubType(xpub);
  if (!type) {
    return {
      valid: false,
      error: 'Invalid xpub format (must start with xpub, ypub, zpub, tpub, upub, or vpub)'
    };
  }

  // Determine network from prefix
  const network = xpub.startsWith('t') || xpub.startsWith('u') || xpub.startsWith('v') 
    ? 'testnet' 
    : 'mainnet';

  // Try to parse the xpub with appropriate network configuration
  try {
    let networkObj;
    
    // ypub and zpub require custom version bytes
    if (type === 'ypub') {
      // BIP49 P2SH-SegWit version bytes
      networkObj = {
        ...bitcoin.networks.bitcoin,
        bip32: {
          public: 0x049d7cb2,  // ypub version bytes
          private: 0x049d7878, // yprv version bytes
        }
      };
    } else if (type === 'zpub') {
      // BIP84 Native SegWit version bytes
      networkObj = {
        ...bitcoin.networks.bitcoin,
        bip32: {
          public: 0x04b24746,  // zpub version bytes
          private: 0x04b2430c, // zprv version bytes
        }
      };
    } else if (type === 'upub') {
      // Testnet ypub
      networkObj = {
        ...bitcoin.networks.testnet,
        bip32: {
          public: 0x044a5262,  // upub version bytes
          private: 0x044a4e28, // uprv version bytes
        }
      };
    } else if (type === 'vpub') {
      // Testnet zpub
      networkObj = {
        ...bitcoin.networks.testnet,
        bip32: {
          public: 0x045f1cf6,  // vpub version bytes
          private: 0x045f18bc, // vprv version bytes
        }
      };
    } else {
      // Standard xpub/tpub
      networkObj = network === 'mainnet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;
    }
    
    bip32.fromBase58(xpub, networkObj);
    
    return {
      valid: true,
      type,
      network
    };
  } catch (error: any) {
    return {
      valid: false,
      error: `Invalid xpub: ${error.message}`
    };
  }
}

/**
 * Detect xpub type from prefix
 */
function detectXpubType(xpub: string): 'xpub' | 'ypub' | 'zpub' | 'tpub' | 'upub' | 'vpub' | null {
  if (xpub.startsWith('xpub')) return 'xpub'; // BIP44 (Legacy P2PKH)
  if (xpub.startsWith('ypub')) return 'ypub'; // BIP49 (P2SH-wrapped SegWit)
  if (xpub.startsWith('zpub')) return 'zpub'; // BIP84 (Native SegWit P2WPKH)
  if (xpub.startsWith('tpub')) return 'tpub'; // Testnet xpub
  if (xpub.startsWith('upub')) return 'upub'; // Testnet ypub
  if (xpub.startsWith('vpub')) return 'vpub'; // Testnet zpub
  return null;
}

/**
 * Derive addresses from an xpub
 * Useful for scanning wallet transactions
 * 
 * @param xpub - Extended public key
 * @param count - Number of addresses to derive (default: 20, typical gap limit)
 * @param startIndex - Starting derivation index (default: 0)
 * @param chain - Address chain: 0 = external (receiving), 1 = internal (change) (default: 0)
 * @returns Array of derived addresses
 */
export function deriveAddressesFromXpub(
  xpub: string,
  count: number = 20,
  startIndex: number = 0,
  chain: number = 0
): string[] {
  const validation = validateXpub(xpub);
  
  if (!validation.valid) {
    throw new Error(`Invalid xpub: ${validation.error}`);
  }

  const network = validation.network === 'mainnet' 
    ? bitcoin.networks.bitcoin 
    : bitcoin.networks.testnet;

  // Configure network for ypub/zpub/upub/vpub
  let networkObj;
  if (validation.type === 'ypub') {
    networkObj = {
      ...bitcoin.networks.bitcoin,
      bip32: {
        public: 0x049d7cb2,
        private: 0x049d7878,
      }
    };
  } else if (validation.type === 'zpub') {
    networkObj = {
      ...bitcoin.networks.bitcoin,
      bip32: {
        public: 0x04b24746,
        private: 0x04b2430c,
      }
    };
  } else if (validation.type === 'upub') {
    networkObj = {
      ...bitcoin.networks.testnet,
      bip32: {
        public: 0x044a5262,
        private: 0x044a4e28,
      }
    };
  } else if (validation.type === 'vpub') {
    networkObj = {
      ...bitcoin.networks.testnet,
      bip32: {
        public: 0x045f1cf6,
        private: 0x045f18bc,
      }
    };
  } else {
    networkObj = network;
  }

  const node = bip32.fromBase58(xpub, networkObj);
  const addresses: string[] = [];

  // Derive addresses following BIP44/49/84 standards
  // Chain 0 = external (receiving addresses)
  // Chain 1 = internal (change addresses)
  for (let i = startIndex; i < startIndex + count; i++) {
    try {
      const child = node.derive(chain).derive(i);
      
      if (!child.publicKey) {
        console.warn(`Could not derive public key for index ${i}`);
        continue;
      }

      let address: string;

      // Determine address type based on xpub type
      if (validation.type === 'xpub' || validation.type === 'tpub') {
        // Legacy P2PKH
        address = bitcoin.payments.p2pkh({ 
          pubkey: child.publicKey, 
          network 
        }).address!;
      } else if (validation.type === 'ypub' || validation.type === 'upub') {
        // P2SH-wrapped SegWit
        const p2wpkh = bitcoin.payments.p2wpkh({ 
          pubkey: child.publicKey, 
          network 
        });
        address = bitcoin.payments.p2sh({ 
          redeem: p2wpkh, 
          network 
        }).address!;
      } else {
        // Native SegWit P2WPKH (zpub/vpub)
        address = bitcoin.payments.p2wpkh({ 
          pubkey: child.publicKey, 
          network 
        }).address!;
      }

      addresses.push(address);
    } catch (error) {
      console.error(`Error deriving address at index ${i}:`, error);
    }
  }

  return addresses;
}

/**
 * Get a user-friendly description of an address type
 */
export function getAddressTypeDescription(type: string): string {
  const descriptions: Record<string, string> = {
    'p2pkh': 'Legacy (P2PKH)',
    'p2sh': 'Script Hash (P2SH)',
    'p2wpkh': 'Native SegWit (P2WPKH)',
    'p2wsh': 'Native SegWit Script (P2WSH)',
    'p2tr': 'Taproot (P2TR)',
    'xpub': 'Extended Public Key - Legacy (BIP44)',
    'ypub': 'Extended Public Key - P2SH-SegWit (BIP49)',
    'zpub': 'Extended Public Key - Native SegWit (BIP84)',
    'tpub': 'Testnet Extended Public Key - Legacy',
    'upub': 'Testnet Extended Public Key - P2SH-SegWit',
    'vpub': 'Testnet Extended Public Key - Native SegWit',
  };
  
  return descriptions[type] || 'Unknown';
}
