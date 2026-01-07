import { Request, Response } from 'express';
import { SearchService } from '../services/search.service';

const searchService = new SearchService();

export const globalSearch = async (req: Request, res: Response) => {
  try {
    const { q, modules } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, error: 'Search query is required' });
    }

    const moduleList = modules ? (modules as string).split(',') : undefined;
    const results = await searchService.globalSearch(q as string, moduleList);
    res.json({ success: true, data: results });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getSearchHistory = async (req: Request, res: Response) => {
  try {
    const { userEmail, limit } = req.query;

    if (!userEmail) {
      return res.status(400).json({ success: false, error: 'User email is required' });
    }

    const history = await searchService.getSearchHistory(
      userEmail as string,
      limit ? parseInt(limit as string) : 20
    );
    res.json({ success: true, data: history });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getSavedSearches = async (req: Request, res: Response) => {
  try {
    const { userEmail } = req.query;

    if (!userEmail) {
      return res.status(400).json({ success: false, error: 'User email is required' });
    }

    const searches = await searchService.getSavedSearches(userEmail as string);
    res.json({ success: true, data: searches });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
