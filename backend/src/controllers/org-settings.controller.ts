import { Request, Response } from 'express';
import { OrgSettingsService } from '../services/org-settings.service';
import { supabaseAdmin as supabase } from '../config/supabase';

const orgSettingsService = new OrgSettingsService();

export class OrgSettingsController {
  async getOrgSettings(req: Request, res: Response) {
    try {
      const orgId = (req as any).user?.organizationId;

      let resolvedOrgId = orgId;
      if (!resolvedOrgId) {
        const { data: org } = await supabase
          .from('organizations')
          .select('id')
          .limit(1)
          .single();
        resolvedOrgId = org?.id;
      }

      if (!resolvedOrgId) {
        return res.status(404).json({
          success: false,
          error: 'No organization found',
        });
      }

      const settings = await orgSettingsService.getOrgSettings(resolvedOrgId);
      res.json({
        success: true,
        data: settings,
      });
    } catch (error: any) {
      console.error('Error fetching org settings:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch organization settings',
      });
    }
  }

  async updateOrgSettings(req: Request, res: Response) {
    try {
      const orgId = (req as any).user?.organizationId;

      let resolvedOrgId = orgId;
      if (!resolvedOrgId) {
        const { data: org } = await supabase
          .from('organizations')
          .select('id')
          .limit(1)
          .single();
        resolvedOrgId = org?.id;
      }

      if (!resolvedOrgId) {
        return res.status(404).json({
          success: false,
          error: 'No organization found',
        });
      }

      const settings = await orgSettingsService.updateOrgSettings(resolvedOrgId, req.body);
      res.json({
        success: true,
        data: settings,
        message: 'Organization settings updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating org settings:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update organization settings',
      });
    }
  }

  async getCompanyInfo(req: Request, res: Response) {
    try {
      const orgId = (req as any).user?.organizationId;

      let resolvedOrgId = orgId;
      if (!resolvedOrgId) {
        const { data: org } = await supabase
          .from('organizations')
          .select('id')
          .limit(1)
          .single();
        resolvedOrgId = org?.id;
      }

      if (!resolvedOrgId) {
        return res.status(404).json({
          success: false,
          error: 'No organization found',
        });
      }

      const companyInfo = await orgSettingsService.getCompanyInfo(resolvedOrgId);
      res.json({
        success: true,
        data: companyInfo,
      });
    } catch (error: any) {
      console.error('Error fetching company info:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch company info',
      });
    }
  }
}
