import { Request, Response } from 'express';
import { InvoicesService } from '../services/invoices.service';

export class InvoicesController {
  private invoicesService: InvoicesService;

  constructor() {
    this.invoicesService = new InvoicesService();
  }

  /**
   * Generate a new invoice number
   */
  generateInvoiceNumber = async (req: Request, res: Response) => {
    try {
      const invoiceNumber = await this.invoicesService.generateInvoiceNumber();
      res.json({
        success: true,
        data: { invoice_number: invoiceNumber }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Create a new invoice
   */
  createInvoice = async (req: Request, res: Response) => {
    try {
      console.log('Creating invoice with data:', JSON.stringify(req.body, null, 2));

      // Validate required fields
      if (!req.body.customer_name || req.body.customer_name.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Customer name is required'
        });
      }

      if (!req.body.invoice_date) {
        return res.status(400).json({
          success: false,
          error: 'Invoice date is required'
        });
      }

      if (!req.body.items || !Array.isArray(req.body.items) || req.body.items.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'At least one invoice item is required'
        });
      }

      const invoice = await this.invoicesService.createInvoice(req.body);
      res.status(201).json({
        success: true,
        data: invoice,
        message: 'Invoice created successfully'
      });
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });

      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        details: error.details || error.hint || undefined
      });
    }
  };

  /**
   * Get all invoices
   */
  getAllInvoices = async (req: Request, res: Response) => {
    try {
      const filters = {
        status: req.query.status as string,
        customer_id: req.query.customer_id as string,
        from_date: req.query.from_date as string,
        to_date: req.query.to_date as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50
      };

      const result = await this.invoicesService.getAllInvoices(filters);
      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Get a single invoice by ID
   */
  getInvoiceById = async (req: Request, res: Response) => {
    try {
      const invoice = await this.invoicesService.getInvoiceById(req.params.id);
      res.json({
        success: true,
        data: invoice
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }
  };

  /**
   * Update an invoice
   */
  updateInvoice = async (req: Request, res: Response) => {
    try {
      const invoice = await this.invoicesService.updateInvoice(req.params.id, req.body);
      res.json({
        success: true,
        data: invoice,
        message: 'Invoice updated successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Delete an invoice
   */
  deleteInvoice = async (req: Request, res: Response) => {
    try {
      await this.invoicesService.deleteInvoice(req.params.id);
      res.json({
        success: true,
        message: 'Invoice deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Get invoice summary
   */
  getInvoiceSummary = async (req: Request, res: Response) => {
    try {
      const summary = await this.invoicesService.getInvoiceSummary();
      res.json({
        success: true,
        data: summary
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };
}
