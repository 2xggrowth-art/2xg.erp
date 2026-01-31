import { Request, Response } from 'express';
import { ItemsService } from '../services/items.service';

const itemsService = new ItemsService();

export const generateSku = async (req: Request, res: Response) => {
  try {
    const sku = await itemsService.generateSku();
    res.json({ success: true, data: { sku } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllItems = async (req: Request, res: Response) => {
  try {
    const { category, isActive, lowStock } = req.query;

    const filters = {
      category: category as string | undefined,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      lowStock: lowStock === 'true'
    };

    const items = await itemsService.getAllItems(filters);
    res.json({ success: true, data: items });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getItemsSummary = async (req: Request, res: Response) => {
  try {
    const summary = await itemsService.getItemsSummary();
    res.json({ success: true, data: summary });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getTopSellingItems = async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const items = await itemsService.getTopSellingItems(limit ? parseInt(limit as string) : 10);
    res.json({ success: true, data: items });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getItemById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = await itemsService.getItemById(id);
    res.json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createItem = async (req: Request, res: Response) => {
  try {
    console.log('Creating item with data:', req.body);
    const item = await itemsService.createItem(req.body);
    console.log('Item created successfully:', item);
    res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    console.error('Error creating item:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log('=== UPDATE ITEM REQUEST ===');
    console.log('Item ID:', id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Name field:', req.body.name);
    const item = await itemsService.updateItem(id, req.body);
    console.log('Updated item returned:', JSON.stringify(item, null, 2));
    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error('Error updating item:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = await itemsService.deleteItem(id);
    res.json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const importItems = async (req: Request, res: Response) => {
  try {
    const { items, mode } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: 'Items array is required'
      });
    }

    let results;
    if (mode === 'update') {
      results = await itemsService.bulkUpdateItems(items);
    } else if (mode === 'upsert') {
      const updateResults = await itemsService.bulkUpdateItems(items);
      const itemsToCreate = items.filter(item =>
        updateResults.notFound.includes(item.sku)
      );
      const createResults = await itemsService.bulkCreateItems(itemsToCreate, true);

      results = {
        successful: [...updateResults.successful, ...createResults.successful],
        failed: [...updateResults.failed, ...createResults.failed],
        duplicates: createResults.duplicates
      };
    } else {
      results = await itemsService.bulkCreateItems(items, true);
    }

    res.status(200).json({
      success: true,
      data: results,
      message: `Import completed: ${results.successful.length} successful, ${results.failed.length} failed`
    });
  } catch (error: any) {
    console.error('Error importing items:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const validateImportData = async (req: Request, res: Response) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: 'Items array is required'
      });
    }

    const { supabaseAdmin } = await import('../config/supabase');
    const errors: any[] = [];
    const warnings: any[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const row = i + 2;

      // Required fields
      if (!item.name || item.name.trim() === '') {
        errors.push({ row, field: 'name', message: 'Item name is required' });
      }
      if (!item.sku || item.sku.trim() === '') {
        errors.push({ row, field: 'sku', message: 'SKU is required' });
      }

      // Check duplicates
      if (item.sku) {
        const { data: existing } = await supabaseAdmin
          .from('items')
          .select('sku, item_name')
          .eq('sku', item.sku)
          .single();

        if (existing) {
          warnings.push({ row, field: 'sku', message: `SKU already exists (${existing.item_name})` });
        }
      }

      // Data type validation
      if (item.unit_price && isNaN(parseFloat(item.unit_price))) {
        errors.push({ row, field: 'unit_price', message: 'Must be a number' });
      }
      if (item.cost_price && isNaN(parseFloat(item.cost_price))) {
        errors.push({ row, field: 'cost_price', message: 'Must be a number' });
      }
    }

    res.json({
      success: true,
      data: { valid: errors.length === 0, errors, warnings, totalRows: items.length }
    });
  } catch (error: any) {
    console.error('Error validating import data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const exportItems = async (req: Request, res: Response) => {
  try {
    const { includeInactive, itemIds } = req.query;

    const filters = {
      includeInactive: includeInactive === 'true',
      itemIds: itemIds ? (itemIds as string).split(',') : undefined
    };

    const items = await itemsService.exportItems(filters);
    res.json({ success: true, data: items, count: items.length });
  } catch (error: any) {
    console.error('Error exporting items:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const importFromGoogleSheets = async (req: Request, res: Response) => {
  try {
    const { sheetUrl, mode } = req.body;

    if (!sheetUrl) {
      return res.status(400).json({
        success: false,
        error: 'Google Sheets URL is required'
      });
    }

    const { GoogleSheetsService } = await import('../services/googleSheets.service');
    const googleSheetsService = new GoogleSheetsService();

    // Fetch data from Google Sheets
    const sheetData = await googleSheetsService.fetchPublicSheet(sheetUrl);
    const items = googleSheetsService.arrayToJSON(sheetData);

    // Use existing import logic
    let results;
    if (mode === 'update') {
      results = await itemsService.bulkUpdateItems(items);
    } else if (mode === 'upsert') {
      const updateResults = await itemsService.bulkUpdateItems(items);
      const itemsToCreate = items.filter(item =>
        updateResults.notFound.includes(item.sku)
      );
      const createResults = await itemsService.bulkCreateItems(itemsToCreate, true);

      results = {
        successful: [...updateResults.successful, ...createResults.successful],
        failed: [...updateResults.failed, ...createResults.failed],
        duplicates: createResults.duplicates
      };
    } else {
      results = await itemsService.bulkCreateItems(items, true);
    }

    res.status(200).json({
      success: true,
      data: results,
      message: `Import from Google Sheets completed: ${results.successful.length} successful, ${results.failed.length} failed`
    });
  } catch (error: any) {
    console.error('Error importing from Google Sheets:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
