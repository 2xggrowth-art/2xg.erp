import { Request, Response } from 'express';
import { SalesOrdersService } from '../services/sales-orders.service';

export class SalesOrdersController {
  private salesOrdersService: SalesOrdersService;

  constructor() {
    this.salesOrdersService = new SalesOrdersService();
  }

  /**
   * Generate a new sales order number
   */
  generateSalesOrderNumber = async (req: Request, res: Response) => {
    try {
      const salesOrderNumber = await this.salesOrdersService.generateSalesOrderNumber();
      res.json({
        success: true,
        data: { sales_order_number: salesOrderNumber }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Create a new sales order
   */
  createSalesOrder = async (req: Request, res: Response) => {
    try {
      console.log('Creating sales order with data:', JSON.stringify(req.body, null, 2));

      if (!req.body.customer_name || req.body.customer_name.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Customer name is required'
        });
      }

      if (!req.body.sales_order_date) {
        return res.status(400).json({
          success: false,
          error: 'Sales order date is required'
        });
      }

      if (!req.body.items || !Array.isArray(req.body.items) || req.body.items.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'At least one sales order item is required'
        });
      }

      const salesOrder = await this.salesOrdersService.createSalesOrder(req.body);
      res.status(201).json({
        success: true,
        data: salesOrder,
        message: 'Sales order created successfully'
      });
    } catch (error: any) {
      console.error('Error creating sales order:', error);
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
   * Get all sales orders
   */
  getAllSalesOrders = async (req: Request, res: Response) => {
    try {
      const filters = {
        status: req.query.status as string,
        customer_id: req.query.customer_id as string,
        from_date: req.query.from_date as string,
        to_date: req.query.to_date as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50
      };

      const result = await this.salesOrdersService.getAllSalesOrders(filters);
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
   * Get a single sales order by ID
   */
  getSalesOrderById = async (req: Request, res: Response) => {
    try {
      const salesOrder = await this.salesOrdersService.getSalesOrderById(req.params.id);
      res.json({
        success: true,
        data: salesOrder
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: 'Sales order not found'
      });
    }
  };

  /**
   * Update a sales order
   */
  updateSalesOrder = async (req: Request, res: Response) => {
    try {
      const salesOrder = await this.salesOrdersService.updateSalesOrder(req.params.id, req.body);
      res.json({
        success: true,
        data: salesOrder,
        message: 'Sales order updated successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Delete a sales order
   */
  deleteSalesOrder = async (req: Request, res: Response) => {
    try {
      await this.salesOrdersService.deleteSalesOrder(req.params.id);
      res.json({
        success: true,
        message: 'Sales order deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };
}
