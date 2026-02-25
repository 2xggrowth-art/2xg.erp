import { supabaseAdmin as supabase } from '../config/supabase';

export class GstReportsService {
  /**
   * GSTR-1: Outward supplies (sales invoices)
   */
  async getGSTR1(startDate: string, endDate: string) {
    // Fetch all invoices in date range
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .gte('invoice_date', startDate)
      .lte('invoice_date', endDate)
      .neq('status', 'cancelled')
      .order('invoice_date', { ascending: true });

    if (error) throw error;

    // Categorize invoices for GSTR-1
    const b2b: any[] = []; // To registered businesses (with GSTIN)
    const b2c_large: any[] = []; // Inter-state > 2.5L to unregistered
    const b2c_small: any[] = []; // Intra-state to unregistered
    const hsn_summary: Record<string, any> = {};

    for (const inv of (invoices || [])) {
      const entry = {
        invoice_number: inv.invoice_number,
        invoice_date: inv.invoice_date,
        customer_name: inv.customer_name,
        customer_gstin: inv.customer_gstin,
        place_of_supply: inv.place_of_supply,
        supply_type: inv.supply_type,
        reverse_charge: inv.reverse_charge ? 'Y' : 'N',
        taxable_value: inv.subtotal - (inv.discount_amount || 0),
        cgst_amount: inv.cgst_amount || 0,
        sgst_amount: inv.sgst_amount || 0,
        igst_amount: inv.igst_amount || 0,
        cess_amount: inv.cess_amount || 0,
        total_amount: inv.total_amount,
      };

      if (inv.customer_gstin) {
        b2b.push(entry);
      } else if (inv.supply_type === 'inter_state' && inv.total_amount > 250000) {
        b2c_large.push(entry);
      } else {
        b2c_small.push(entry);
      }

      // HSN summary
      for (const item of (inv.invoice_items || [])) {
        const hsn = item.hsn_code || 'NA';
        if (!hsn_summary[hsn]) {
          hsn_summary[hsn] = { hsn_code: hsn, description: item.item_name, total_qty: 0, taxable_value: 0, cgst: 0, sgst: 0, igst: 0, total_tax: 0 };
        }
        hsn_summary[hsn].total_qty += item.quantity || 0;
        hsn_summary[hsn].taxable_value += item.amount || 0;
        hsn_summary[hsn].cgst += item.cgst_amount || 0;
        hsn_summary[hsn].sgst += item.sgst_amount || 0;
        hsn_summary[hsn].igst += item.igst_amount || 0;
        hsn_summary[hsn].total_tax += (item.cgst_amount || 0) + (item.sgst_amount || 0) + (item.igst_amount || 0);
      }
    }

    return {
      period: { start: startDate, end: endDate },
      b2b,
      b2c_large,
      b2c_small,
      hsn_summary: Object.values(hsn_summary),
      totals: {
        total_invoices: (invoices || []).length,
        total_taxable: (invoices || []).reduce((s: number, i: any) => s + (i.subtotal - (i.discount_amount || 0)), 0),
        total_cgst: (invoices || []).reduce((s: number, i: any) => s + (i.cgst_amount || 0), 0),
        total_sgst: (invoices || []).reduce((s: number, i: any) => s + (i.sgst_amount || 0), 0),
        total_igst: (invoices || []).reduce((s: number, i: any) => s + (i.igst_amount || 0), 0),
        total_cess: (invoices || []).reduce((s: number, i: any) => s + (i.cess_amount || 0), 0),
      }
    };
  }

  /**
   * GSTR-3B: Summary return
   */
  async getGSTR3B(startDate: string, endDate: string) {
    // Outward supplies (invoices)
    const { data: invoices } = await supabase
      .from('invoices')
      .select('subtotal, discount_amount, cgst_amount, sgst_amount, igst_amount, cess_amount, supply_type, reverse_charge, customer_gstin')
      .gte('invoice_date', startDate)
      .lte('invoice_date', endDate)
      .neq('status', 'cancelled');

    // Inward supplies (bills)
    const { data: bills } = await supabase
      .from('bills')
      .select('subtotal, discount_amount, cgst_amount, sgst_amount, igst_amount, cess_amount, supply_type, reverse_charge, itc_eligible')
      .gte('bill_date', startDate)
      .lte('bill_date', endDate)
      .neq('status', 'cancelled');

    const invList = invoices || [];
    const billList = bills || [];

    // Table 3.1 - Outward supplies
    const outward = {
      taxable_value: invList.reduce((s: number, i: any) => s + (i.subtotal - (i.discount_amount || 0)), 0),
      cgst: invList.reduce((s: number, i: any) => s + (i.cgst_amount || 0), 0),
      sgst: invList.reduce((s: number, i: any) => s + (i.sgst_amount || 0), 0),
      igst: invList.reduce((s: number, i: any) => s + (i.igst_amount || 0), 0),
      cess: invList.reduce((s: number, i: any) => s + (i.cess_amount || 0), 0),
    };

    // Reverse charge outward
    const rcm_invoices = invList.filter((i: any) => i.reverse_charge);
    const reverse_charge = {
      taxable_value: rcm_invoices.reduce((s: number, i: any) => s + (i.subtotal - (i.discount_amount || 0)), 0),
      cgst: rcm_invoices.reduce((s: number, i: any) => s + (i.cgst_amount || 0), 0),
      sgst: rcm_invoices.reduce((s: number, i: any) => s + (i.sgst_amount || 0), 0),
      igst: rcm_invoices.reduce((s: number, i: any) => s + (i.igst_amount || 0), 0),
    };

    // Table 4 - ITC
    const eligible_bills = billList.filter((b: any) => b.itc_eligible !== false);
    const itc = {
      igst: eligible_bills.reduce((s: number, b: any) => s + (b.igst_amount || 0), 0),
      cgst: eligible_bills.reduce((s: number, b: any) => s + (b.cgst_amount || 0), 0),
      sgst: eligible_bills.reduce((s: number, b: any) => s + (b.sgst_amount || 0), 0),
      cess: eligible_bills.reduce((s: number, b: any) => s + (b.cess_amount || 0), 0),
    };

    // Tax payable
    const tax_payable = {
      cgst: Math.max(0, outward.cgst - itc.cgst),
      sgst: Math.max(0, outward.sgst - itc.sgst),
      igst: Math.max(0, outward.igst - itc.igst),
      cess: Math.max(0, outward.cess - itc.cess),
    };

    return {
      period: { start: startDate, end: endDate },
      table_3_1: { outward_taxable: outward, reverse_charge },
      table_4: { itc_available: itc },
      table_6: { tax_payable },
      summary: {
        total_tax_collected: outward.cgst + outward.sgst + outward.igst + outward.cess,
        total_itc: itc.cgst + itc.sgst + itc.igst + itc.cess,
        net_payable: tax_payable.cgst + tax_payable.sgst + tax_payable.igst + tax_payable.cess,
      }
    };
  }

  /**
   * ITC Report: Input Tax Credit tracking
   */
  async getITCReport(startDate: string, endDate: string) {
    const { data: bills, error } = await supabase
      .from('bills')
      .select('id, bill_number, bill_date, vendor_name, vendor_gstin, subtotal, cgst_amount, sgst_amount, igst_amount, cess_amount, itc_eligible, reverse_charge')
      .gte('bill_date', startDate)
      .lte('bill_date', endDate)
      .neq('status', 'cancelled')
      .order('bill_date', { ascending: true });

    if (error) throw error;

    const eligible = (bills || []).filter((b: any) => b.itc_eligible !== false);
    const blocked = (bills || []).filter((b: any) => b.itc_eligible === false);

    return {
      period: { start: startDate, end: endDate },
      eligible_itc: {
        bills: eligible,
        total_cgst: eligible.reduce((s: number, b: any) => s + (b.cgst_amount || 0), 0),
        total_sgst: eligible.reduce((s: number, b: any) => s + (b.sgst_amount || 0), 0),
        total_igst: eligible.reduce((s: number, b: any) => s + (b.igst_amount || 0), 0),
        total_cess: eligible.reduce((s: number, b: any) => s + (b.cess_amount || 0), 0),
      },
      blocked_itc: {
        bills: blocked,
        total_blocked: blocked.reduce((s: number, b: any) => s + (b.cgst_amount || 0) + (b.sgst_amount || 0) + (b.igst_amount || 0), 0),
      },
      summary: {
        total_bills: (bills || []).length,
        eligible_count: eligible.length,
        blocked_count: blocked.length,
      }
    };
  }
}

export const gstReportsService = new GstReportsService();
