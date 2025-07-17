import type { Express } from "express";
import { requireAuth } from "../../auth";
import { storage } from "../../storage";
import { paymentService } from "../../payment-service";
import { z } from "zod";

// Invoice schema
const createInvoiceSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Valid email is required"),
  amountUsd: z.string().min(1, "Amount is required"),
  description: z.string().min(1, "Description is required"),
  dueDate: z.string().optional(),
});

export default function invoicingRoutes(app: Express) {
  // Get all invoices
  app.get('/api/invoices', requireAuth, async (req, res) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      res.status(500).json({ message: 'Failed to fetch invoices' });
    }
  });

  // Get single invoice
  app.get('/api/invoices/:id', requireAuth, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const invoice = await storage.getInvoice(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      res.json(invoice);
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
      res.status(500).json({ message: 'Failed to fetch invoice' });
    }
  });

  // Create new invoice with Bitcoin payment
  app.post('/api/invoices', requireAuth, async (req, res) => {
    try {
      const validatedData = createInvoiceSchema.parse(req.body);
      
      // Create the invoice in our database
      const invoice = await storage.createInvoice({
        clientName: validatedData.clientName,
        clientEmail: validatedData.clientEmail,
        amountUsd: validatedData.amountUsd,
        description: validatedData.description,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
        createdBy: req.user!.id,
      });

      // Create Bitcoin payment request
      const paymentRequest = await paymentService.createInvoice({
        amount: parseFloat(validatedData.amountUsd),
        currency: 'USD',
        description: validatedData.description,
        orderId: invoice.invoiceNumber,
        customerEmail: validatedData.clientEmail,
        customerName: validatedData.clientName,
        redirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invoice/${invoice.id}`,
        webhookUrl: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/invoices/${invoice.id}/webhook`,
      });

      // Update invoice with payment details
      const updatedInvoice = await storage.updateInvoice(invoice.id, {
        paymentUrl: paymentRequest.paymentUrl,
        btcAddress: paymentRequest.paymentUrl, // For backward compatibility
        amountBtc: paymentRequest.btcAmount?.toString(),
      });

      res.status(201).json({
        invoice: updatedInvoice,
        paymentUrl: paymentRequest.paymentUrl,
        qrCode: paymentRequest.qrCode,
        btcAmount: paymentRequest.btcAmount,
      });
    } catch (error) {
      console.error('Failed to create invoice:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create invoice' });
    }
  });

  // Update invoice
  app.put('/api/invoices/:id', requireAuth, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const updates = createInvoiceSchema.partial().parse(req.body);
      
      const invoice = await storage.updateInvoice(invoiceId, updates);
      
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      res.json(invoice);
    } catch (error) {
      console.error('Failed to update invoice:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update invoice' });
    }
  });

  // Delete invoice
  app.delete('/api/invoices/:id', requireAuth, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      await storage.deleteInvoice(invoiceId);
      res.status(204).send();
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      res.status(500).json({ message: 'Failed to delete invoice' });
    }
  });

  // Update invoice status
  app.put('/api/invoices/:id/status', requireAuth, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const { status } = req.body;
      
      const invoice = await storage.updateInvoiceStatus(invoiceId, status);
      
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      res.json(invoice);
    } catch (error) {
      console.error('Failed to update invoice status:', error);
      res.status(500).json({ message: 'Failed to update invoice status' });
    }
  });

  // Webhook for payment status updates
  app.post('/api/invoices/:id/webhook', async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const invoice = await storage.getInvoice(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      // Get updated payment status from BTCPay
      const paymentStatus = await paymentService.getInvoiceStatus(invoice.paymentUrl || '');
      
      // Update invoice status based on payment status
      let newStatus = invoice.status;
      if (paymentStatus.status === 'paid') {
        newStatus = 'paid';
      } else if (paymentStatus.status === 'expired') {
        newStatus = 'overdue';
      }

      if (newStatus !== invoice.status) {
        await storage.updateInvoiceStatus(invoiceId, newStatus);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ message: 'Webhook processing failed' });
    }
  });

  // Get payment status for an invoice
  app.get('/api/invoices/:id/payment-status', requireAuth, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const invoice = await storage.getInvoice(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      if (!invoice.paymentUrl) {
        return res.status(400).json({ message: 'No payment URL found for this invoice' });
      }

      const paymentStatus = await paymentService.getInvoiceStatus(invoice.paymentUrl);
      
      res.json({
        status: paymentStatus.status,
        btcAmount: paymentStatus.btcAmount,
        paymentUrl: paymentStatus.paymentUrl,
        qrCode: paymentStatus.qrCode,
        expiresAt: paymentStatus.expiresAt,
        transactions: paymentStatus.transactions,
      });
    } catch (error) {
      console.error('Failed to get payment status:', error);
      res.status(500).json({ message: 'Failed to get payment status' });
    }
  });
} 