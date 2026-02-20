import { supabaseAdmin as supabase } from '../config/supabase';

export const adminService = {
  // Get counter workload and performance metrics
  async getCounterWorkload() {
    // Get all mobile users (counters)
    const { data: users, error: userError } = await supabase
      .from('mobile_users')
      .select('id, employee_name, phone_number, role')
      .eq('is_active', true);

    if (userError) {
      console.error('Error fetching mobile users:', userError);
      throw userError;
    }

    if (!users || users.length === 0) return [];

    // Get active stock counts per user
    const { data: activeCounts, error: countError } = await supabase
      .from('stock_counts')
      .select('id, assigned_to, bin_code, status, total_items, counted_items')
      .in('status', ['pending', 'in_progress']);

    if (countError) {
      console.error('Error fetching active counts:', countError);
    }

    // Get completed counts for accuracy calculation
    const { data: completedCounts, error: completedError } = await supabase
      .from('stock_counts')
      .select('id, assigned_to, accuracy')
      .in('status', ['approved', 'submitted']);

    if (completedError) {
      console.error('Error fetching completed counts:', completedError);
    }

    const counters = users.map((user: any) => {
      const userActiveCounts = (activeCounts || []).filter((c: any) => c.assigned_to === user.id);
      const userCompletedCounts = (completedCounts || []).filter((c: any) => c.assigned_to === user.id);

      // Calculate average accuracy from completed counts
      const accuracies = userCompletedCounts
        .map((c: any) => c.accuracy)
        .filter((a: any) => a != null && !isNaN(a));
      const avgAccuracy = accuracies.length > 0
        ? Math.round(accuracies.reduce((sum: number, a: number) => sum + a, 0) / accuracies.length)
        : 0;

      // Determine status
      let status: 'available' | 'overloaded' | 'absent' = 'available';
      if (userActiveCounts.length >= 5) status = 'overloaded';

      // Current progress from active counts
      const totalItems = userActiveCounts.reduce((sum: number, c: any) => sum + (c.total_items || 0), 0);
      const countedItems = userActiveCounts.reduce((sum: number, c: any) => sum + (c.counted_items || 0), 0);
      const currentProgress = totalItems > 0 ? Math.round((countedItems / totalItems) * 100) : 0;

      return {
        user_id: user.id,
        employee_name: user.employee_name,
        active_counts: userActiveCounts.length,
        bins: userActiveCounts.map((c: any) => c.bin_code).filter(Boolean),
        accuracy: avgAccuracy,
        current_progress: currentProgress,
        total_items: totalItems,
        counted_items: countedItems,
        status,
      };
    });

    return counters;
  },

  // Get schedule configuration
  async getSchedules() {
    const { data: schedules, error } = await supabase
      .from('count_schedules')
      .select('*')
      .order('location_name');

    if (error) {
      console.error('Error fetching schedules:', error);
      // If table doesn't exist yet, return defaults from locations
      const { data: locations } = await supabase
        .from('locations')
        .select('id, name')
        .eq('status', 'active');

      return (locations || []).map((loc: any) => ({
        location_id: loc.id,
        location_name: loc.name,
        regular_days: [true, true, true, true, true, true, false],
        high_value_daily: false,
        overrides: [],
        holidays: [],
      }));
    }

    return schedules || [];
  },

  // Save schedule configuration
  async saveSchedules(schedules: Array<{
    location_id: string;
    location_name: string;
    regular_days: boolean[];
    high_value_daily: boolean;
    overrides: any[];
    holidays: any[];
  }>) {
    // Upsert each schedule
    for (const schedule of schedules) {
      const { error } = await supabase
        .from('count_schedules')
        .upsert({
          location_id: schedule.location_id,
          location_name: schedule.location_name,
          regular_days: schedule.regular_days,
          high_value_daily: schedule.high_value_daily,
          overrides: schedule.overrides,
          holidays: schedule.holidays,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'location_id' });

      if (error) {
        console.error('Error saving schedule:', error);
        throw error;
      }
    }

    return { message: 'Schedules saved successfully' };
  },

  // Get schedule status for the current week (used by mobile banner)
  async getScheduleStatus() {
    const schedules = await this.getSchedules();
    const now = new Date();
    // IST timezone
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset + now.getTimezoneOffset() * 60 * 1000);
    const todayStr = istDate.toISOString().split('T')[0];
    const todayDayIndex = istDate.getDay();

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Build 7 days of the current week (Sun-Sat)
    const weekStart = new Date(istDate);
    weekStart.setDate(istDate.getDate() - todayDayIndex); // Go back to Sunday

    const weekDates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      weekDates.push(d.toISOString().split('T')[0]);
    }

    // Get stock counts for this week's dates
    const { data: weekCounts } = await supabase
      .from('stock_counts')
      .select('due_date, status, assigned_to')
      .gte('due_date', weekDates[0])
      .lte('due_date', weekDates[6]);

    const this_week = weekDates.map((date, i) => {
      // Check if any schedule has this day as scheduled
      const isScheduled = schedules.some((s: any) => {
        const override = (s.overrides || []).find((o: any) => o.date === date);
        if (override) return !override.skip;
        const isHoliday = (s.holidays || []).some((h: any) => h.date === date);
        if (isHoliday) return false;
        return s.regular_days?.[i] ?? false;
      });

      const dayCounts = (weekCounts || []).filter((c: any) => c.due_date === date);

      return {
        date,
        day: dayLabels[i],
        scheduled: isScheduled,
        total_counts: dayCounts.length,
        claimed_counts: dayCounts.filter((c: any) => c.assigned_to != null).length,
        completed_counts: dayCounts.filter((c: any) => ['submitted', 'approved'].includes(c.status)).length,
      };
    });

    return {
      this_week,
      today: todayStr,
      today_scheduled: this_week[todayDayIndex]?.scheduled ?? false,
      today_counts: this_week[todayDayIndex]?.total_counts ?? 0,
    };
  },

  // Get escalation items (repeated recounts or high variance)
  async getEscalations() {
    // Get stock counts that have been recounted or have high variance
    const { data: counts, error } = await supabase
      .from('stock_counts')
      .select(`
        id, stock_count_number, bin_code, status, accuracy,
        stock_count_items (
          id, item_id, item_name, sku, expected_quantity, counted_quantity, notes
        )
      `)
      .in('status', ['recount', 'rejected', 'in_progress', 'submitted']);

    if (error) {
      console.error('Error fetching escalations:', error);
      throw error;
    }

    const escalations: any[] = [];

    (counts || []).forEach((count: any) => {
      const items = count.stock_count_items || [];
      items.forEach((item: any) => {
        if (item.expected_quantity == null || item.counted_quantity == null) return;

        const variance = Math.abs(item.expected_quantity - item.counted_quantity);
        const variancePercent = item.expected_quantity > 0
          ? Math.round((variance / item.expected_quantity) * 100)
          : (variance > 0 ? 100 : 0);

        // Escalate if variance > 20% or count has been rejected/recounted
        if (variancePercent > 20 || count.status === 'recount') {
          escalations.push({
            item_id: item.item_id,
            item_name: item.item_name,
            sku: item.sku || '',
            stock_count_id: count.id,
            bin_code: count.bin_code || '',
            recount_history: [item.counted_quantity],
            expected_quantity: item.expected_quantity,
            variance_percent: variancePercent,
            escalation_type: count.status === 'recount' ? 'max_recount' : 'critical_variance',
          });
        }
      });
    });

    return escalations;
  },
};

export default adminService;
