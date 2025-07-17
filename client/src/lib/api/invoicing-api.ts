// Types for Invoicing API
export interface Invoice {
  id: string;
  clientName: string;
  clientEmail: string;
  amountUsd: string;
  amountBtc: string;
  description: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  createdAt: string;
  paidAt?: string;
  btcAddress?: string;
  paymentUrl?: string;
}

export interface CreateInvoiceRequest {
  clientName: string;
  clientEmail: string;
  amountUsd: string;
  description: string;
  dueDate?: string;
}

export interface CreateInvoiceResponse {
  invoice: Invoice;
  paymentUrl: string;
}

class InvoicingApiService {
  private readonly baseUrl = '/api/invoices';

  async getInvoices(): Promise<Invoice[]> {
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
      console.error('Failed to fetch invoices:', error);
      throw new Error('Unable to fetch invoices. Please try again later.');
    }
  }

  async getInvoice(id: string): Promise<Invoice> {
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
      console.error('Failed to fetch invoice:', error);
      throw new Error('Unable to fetch invoice details. Please try again later.');
    }
  }

  async createInvoice(data: CreateInvoiceRequest): Promise<CreateInvoiceResponse> {
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
      console.error('Failed to create invoice:', error);
      throw new Error('Unable to create invoice. Please try again later.');
    }
  }

  async updateInvoice(id: string, data: Partial<CreateInvoiceRequest>): Promise<Invoice> {
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
      console.error('Failed to update invoice:', error);
      throw new Error('Unable to update invoice. Please try again later.');
    }
  }

  async deleteInvoice(id: string): Promise<void> {
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
      console.error('Failed to delete invoice:', error);
      throw new Error('Unable to delete invoice. Please try again later.');
    }
  }

  async getPaymentStatus(id: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/payment-status`, {
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
      throw new Error('Unable to fetch payment status. Please try again later.');
    }
  }

  async updateInvoiceStatus(id: string, status: string): Promise<Invoice> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/status`, {
        method: 'PUT',
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
      console.error('Failed to update invoice status:', error);
      throw new Error('Unable to update invoice status. Please try again later.');
    }
  }
}

export const invoicingApi = new InvoicingApiService(); 