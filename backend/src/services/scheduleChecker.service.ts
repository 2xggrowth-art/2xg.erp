import { supabaseAdmin as supabase } from '../config/supabase';
import { StockCountsService } from './stockCounts.service';
import { adminService } from './admin.service';

interface GenerationResult {
  generated: number;
  skipped: number;
  errors: string[];
}

/**
 * Check if today is a scheduled count day for a given schedule config
 */
function isScheduledDay(
  schedule: { regular_days: boolean[]; overrides: any[]; holidays: any[] },
  todayStr: string,
  dayIndex: number
): boolean {
  // 1. Check overrides (highest priority)
  const override = (schedule.overrides || []).find((o: any) => o.date === todayStr);
  if (override) return !override.skip;

  // 2. Check holidays
  const isHoliday = (schedule.holidays || []).some((h: any) => h.date === todayStr);
  if (isHoliday) return false;

  // 3. Check regular_days (index 0=Sun, 6=Sat)
  return schedule.regular_days?.[dayIndex] ?? false;
}

/**
 * Get today's date string and day index in IST timezone
 */
function getTodayIST(): { todayStr: string; dayIndex: number } {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset + now.getTimezoneOffset() * 60 * 1000);
  const todayStr = istDate.toISOString().split('T')[0];
  const dayIndex = istDate.getDay();
  return { todayStr, dayIndex };
}

/**
 * Run scheduled count generation — creates unassigned counts for all bins
 * in locations that are scheduled for today.
 *
 * This function is idempotent — it checks for existing counts before creating new ones.
 */
export async function runScheduledCountGeneration(): Promise<GenerationResult> {
  const result: GenerationResult = { generated: 0, skipped: 0, errors: [] };
  const { todayStr, dayIndex } = getTodayIST();

  console.log(`[ScheduleChecker] Checking schedule for ${todayStr} (day ${dayIndex})`);

  // 1. Get all schedules
  let schedules: any[];
  try {
    schedules = await adminService.getSchedules();
  } catch (err: any) {
    result.errors.push(`Failed to fetch schedules: ${err.message}`);
    return result;
  }

  if (!schedules || schedules.length === 0) {
    console.log('[ScheduleChecker] No schedules configured');
    return result;
  }

  // 2. Filter to locations scheduled today
  const scheduledLocations = schedules.filter((s: any) =>
    isScheduledDay(s, todayStr, dayIndex)
  );

  if (scheduledLocations.length === 0) {
    console.log('[ScheduleChecker] No locations scheduled today');
    return result;
  }

  console.log(`[ScheduleChecker] ${scheduledLocations.length} location(s) scheduled today`);

  const stockCountsService = new StockCountsService();

  // 3. For each scheduled location
  for (const schedule of scheduledLocations) {
    try {
      // Get active bins for this location
      const { data: bins, error: binsError } = await supabase
        .from('bin_locations')
        .select('id, bin_code, location_id')
        .eq('location_id', schedule.location_id)
        .eq('status', 'active');

      if (binsError) {
        result.errors.push(`Failed to fetch bins for ${schedule.location_name}: ${binsError.message}`);
        continue;
      }

      if (!bins || bins.length === 0) {
        console.log(`[ScheduleChecker] No active bins for ${schedule.location_name}`);
        continue;
      }

      // Check for existing counts today for these bins (dedup)
      const binIds = bins.map((b: any) => b.id);
      const { data: existingCounts } = await supabase
        .from('stock_counts')
        .select('bin_location_id')
        .in('bin_location_id', binIds)
        .eq('due_date', todayStr);

      const existingBinIds = new Set(
        (existingCounts || []).map((c: any) => c.bin_location_id)
      );

      // Create unassigned counts for bins that don't already have one
      for (const bin of bins) {
        if (existingBinIds.has(bin.id)) {
          result.skipped++;
          continue;
        }

        try {
          await stockCountsService.createStockCount({
            location_id: schedule.location_id,
            location_name: schedule.location_name,
            bin_location_id: bin.id,
            bin_code: bin.bin_code,
            // No assigned_to — unassigned pool for counters to claim
            count_type: 'audit',
            due_date: todayStr,
            notes: 'Auto-generated from schedule',
            auto_generated: true,
          });

          result.generated++;
        } catch (err: any) {
          result.errors.push(`Failed for bin ${bin.bin_code}: ${err.message}`);
        }
      }
    } catch (err: any) {
      result.errors.push(`Failed for location ${schedule.location_name}: ${err.message}`);
    }
  }

  console.log(`[ScheduleChecker] Done: generated=${result.generated}, skipped=${result.skipped}, errors=${result.errors.length}`);
  return result;
}
