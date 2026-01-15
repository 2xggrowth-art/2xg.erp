import { Request, Response } from 'express';
import { CustomersService } from '../services/customers.service';

export class CustomersController {
  private customersService: CustomersService;

  constructor() {
    this.customersService = new CustomersService();
  }

  /**
   * Get all customers
   */
  getAllCustomers = async (req: Request, res: Response) => {
    try {
      const filters = {
        isActive: req.query.isActive === 'true',
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50
      };

      const result = await this.customersService.getAllCustomers(filters);
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
   * Get a single customer by ID
   */
  getCustomerById = async (req: Request, res: Response) => {
    try {
      const customer = await this.customersService.getCustomerById(req.params.id);
      res.json({
        success: true,
        data: customer
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }
  };

  /**
   * Create a new customer
   */
  createCustomer = async (req: Request, res: Response) => {
    try {
      const customer = await this.customersService.createCustomer(req.body);
      res.status(201).json({
        success: true,
        data: customer,
        message: 'Customer created successfully'
      });
    } catch (error: any) {
      console.error('Error creating customer:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Update a customer
   */
  updateCustomer = async (req: Request, res: Response) => {
    try {
      const customer = await this.customersService.updateCustomer(req.params.id, req.body);
      res.json({
        success: true,
        data: customer,
        message: 'Customer updated successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Delete a customer
   */
  deleteCustomer = async (req: Request, res: Response) => {
    try {
      await this.customersService.deleteCustomer(req.params.id);
      res.json({
        success: true,
        message: 'Customer deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };
}
