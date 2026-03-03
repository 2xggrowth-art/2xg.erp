import { Request, Response } from 'express';
import { CreditNotesService } from '../services/credit-notes.service';

const creditNotesService = new CreditNotesService();

export class CreditNotesController {
  /**
   * Generate a new credit note number
   */
  generateCreditNoteNumber = async (req: Request, res: Response) => {
    try {
      const creditNoteNumber = await creditNotesService.generateCreditNoteNumber();
      res.json({
        success: true,
        data: { credit_note_number: creditNoteNumber },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate credit note number',
      });
    }
  };

  /**
   * Create a new credit note
   */
  createCreditNote = async (req: Request, res: Response) => {
    try {
      const { items } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'At least one item is required for a credit note',
        });
      }

      // Validate each item has required fields
      for (const item of items) {
        if (!item.item_name) {
          return res.status(400).json({
            success: false,
            error: 'Each item must have an item_name',
          });
        }
        if (!item.quantity || Number(item.quantity) <= 0) {
          return res.status(400).json({
            success: false,
            error: `Item "${item.item_name}" must have a positive quantity`,
          });
        }
        if (item.rate === undefined || Number(item.rate) < 0) {
          return res.status(400).json({
            success: false,
            error: `Item "${item.item_name}" must have a valid rate`,
          });
        }
      }

      const creditNote = await creditNotesService.createCreditNote(
        req.body,
        (req as any).user?.organizationId
      );

      res.status(201).json({
        success: true,
        data: creditNote,
        message: 'Credit note created successfully',
      });
    } catch (error: any) {
      console.error('Error creating credit note:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create credit note',
      });
    }
  };

  /**
   * Get all credit notes
   */
  getAllCreditNotes = async (req: Request, res: Response) => {
    try {
      const { status, customer_id, from_date, to_date, search } = req.query;

      const creditNotes = await creditNotesService.getAllCreditNotes({
        status: status as string,
        customer_id: customer_id as string,
        from_date: from_date as string,
        to_date: to_date as string,
        search: search as string,
      });

      res.json({
        success: true,
        data: creditNotes,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch credit notes',
      });
    }
  };

  /**
   * Get credit note by ID
   */
  getCreditNoteById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const creditNote = await creditNotesService.getCreditNoteById(id);

      if (!creditNote) {
        return res.status(404).json({
          success: false,
          error: 'Credit note not found',
        });
      }

      res.json({
        success: true,
        data: creditNote,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch credit note',
      });
    }
  };

  /**
   * Update credit note status
   */
  updateCreditNoteStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: 'Status is required',
        });
      }

      const creditNote = await creditNotesService.updateCreditNoteStatus(id, status);

      res.json({
        success: true,
        data: creditNote,
        message: `Credit note status updated to "${status}"`,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update credit note status',
      });
    }
  };
}
