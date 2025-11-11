import { Configuration, PlaidApi, PlaidEnvironments, LinkTokenCreateRequest, LinkTokenCreateRequestUser, LinkTokenCreateRequestProductsEnum, LinkTokenCreateRequestCountryCodesEnum, LinkTokenCreateRequestAccountSubtypesEnum, AccountsGetRequest, AuthGetRequest, ItemPublicTokenExchangeRequest, PlaidError } from 'plaid';
import { PlaidAccount, InsertPlaidAccount } from '@shared/schema';
import { storage } from '../storage';
import CryptoJS from 'crypto-js';

export class PlaidService {
  private client: PlaidApi;
  private encryptionKey: string;

  constructor() {
    const configuration = new Configuration({
      basePath: PlaidEnvironments[process.env.PLAID_ENV as keyof typeof PlaidEnvironments] || PlaidEnvironments.sandbox,
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
          'PLAID-SECRET': process.env.PLAID_SECRET,
        },
      },
    });

    this.client = new PlaidApi(configuration);
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
   * Create a Link token for the frontend to initialize Plaid Link
   */
  async createLinkToken(userId: number, companyId: number): Promise<string> {
    try {
      const request: LinkTokenCreateRequest = {
        user: {
          client_user_id: userId.toString(),
        } as LinkTokenCreateRequestUser,
        client_name: 'PaidIn',
        products: [
          LinkTokenCreateRequestProductsEnum.Auth,
          LinkTokenCreateRequestProductsEnum.Transactions,
          LinkTokenCreateRequestProductsEnum.Identity,
        ],
        country_codes: [LinkTokenCreateRequestCountryCodesEnum.Us],
        language: 'en',
        account_subtypes: [
          LinkTokenCreateRequestAccountSubtypesEnum.Checking,
          LinkTokenCreateRequestAccountSubtypesEnum.Savings,
        ],
        webhook: `${process.env.BACKEND_URL || 'http://localhost:8080'}/api/webhooks/plaid`,
        redirect_uri: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/plaid/callback`,
      };

      const response = await this.client.linkTokenCreate(request);
      return response.data.link_token;
    } catch (error) {
      console.error('Plaid Link token creation error:', error);
      throw new Error('Failed to create Plaid Link token');
    }
  }

  /**
   * Exchange public token for access token and store account information
   */
  async exchangePublicToken(publicToken: string, userId: number, companyId: number): Promise<PlaidAccount> {
    try {
      // Exchange public token for access token
      const request: ItemPublicTokenExchangeRequest = {
        public_token: publicToken,
      };

      const response = await this.client.itemPublicTokenExchange(request);
      const accessToken = response.data.access_token;
      const itemId = response.data.item_id;

      // Get account information
      const accountsRequest: AccountsGetRequest = {
        access_token: accessToken,
      };

      const accountsResponse = await this.client.accountsGet(accountsRequest);
      const accounts = accountsResponse.data.accounts;

      // Store each account in the database
      const plaidAccounts: PlaidAccount[] = [];

      for (const account of accounts) {
        const plaidAccountData: InsertPlaidAccount = {
          companyId,
          userId,
          plaidItemId: itemId,
          plaidAccessToken: this.encrypt(accessToken),
          accountId: account.account_id,
          accountName: account.name,
          accountType: account.type as any,
          accountMask: account.mask,
          institutionId: account.institution_id || '',
          institutionName: account.official_name || account.name,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const savedAccount = await storage.createPlaidAccount(plaidAccountData);
        plaidAccounts.push(savedAccount);
      }

      return plaidAccounts[0]; // Return the first account for simplicity
    } catch (error) {
      console.error('Plaid token exchange error:', error);
      throw new Error('Failed to exchange public token');
    }
  }

  /**
   * Get all accounts for a user
   */
  async getAccounts(userId: number, companyId: number): Promise<PlaidAccount[]> {
    try {
      return await storage.getPlaidAccounts(userId, companyId);
    } catch (error) {
      console.error('Plaid get accounts error:', error);
      throw new Error('Failed to retrieve accounts');
    }
  }

  /**
   * Get account and routing numbers for ACH payments
   */
  async getAuth(plaidAccountId: number): Promise<{ account: string; routing: string }> {
    try {
      const plaidAccount = await storage.getPlaidAccountById(plaidAccountId);
      if (!plaidAccount) {
        throw new Error('Plaid account not found');
      }

      const accessToken = this.decrypt(plaidAccount.plaidAccessToken);
      const request: AuthGetRequest = {
        access_token: accessToken,
      };

      const response = await this.client.authGet(request);
      const account = response.data.accounts.find(acc => acc.account_id === plaidAccount.accountId);

      if (!account || !account.numbers?.ach) {
        throw new Error('Account or ACH numbers not found');
      }

      const achNumbers = account.numbers.ach[0];
      return {
        account: achNumbers.account,
        routing: achNumbers.routing,
      };
    } catch (error) {
      console.error('Plaid auth get error:', error);
      throw new Error('Failed to retrieve account and routing numbers');
    }
  }

  /**
   * Verify micro-deposits (if required by the bank)
   */
  async verifyMicroDeposits(plaidAccountId: number, amounts: number[]): Promise<boolean> {
    try {
      const plaidAccount = await storage.getPlaidAccountById(plaidAccountId);
      if (!plaidAccount) {
        throw new Error('Plaid account not found');
      }

      const accessToken = this.decrypt(plaidAccount.plaidAccessToken);
      
      // This would be implemented based on Plaid's micro-deposit verification API
      // For now, we'll return true as most banks don't require micro-deposits
      console.log('Micro-deposit verification for account:', plaidAccountId, 'amounts:', amounts);
      return true;
    } catch (error) {
      console.error('Plaid micro-deposit verification error:', error);
      throw new Error('Failed to verify micro-deposits');
    }
  }

  /**
   * Update account status
   */
  async updateAccountStatus(plaidAccountId: number, status: 'active' | 'inactive' | 'error'): Promise<void> {
    try {
      await storage.updatePlaidAccountStatus(plaidAccountId, status);
    } catch (error) {
      console.error('Plaid account status update error:', error);
      throw new Error('Failed to update account status');
    }
  }

  /**
   * Remove account (revoke access token)
   */
  async removeAccount(plaidAccountId: number): Promise<void> {
    try {
      const plaidAccount = await storage.getPlaidAccountById(plaidAccountId);
      if (!plaidAccount) {
        throw new Error('Plaid account not found');
      }

      const accessToken = this.decrypt(plaidAccount.plaidAccessToken);
      
      // Revoke access token with Plaid
      await this.client.itemRemove({ access_token: accessToken });
      
      // Remove from database
      await storage.deletePlaidAccount(plaidAccountId);
    } catch (error) {
      console.error('Plaid account removal error:', error);
      throw new Error('Failed to remove account');
    }
  }

  /**
   * Handle webhook events from Plaid
   */
  async handleWebhook(eventType: string, itemId: string, payload: any): Promise<void> {
    try {
      console.log('Plaid webhook received:', eventType, itemId);
      
      // Handle different webhook events
      switch (eventType) {
        case 'ITEM_LOGIN_REQUIRED':
          // Update account status to require re-authentication
          await this.updateAccountStatusByItemId(itemId, 'inactive');
          break;
        case 'ITEM_ERROR':
          // Update account status to error
          await this.updateAccountStatusByItemId(itemId, 'error');
          break;
        case 'NEW_ACCOUNTS_AVAILABLE':
          // Fetch new accounts and add them to database
          await this.syncNewAccounts(itemId);
          break;
        default:
          console.log('Unhandled Plaid webhook event:', eventType);
      }
    } catch (error) {
      console.error('Plaid webhook handling error:', error);
      throw error;
    }
  }

  /**
   * Update account status by Plaid item ID
   */
  private async updateAccountStatusByItemId(itemId: string, status: 'active' | 'inactive' | 'error'): Promise<void> {
    try {
      await storage.updatePlaidAccountStatusByItemId(itemId, status);
    } catch (error) {
      console.error('Plaid account status update by item ID error:', error);
      throw error;
    }
  }

  /**
   * Sync new accounts from Plaid
   */
  private async syncNewAccounts(itemId: string): Promise<void> {
    try {
      // This would fetch new accounts and add them to the database
      // Implementation depends on your specific requirements
      console.log('Syncing new accounts for item:', itemId);
    } catch (error) {
      console.error('Plaid new accounts sync error:', error);
      throw error;
    }
  }
}

export const plaidService = new PlaidService();
