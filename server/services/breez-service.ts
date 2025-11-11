import { BreezWallet, InsertBreezWallet, WalletTransaction, InsertWalletTransaction } from '@shared/schema';
import { storage } from '../storage';
import CryptoJS from 'crypto-js';

interface BreezInvoice {
  invoiceId: string;
  invoice: string;
  amountSats: number;
  description: string;
  expiresAt: Date;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
}

interface BreezPayment {
  paymentId: string;
  invoice: string;
  amountSats: number;
  status: 'pending' | 'completed' | 'failed';
  transactionHash?: string;
  createdAt: Date;
}

interface BreezNodeInfo {
  nodeId: string;
  alias: string;
  color: string;
  version: string;
  features: string[];
  channels: {
    total: number;
    active: number;
    pending: number;
  };
  balance: {
    total: number;
    available: number;
    pending: number;
  };
}

export class BreezService {
  private apiKey: string;
  private baseUrl: string;
  private network: string;
  private webhookSecret: string;
  private encryptionKey: string;

  constructor() {
    this.apiKey = process.env.BREEZ_API_KEY!;
    this.baseUrl = process.env.BREEZ_BASE_URL || 'https://api.breez.technology';
    this.network = process.env.BREEZ_NETWORK || 'testnet';
    this.webhookSecret = process.env.BREEZ_WEBHOOK_SECRET!;
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
  }

  /**
   * Encrypt sensitive data before storing in database
   */
  private encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, this.encryptionKey).toString();
  }

  /**
   * Decrypt sensitive data from database
   */
  private decrypt(encryptedText: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedText, this.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Get headers for API requests
   */
  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'PaidIn/1.0',
    };
  }

  /**
   * Make API request with error handling and retries
   */
  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any,
    retries: number = 3
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          method,
          headers: this.getHeaders(),
          body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Breez API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error(`Breez API request attempt ${attempt} failed:`, error);
        
        if (attempt === retries) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw new Error('All retry attempts failed');
  }

  /**
   * Initialize a new Breez wallet
   */
  async initializeWallet(
    userId: number,
    companyId: number,
    walletType: 'company' | 'employee'
  ): Promise<BreezWallet> {
    try {
      // Generate a unique node ID for this wallet
      const nodeId = this.generateNodeId();
      
      // Create wallet in Breez system
      const walletData = await this.makeRequest<{
        nodeId: string;
        status: 'initializing' | 'active' | 'error';
        balance: number;
        invoiceCapability: boolean;
      }>('/v1/wallets', 'POST', {
        nodeId,
        network: this.network,
        type: walletType,
        userId: userId.toString(),
        companyId: companyId.toString(),
      });

      // Store wallet in database
      const walletRecord: InsertBreezWallet = {
        companyId,
        userId: walletType === 'employee' ? userId : undefined,
        walletType,
        breezNodeId: walletData.nodeId,
        balance: walletData.balance,
        invoiceCapability: walletData.invoiceCapability,
        status: walletData.status,
        createdAt: new Date(),
      };

      const savedWallet = await storage.createBreezWallet(walletRecord);
      return savedWallet;
    } catch (error) {
      console.error('Breez wallet initialization error:', error);
      throw new Error('Failed to initialize Breez wallet');
    }
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(walletId: number): Promise<number> {
    try {
      const wallet = await storage.getBreezWalletById(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Sync with Breez API
      const nodeInfo = await this.getNodeInfo(wallet.breezNodeId);
      
      // Update balance in database
      await storage.updateBreezWallet(walletId, {
        balance: nodeInfo.balance.total,
        lastSyncAt: new Date(),
      });

      return nodeInfo.balance.total;
    } catch (error) {
      console.error('Breez wallet balance error:', error);
      throw new Error('Failed to get wallet balance');
    }
  }

  /**
   * Generate a Lightning invoice
   */
  async generateInvoice(
    walletId: number,
    amountSats: number,
    description: string
  ): Promise<BreezInvoice> {
    try {
      const wallet = await storage.getBreezWalletById(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const invoiceData = await this.makeRequest<{
        invoiceId: string;
        invoice: string;
        amountSats: number;
        expiresAt: string;
        status: 'pending';
      }>('/v1/invoices', 'POST', {
        nodeId: wallet.breezNodeId,
        amount: amountSats,
        description,
        expiry: 3600, // 1 hour
      });

      const invoice: BreezInvoice = {
        invoiceId: invoiceData.invoiceId,
        invoice: invoiceData.invoice,
        amountSats: invoiceData.amountSats,
        description,
        expiresAt: new Date(invoiceData.expiresAt),
        status: invoiceData.status,
      };

      // Log transaction
      await storage.createWalletTransaction({
        companyId: wallet.companyId,
        userId: wallet.userId || 0,
        transactionType: 'funding',
        sourceType: 'breez',
        sourceId: invoiceData.invoiceId,
        amount: amountSats,
        currency: 'sats',
        status: 'pending',
        metadata: JSON.stringify({
          description,
          walletId,
          invoice: invoiceData.invoice,
        }),
        createdAt: new Date(),
      });

      return invoice;
    } catch (error) {
      console.error('Breez invoice generation error:', error);
      throw new Error('Failed to generate Lightning invoice');
    }
  }

  /**
   * Pay a Lightning invoice
   */
  async payInvoice(walletId: number, invoice: string): Promise<BreezPayment> {
    try {
      const wallet = await storage.getBreezWalletById(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const paymentData = await this.makeRequest<{
        paymentId: string;
        amountSats: number;
        status: 'pending' | 'completed' | 'failed';
        transactionHash?: string;
        createdAt: string;
      }>('/v1/payments', 'POST', {
        nodeId: wallet.breezNodeId,
        invoice,
      });

      const payment: BreezPayment = {
        paymentId: paymentData.paymentId,
        invoice,
        amountSats: paymentData.amountSats,
        status: paymentData.status,
        transactionHash: paymentData.transactionHash,
        createdAt: new Date(paymentData.createdAt),
      };

      // Log transaction
      await storage.createWalletTransaction({
        companyId: wallet.companyId,
        userId: wallet.userId || 0,
        transactionType: 'payout',
        sourceType: 'breez',
        sourceId: paymentData.paymentId,
        amount: paymentData.amountSats,
        currency: 'sats',
        status: paymentData.status === 'completed' ? 'completed' : 'pending',
        metadata: JSON.stringify({
          invoice,
          walletId,
          transactionHash: paymentData.transactionHash,
        }),
        createdAt: new Date(),
      });

      return payment;
    } catch (error) {
      console.error('Breez invoice payment error:', error);
      throw new Error('Failed to pay Lightning invoice');
    }
  }

  /**
   * Sync wallet state with Breez
   */
  async syncWallet(walletId: number): Promise<BreezNodeInfo> {
    try {
      const wallet = await storage.getBreezWalletById(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const nodeInfo = await this.getNodeInfo(wallet.breezNodeId);
      
      // Update wallet in database
      await storage.updateBreezWallet(walletId, {
        balance: nodeInfo.balance.total,
        status: 'active',
        lastSyncAt: new Date(),
      });

      return nodeInfo;
    } catch (error) {
      console.error('Breez wallet sync error:', error);
      throw new Error('Failed to sync wallet');
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(walletId: number, limit: number = 50): Promise<WalletTransaction[]> {
    try {
      const wallet = await storage.getBreezWalletById(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      return await storage.getWalletTransactions(
        wallet.userId || 0,
        wallet.companyId
      );
    } catch (error) {
      console.error('Breez transaction history error:', error);
      throw new Error('Failed to get transaction history');
    }
  }

  /**
   * Get node information from Breez API
   */
  private async getNodeInfo(nodeId: string): Promise<BreezNodeInfo> {
    try {
      const nodeInfo = await this.makeRequest<{
        nodeId: string;
        alias: string;
        color: string;
        version: string;
        features: string[];
        channels: {
          total: number;
          active: number;
          pending: number;
        };
        balance: {
          total: number;
          available: number;
          pending: number;
        };
      }>(`/v1/nodes/${nodeId}`);

      return {
        nodeId: nodeInfo.nodeId,
        alias: nodeInfo.alias,
        color: nodeInfo.color,
        version: nodeInfo.version,
        features: nodeInfo.features,
        channels: nodeInfo.channels,
        balance: nodeInfo.balance,
      };
    } catch (error) {
      console.error('Breez node info error:', error);
      throw new Error('Failed to get node information');
    }
  }

  /**
   * Generate a unique node ID
   */
  private generateNodeId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    return `paidin_${timestamp}_${random}`;
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      // Simple signature verification - in production, use proper HMAC verification
      const expectedSignature = this.webhookSecret;
      return signature === expectedSignature;
    } catch (error) {
      console.error('Breez webhook signature verification error:', error);
      return false;
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(eventType: string, payload: any): Promise<void> {
    try {
      console.log('Breez webhook received:', eventType, payload);

      switch (eventType) {
        case 'invoice.paid':
          await this.handleInvoicePaid(payload);
          break;
        case 'invoice.expired':
          await this.handleInvoiceExpired(payload);
          break;
        case 'payment.completed':
          await this.handlePaymentCompleted(payload);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(payload);
          break;
        case 'wallet.synced':
          await this.handleWalletSynced(payload);
          break;
        default:
          console.log('Unhandled Breez webhook event:', eventType);
      }
    } catch (error) {
      console.error('Breez webhook handling error:', error);
      throw error;
    }
  }

  /**
   * Handle invoice payment
   */
  private async handleInvoicePaid(payload: any): Promise<void> {
    try {
      const { invoiceId, amountSats, transactionHash } = payload;
      console.log('Invoice paid:', invoiceId, amountSats, transactionHash);

      // Update wallet balance
      const wallet = await this.findWalletByInvoiceId(invoiceId);
      if (wallet) {
        await this.syncWallet(wallet.id);
      }

      // Log webhook event
      await storage.createWebhookEvent({
        provider: 'breez',
        eventType: 'invoice.paid',
        eventId: invoiceId,
        payload: JSON.stringify(payload),
        processed: true,
        processedAt: new Date(),
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Invoice paid handling error:', error);
      throw error;
    }
  }

  /**
   * Handle invoice expiration
   */
  private async handleInvoiceExpired(payload: any): Promise<void> {
    try {
      const { invoiceId } = payload;
      console.log('Invoice expired:', invoiceId);

      // Log webhook event
      await storage.createWebhookEvent({
        provider: 'breez',
        eventType: 'invoice.expired',
        eventId: invoiceId,
        payload: JSON.stringify(payload),
        processed: true,
        processedAt: new Date(),
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Invoice expired handling error:', error);
      throw error;
    }
  }

  /**
   * Handle payment completion
   */
  private async handlePaymentCompleted(payload: any): Promise<void> {
    try {
      const { paymentId, amountSats, transactionHash } = payload;
      console.log('Payment completed:', paymentId, amountSats, transactionHash);

      // Update wallet balance
      const wallet = await this.findWalletByPaymentId(paymentId);
      if (wallet) {
        await this.syncWallet(wallet.id);
      }

      // Log webhook event
      await storage.createWebhookEvent({
        provider: 'breez',
        eventType: 'payment.completed',
        eventId: paymentId,
        payload: JSON.stringify(payload),
        processed: true,
        processedAt: new Date(),
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Payment completed handling error:', error);
      throw error;
    }
  }

  /**
   * Handle payment failure
   */
  private async handlePaymentFailed(payload: any): Promise<void> {
    try {
      const { paymentId, error } = payload;
      console.log('Payment failed:', paymentId, error);

      // Log webhook event
      await storage.createWebhookEvent({
        provider: 'breez',
        eventType: 'payment.failed',
        eventId: paymentId,
        payload: JSON.stringify(payload),
        processed: true,
        processedAt: new Date(),
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Payment failed handling error:', error);
      throw error;
    }
  }

  /**
   * Handle wallet sync
   */
  private async handleWalletSynced(payload: any): Promise<void> {
    try {
      const { nodeId, balance } = payload;
      console.log('Wallet synced:', nodeId, balance);

      // Find wallet by node ID and update balance
      const wallets = await storage.getWebhookEvents('breez', false);
      // This would require additional logic to find the wallet by nodeId
      
      // Log webhook event
      await storage.createWebhookEvent({
        provider: 'breez',
        eventType: 'wallet.synced',
        eventId: nodeId,
        payload: JSON.stringify(payload),
        processed: true,
        processedAt: new Date(),
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Wallet synced handling error:', error);
      throw error;
    }
  }

  /**
   * Find wallet by invoice ID
   */
  private async findWalletByInvoiceId(invoiceId: string): Promise<BreezWallet | null> {
    try {
      // This would require querying wallet transactions to find the wallet
      // For now, return null
      return null;
    } catch (error) {
      console.error('Find wallet by invoice ID error:', error);
      return null;
    }
  }

  /**
   * Find wallet by payment ID
   */
  private async findWalletByPaymentId(paymentId: string): Promise<BreezWallet | null> {
    try {
      // This would require querying wallet transactions to find the wallet
      // For now, return null
      return null;
    } catch (error) {
      console.error('Find wallet by payment ID error:', error);
      return null;
    }
  }
}

export const breezService = new BreezService();
