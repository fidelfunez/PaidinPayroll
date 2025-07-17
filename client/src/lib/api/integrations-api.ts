// Types for Integrations API
export interface Integration {
  id: number;
  name: string;
  type: 'slack' | 'quickbooks' | 'zapier' | 'btcpay' | 'lnbits';
  isActive: boolean;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIntegrationRequest {
  name: string;
  type: 'slack' | 'quickbooks' | 'zapier' | 'btcpay' | 'lnbits';
  config: Record<string, any>;
}

export interface TestIntegrationResponse {
  success: boolean;
  message: string;
  details?: any;
}

class IntegrationsApiService {
  private readonly baseUrl = '/api/integrations';

  async getIntegrations(): Promise<Integration[]> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error('Unable to fetch integrations. Please try again later.');
    }
  }

  async getIntegration(id: number): Promise<Integration> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error('Unable to fetch integration details. Please try again later.');
    }
  }

  async createIntegration(data: CreateIntegrationRequest): Promise<Integration> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error('Unable to create integration. Please try again later.');
    }
  }

  async updateIntegration(id: number, data: Partial<CreateIntegrationRequest>): Promise<Integration> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error('Unable to update integration. Please try again later.');
    }
  }

  async deleteIntegration(id: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      throw new Error('Unable to delete integration. Please try again later.');
    }
  }

  async testIntegration(id: number): Promise<TestIntegrationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error('Unable to test integration. Please try again later.');
    }
  }

  async toggleIntegration(id: number, isActive: boolean): Promise<Integration> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/toggle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error('Unable to toggle integration. Please try again later.');
    }
  }
}

export const integrationsApi = new IntegrationsApiService();