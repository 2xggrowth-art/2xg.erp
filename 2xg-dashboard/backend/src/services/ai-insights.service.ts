import { supabaseAdmin } from '../config/supabase';

export class AIInsightsService {
  /**
   * Get all AI insights
   */
  async getAllInsights(filters?: {
    module?: string;
    severity?: string;
    status?: string;
  }) {
    let query = supabaseAdmin
      .from('ai_insights')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.module) {
      query = query.eq('module', filters.module);
    }
    if (filters?.severity) {
      query = query.eq('severity', filters.severity);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  /**
   * Get insights summary
   */
  async getInsightsSummary() {
    const { data, error } = await supabaseAdmin
      .from('ai_insights')
      .select('severity, status, is_actionable');

    if (error) throw error;

    const totalInsights = data.length;
    const activeInsights = data.filter(i => i.status === 'active').length;
    const criticalInsights = data.filter(i => i.severity === 'critical' && i.status === 'active').length;
    const actionableInsights = data.filter(i => i.is_actionable && i.status === 'active').length;
    const opportunities = data.filter(i => i.severity === 'opportunity' && i.status === 'active').length;

    return {
      totalInsights,
      activeInsights,
      criticalInsights,
      actionableInsights,
      opportunities
    };
  }

  /**
   * Get AI predictions
   */
  async getPredictions(module?: string, limit = 10) {
    let query = supabaseAdmin
      .from('ai_predictions')
      .select('*')
      .order('prediction_date', { ascending: true })
      .limit(limit);

    if (module) {
      query = query.eq('module', module);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  /**
   * Get predictions by module
   */
  async getPredictionsByModule() {
    const { data, error } = await supabaseAdmin
      .from('ai_predictions')
      .select('module, predicted_value, metric_name');

    if (error) throw error;

    type PredictionType = { metric: any; value: any };
    const moduleMap = new Map<string, { module: string; predictions: PredictionType[] }>();

    data.forEach((prediction: any) => {
      const existing = moduleMap.get(prediction.module) || { module: prediction.module, predictions: [] as PredictionType[] };
      existing.predictions.push({
        metric: prediction.metric_name,
        value: prediction.predicted_value
      });
      moduleMap.set(prediction.module, existing);
    });

    return Array.from(moduleMap.values());
  }

  /**
   * Get business health score (simulated AI score)
   */
  async getBusinessHealthScore() {
    // This would typically call an AI model, but for now we'll return mock data
    return {
      overallScore: 78,
      categories: [
        { name: 'Sales Performance', score: 85, trend: 'up' },
        { name: 'Inventory Health', score: 72, trend: 'stable' },
        { name: 'Cash Flow', score: 68, trend: 'down' },
        { name: 'Customer Satisfaction', score: 88, trend: 'up' },
        { name: 'Operational Efficiency', score: 75, trend: 'up' }
      ],
      recommendations: [
        'Focus on improving cash flow management',
        'Consider reordering low-stock items',
        'Excellent sales trend - maintain momentum'
      ]
    };
  }
}
