import { Request, Response } from 'express';
import { PaymentsService } from '../services/payments.service';

export class PaymentsController {
  private paymentsService: PaymentsService;

  constructor() {
    this.paymentsService = new PaymentsService();
  }

  /**
   * Generate a new payment number
   */
  generatePaymentNumber = async (req: Request, res: Response) => {
    try {
      const paymentNumber = await this.paymentsService.generatePaymentNumber();
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
   * Create a new payment
   */
  createPayment = async (req: Request, res: Response) => {
    try {
      const payment = await this.paymentsService.createPayment(req.body);
      res.status(201).json({
        success: true,
        data: payment,
        message: 'Payment created successfully'
      });
    } catch (error: any) {
      console.error('Error creating payment:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Get all payments
   */
  getAllPayments = async (req: Request, res: Response) => {
    try {
      const filters = {
        status: req.query.status as string,
        vendor_id: req.query.vendor_id as string,
        from_date: req.query.from_date as string,
        to_date: req.query.to_date as string,
        search: req.query.search as string,
      };

      const payments = await this.paymentsService.getAllPayments(filters);
      res.json({
        success: true,
        data: payments
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
  getPaymentById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const payment = await this.paymentsService.getPaymentById(id);

      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
      }

      res.json({
        success: true,
        data: payment
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Update a payment
   */
  updatePayment = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const payment = await this.paymentsService.updatePayment(id, req.body);

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
  deletePayment = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const payment = await this.paymentsService.deletePayment(id);

      res.json({
        success: true,
        data: payment,
        message: 'Payment deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Get payments summary
   */
  getPaymentsSummary = async (req: Request, res: Response) => {
    try {
      const summary = await this.paymentsService.getPaymentsSummary();
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
