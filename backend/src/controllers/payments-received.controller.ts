import { Request, Response } from 'express';
import { PaymentsReceivedService } from '../services/payments-received.service';

export class PaymentsReceivedController {
  private paymentsReceivedService: PaymentsReceivedService;

  constructor() {
    this.paymentsReceivedService = new PaymentsReceivedService();
  }

  /**
   * Generate a new payment number
   */
  generatePaymentNumber = async (req: Request, res: Response) => {
    try {
      const paymentNumber = await this.paymentsReceivedService.generatePaymentNumber();
      res.json({
        success: true,
        data: { payment_number: paymentNumber }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Create a new payment received
   */
  createPaymentReceived = async (req: Request, res: Response) => {
    try {
      console.log('Creating payment with data:', JSON.stringify(req.body, null, 2));

      if (!req.body.customer_name || req.body.customer_name.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Customer name is required'
        });
      }

      if (!req.body.payment_date) {
        return res.status(400).json({
          success: false,
          error: 'Payment date is required'
        });
      }

      if (!req.body.amount_received || req.body.amount_received <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Amount received must be greater than zero'
        });
      }

      const payment = await this.paymentsReceivedService.createPaymentReceived(req.body);
      res.status(201).json({
        success: true,
        data: payment,
        message: 'Payment received recorded successfully'
      });
    } catch (error: any) {
      console.error('Error creating payment:', error);
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
   * Get all payments received
   */
  getAllPaymentsReceived = async (req: Request, res: Response) => {
    try {
      const filters = {
        customer_id: req.query.customer_id as string,
        payment_mode: req.query.payment_mode as string,
        from_date: req.query.from_date as string,
        to_date: req.query.to_date as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50
      };

      const result = await this.paymentsReceivedService.getAllPaymentsReceived(filters);
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
   * Get a single payment by ID
   */
  getPaymentReceivedById = async (req: Request, res: Response) => {
    try {
      const payment = await this.paymentsReceivedService.getPaymentReceivedById(req.params.id);
      res.json({
        success: true,
        data: payment
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }
  };

  /**
   * Update a payment
   */
  updatePaymentReceived = async (req: Request, res: Response) => {
    try {
      const payment = await this.paymentsReceivedService.updatePaymentReceived(req.params.id, req.body);
      res.json({
        success: true,
        data: payment,
        message: 'Payment updated successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Delete a payment
   */
  deletePaymentReceived = async (req: Request, res: Response) => {
    try {
      await this.paymentsReceivedService.deletePaymentReceived(req.params.id);
      res.json({
        success: true,
        message: 'Payment deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };
}
