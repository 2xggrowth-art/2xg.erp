import { Request, Response } from 'express';
import { DeliveryChallansService } from '../services/delivery-challans.service';

export class DeliveryChallansController {
  private deliveryChallansService: DeliveryChallansService;

  constructor() {
    this.deliveryChallansService = new DeliveryChallansService();
  }

  /**
   * Generate a new delivery challan number
   */
  generateChallanNumber = async (req: Request, res: Response) => {
    try {
      const challanNumber = await this.deliveryChallansService.generateChallanNumber();
      res.json({
        success: true,
        data: { challan_number: challanNumber }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Create a new delivery challan
   */
  createDeliveryChallan = async (req: Request, res: Response) => {
    try {
      console.log('Creating delivery challan with data:', JSON.stringify(req.body, null, 2));

      if (!req.body.customer_name || req.body.customer_name.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Customer name is required'
        });
      }

      if (!req.body.challan_date) {
        return res.status(400).json({
          success: false,
          error: 'Challan date is required'
        });
      }

      // Items are optional for BCH-AFS delivery challans
      const deliveryChallan = await this.deliveryChallansService.createDeliveryChallan(req.body);
      res.status(201).json({
        success: true,
        data: deliveryChallan,
        message: 'Delivery challan created successfully'
      });
    } catch (error: any) {
      console.error('Error creating delivery challan:', error);
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
   * Get all delivery challans
   */
  getAllDeliveryChallans = async (req: Request, res: Response) => {
    try {
      const filters = {
        status: req.query.status as string,
        customer_id: req.query.customer_id as string,
        from_date: req.query.from_date as string,
        to_date: req.query.to_date as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50
      };

      const result = await this.deliveryChallansService.getAllDeliveryChallans(filters);
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
   * Get a single delivery challan by ID
   */
  getDeliveryChallanById = async (req: Request, res: Response) => {
    try {
      const deliveryChallan = await this.deliveryChallansService.getDeliveryChallanById(req.params.id);
      res.json({
        success: true,
        data: deliveryChallan
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: 'Delivery challan not found'
      });
    }
  };

  /**
   * Update a delivery challan
   */
  updateDeliveryChallan = async (req: Request, res: Response) => {
    try {
      const deliveryChallan = await this.deliveryChallansService.updateDeliveryChallan(req.params.id, req.body);
      res.json({
        success: true,
        data: deliveryChallan,
        message: 'Delivery challan updated successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Delete a delivery challan
   */
  deleteDeliveryChallan = async (req: Request, res: Response) => {
    try {
      await this.deliveryChallansService.deleteDeliveryChallan(req.params.id);
      res.json({
        success: true,
        message: 'Delivery challan deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };
}
