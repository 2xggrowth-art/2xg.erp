import { Request, Response } from 'express';
import { VendorCreditsService } from '../services/vendor-credits.service';

export class VendorCreditsController {
  private vendorCreditsService: VendorCreditsService;

  constructor() {
    this.vendorCreditsService = new VendorCreditsService();
  }

  /**
   * Generate a new credit number
   */
  generateCreditNumber = async (req: Request, res: Response) => {
    try {
      const creditNumber = await this.vendorCreditsService.generateCreditNumber();
      res.json({
        success: true,
        data: { credit_number: creditNumber }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Create a new vendor credit
   */
  createVendorCredit = async (req: Request, res: Response) => {
    try {
      const credit = await this.vendorCreditsService.createVendorCredit(req.body);
      res.status(201).json({
        success: true,
        data: credit,
        message: 'Vendor credit created successfully'
      });
    } catch (error: any) {
      console.error('Error creating vendor credit:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Get all vendor credits
   */
  getAllVendorCredits = async (req: Request, res: Response) => {
    try {
      const filters = {
        status: req.query.status as string,
        vendor_id: req.query.vendor_id as string,
        from_date: req.query.from_date as string,
        to_date: req.query.to_date as string,
        search: req.query.search as string,
      };

      const credits = await this.vendorCreditsService.getAllVendorCredits(filters);
      res.json({
        success: true,
        data: credits
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Get a single vendor credit by ID
   */
  getVendorCreditById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const credit = await this.vendorCreditsService.getVendorCreditById(id);

      if (!credit) {
        return res.status(404).json({
          success: false,
          error: 'Vendor credit not found'
        });
      }

      res.json({
        success: true,
        data: credit
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Update a vendor credit
   */
  updateVendorCredit = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const credit = await this.vendorCreditsService.updateVendorCredit(id, req.body);

      res.json({
        success: true,
        data: credit,
        message: 'Vendor credit updated successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Delete a vendor credit
   */
  deleteVendorCredit = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const credit = await this.vendorCreditsService.deleteVendorCredit(id);

      res.json({
        success: true,
        data: credit,
        message: 'Vendor credit deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Get vendor credits summary
   */
  getVendorCreditsSummary = async (req: Request, res: Response) => {
    try {
      const summary = await this.vendorCreditsService.getVendorCreditsSummary();
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
   * Apply credit to a bill
   */
  applyCreditToBill = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { bill_id, amount } = req.body;

      const result = await this.vendorCreditsService.applyCreditToBill(id, bill_id, amount);

      res.json({
        success: true,
        data: result,
        message: 'Credit applied to bill successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };
}