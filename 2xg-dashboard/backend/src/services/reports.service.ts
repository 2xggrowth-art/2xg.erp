import { supabaseAdmin } from '../config/supabase';

export class ReportsService {
  /**
   * Get all report templates
   */
  async getAllTemplates() {
    const { data, error } = await supabaseAdmin
      .from('report_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data;
  }

  /**
   * Get generated reports
   */
  async getGeneratedReports(limit = 50) {
    const { data, error } = await supabaseAdmin
      .from('generated_reports')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  /**
   * Get reports summary
   */
  async getReportsSummary() {
    const { data: templates, error: templatesError } = await supabaseAdmin
      .from('report_templates')
      .select('*');

    const { data: generated, error: generatedError } = await supabaseAdmin
      .from('generated_reports')
      .select('*');

    if (templatesError) throw templatesError;
    if (generatedError) throw generatedError;

    const activeTemplates = templates.filter(t => t.is_active).length;
    const totalGenerated = generated.length;
    const recentReports = generated.filter(r => {
      const generatedDate = new Date(r.generated_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return generatedDate >= weekAgo;
    }).length;

    return {
      totalTemplates: templates.length,
      activeTemplates,
      totalGenerated,
      recentReports
    };
  }

  /**
   * Get reports by type
   */
  async getReportsByType() {
    const { data, error } = await supabaseAdmin
      .from('generated_reports')
      .select('report_type');

    if (error) throw error;

    const typeMap = new Map<string, number>();

    data.forEach((report: any) => {
      const count = typeMap.get(report.report_type) || 0;
      typeMap.set(report.report_type, count + 1);
    });

    return Array.from(typeMap.entries()).map(([type, count]) => ({
      type,
      count
    }));
  }
}
