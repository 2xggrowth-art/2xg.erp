import { Request, Response } from 'express';
import { TransferOrdersService } from '../services/transfer-orders.service';

export class TransferOrdersController {
  private transferOrdersService: TransferOrdersService;

  constructor() {
    this.transferOrdersService = new TransferOrdersService();
  }

  /**
   * Generate a new transfer order number
   */
  generateTransferOrderNumber = async (req: Request, res: Response) => {
    try {
      const orderNumber = await this.transferOrdersService.generateTransferOrderNumber();
      res.json({
        success: true,
        data: { transfer_order_number: orderNumber }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Create a new transfer order
   */
  createTransferOrder = async (req: Request, res: Response) => {
    try {
      const order = await this.transferOrdersService.createTransferOrder(req.body);
      res.status(201).json({
        success: true,
        data: order,
        message: 'Transfer order created successfully'
      });
    } catch (error: any) {
      console.error('Error creating transfer order:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create transfer order',
        error: error.message
      });
    }
  };

  /**
   * Get all transfer orders
   */
  getAllTransferOrders = async (req: Request, res: Response) => {
    try {
      const filters = {
        status: req.query.status as string,
        source_location: req.query.source_location as string,
        destination_location: req.query.destination_location as string,
        from_date: req.query.from_date as string,
        to_date: req.query.to_date as string,
        search: req.query.search as string,
      };

      const orders = await this.transferOrdersService.getAllTransferOrders(filters);
      res.json({
        success: true,
        data: orders
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Get a single transfer order by ID
   */
  getTransferOrderById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const order = await this.transferOrdersService.getTransferOrderById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Transfer order not found'
        });
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Update a transfer order
   */
  updateTransferOrder = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const order = await this.transferOrdersService.updateTransferOrder(id, req.body);

      res.json({
        success: true,
        data: order,
        message: 'Transfer order updated successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update transfer order',
        error: error.message
      });
    }
  };

  /**
   * Delete a transfer order
   */
  deleteTransferOrder = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const order = await this.transferOrdersService.deleteTransferOrder(id);

      res.json({
        success: true,
        data: order,
        message: 'Transfer order deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Get transfer orders summary
   */
  getTransferOrdersSummary = async (req: Request, res: Response) => {
    try {
      const summary = await this.transferOrdersService.getTransferOrdersSummary();
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

  /**
   * Update transfer order status
   */
  updateTransferOrderStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const order = await this.transferOrdersService.updateTransferOrderStatus(id, status);

      res.json({
        success: true,
        data: order,
        message: 'Transfer order status updated successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };
}
