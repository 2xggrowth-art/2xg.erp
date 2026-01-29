import { Request, Response } from 'express';
import { PurchaseOrdersService } from '../services/purchase-orders.service';

const poService = new PurchaseOrdersService();

export const getAllPurchaseOrders = async (req: Request, res: Response) => {
  try {
    const { status, vendorId, dateFrom, dateTo } = req.query;

    const filters = {
      status: status as string | undefined,
      vendorId: vendorId as string | undefined,
      dateFrom: dateFrom as string | undefined,
      dateTo: dateTo as string | undefined
    };

    const pos = await poService.getAllPurchaseOrders(filters);
    res.json({ success: true, data: pos });
  } catch (error: any) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPurchaseOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const po = await poService.getPurchaseOrderById(id);
    res.json({ success: true, data: po });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const generatePONumber = async (req: Request, res: Response) => {
  try {
    const poNumber = await poService.generatePONumber();
    res.json({ success: true, data: { po_number: poNumber } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createPurchaseOrder = async (req: Request, res: Response) => {
  try {
    console.log('Creating PO with data:', JSON.stringify(req.body, null, 2));
    const po = await poService.createPurchaseOrder(req.body);
    console.log('PO created successfully:', po.id);
    res.status(201).json({ success: true, data: po });
  } catch (error: any) {
    console.error('Error creating PO:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, error: error.message || 'Failed to create purchase order' });
  }
};

export const updatePurchaseOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const po = await poService.updatePurchaseOrder(id, req.body);
    res.json({ success: true, data: po });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deletePurchaseOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const po = await poService.deletePurchaseOrder(id);
    res.json({ success: true, data: po });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPurchaseOrdersSummary = async (req: Request, res: Response) => {
  try {
    const summary = await poService.getPurchaseOrdersSummary();
    res.json({ success: true, data: summary });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
