import { Request, Response } from 'express';
import { CustomersService } from '../services/customers.service';

const customersService = new CustomersService();

export const getAllCustomers = async (req: Request, res: Response) => {
  try {
    const { isActive, search } = req.query;

    const filters = {
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search: search as string | undefined
    };

    const customers = await customersService.getAllCustomers(filters);
    res.json({ success: true, data: customers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCustomersSummary = async (req: Request, res: Response) => {
  try {
    const summary = await customersService.getCustomersSummary();
    res.json({ success: true, data: summary });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customer = await customersService.getCustomerById(id);
    res.json({ success: true, data: customer });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    console.log('Creating customer with data:', req.body);
    const customer = await customersService.createCustomer(req.body);
    console.log('Customer created successfully:', customer);
    res.status(201).json({ success: true, data: customer });
  } catch (error: any) {
    console.error('Error creating customer:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customer = await customersService.updateCustomer(id, req.body);
    res.json({ success: true, data: customer });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customer = await customersService.deleteCustomer(id);
    res.json({ success: true, data: customer });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
