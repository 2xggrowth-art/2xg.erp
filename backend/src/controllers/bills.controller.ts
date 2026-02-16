import { Request, Response } from 'express';
import { BillsService } from '../services/bills.service';

export class BillsController {
  private billsService: BillsService;

  constructor() {
    this.billsService = new BillsService();
  }

  /**
   * Generate a new bill number
   */
  generateBillNumber = async (req: Request, res: Response) => {
    try {
      const billNumber = await this.billsService.generateBillNumber();
      res.json({
        success: true,
        data: { bill_number: billNumber }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Upload files for a bill
   */
  uploadFiles = async (req: Request, res: Response) => {
    try {
      const processedFiles = (req as any).processedFiles || [];
      if (processedFiles.length === 0) {
        return res.status(400).json({ success: false, error: 'No files uploaded' });
      }
      res.json({
        success: true,
        data: processedFiles.map((f: any) => ({
          url: f.url,
          filename: f.originalname,
        })),
      });
    } catch (error: any) {
      console.error('Error uploading bill files:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  };

  /**
   * Create a new bill
   */
  createBill = async (req: Request, res: Response) => {
    try {
      const bill = await this.billsService.createBill(req.body);
      res.status(201).json({
        success: true,
        data: bill,
        message: 'Bill created successfully'
      });
    } catch (error: any) {
      console.error('Error creating bill:', error);
      if (error.code === '23505' || (error.message && error.message.includes('duplicate key'))) {
        return res.status(409).json({
          success: false,
          error: 'Bill number already exists. Please use a different bill number.'
        });
      }
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Get all bills
   */
  getAllBills = async (req: Request, res: Response) => {
    try {
      const filters = {
        status: req.query.status as string,
        vendor_id: req.query.vendor_id as string,
        from_date: req.query.from_date as string,
        to_date: req.query.to_date as string,
        search: req.query.search as string,
      };

      const bills = await this.billsService.getAllBills(filters);
      res.json({
        success: true,
        data: bills
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Get a single bill by ID
   */
  getBillById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const bill = await this.billsService.getBillById(id);

      if (!bill) {
        return res.status(404).json({
          success: false,
          error: 'Bill not found'
        });
      }

      res.json({
        success: true,
        data: bill
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Update a bill
   */
  updateBill = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const bill = await this.billsService.updateBill(id, req.body);

      res.json({
        success: true,
        data: bill,
        message: 'Bill updated successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Delete a bill
   */
  deleteBill = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const bill = await this.billsService.deleteBill(id);

      res.json({
        success: true,
        data: bill,
        message: 'Bill deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Get bills summary
   */
  getBillsSummary = async (req: Request, res: Response) => {
    try {
      const summary = await this.billsService.getBillsSummary();
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

  getLastSerialNumber = async (req: Request, res: Response) => {
    try {
      const { itemId } = req.params;
      const lastSerial = await this.billsService.getLastSerialNumber(itemId);
      res.json({
        success: true,
        data: { last_serial: lastSerial }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };
}
