import { supabaseAdmin } from '../config/supabase';

// Indian tax ID format validators
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

function validateGSTIN(gstin: string): boolean {
  return GSTIN_REGEX.test(gstin.toUpperCase());
}

function validatePAN(pan: string): boolean {
  return PAN_REGEX.test(pan.toUpperCase());
}

export class VendorsService {
  /**
   * Get all vendors with optional filters
   */
  async getAllVendors(filters?: {
    isActive?: boolean;
    search?: string;
  }) {
    let query = supabaseAdmin
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    if (filters?.search) {
      query = query.or(`supplier_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  /**
   * Get vendor by ID
   */
  async getVendorById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get vendors summary
   */
  async getVendorsSummary() {
    const { data, error } = await supabaseAdmin
      .from('suppliers')
      .select('current_balance, is_active');

    if (error) throw error;

    const totalVendors = data.length;
    const activeVendors = data.filter(vendor => vendor.is_active).length;
    const totalPayables = data.reduce((sum, vendor) => sum + (vendor.current_balance || 0), 0);

    return {
      totalVendors,
      activeVendors,
      totalPayables,
      currency: 'INR'
    };
  }

  /**
   * Create a new vendor
   */
  async createVendor(vendorData: any) {
    // Get organization_id (default to first organization)
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .limit(1)
      .single();

    // Build full name for supplier_name
    let supplierName = vendorData.display_name;
    if (!supplierName) {
      if (vendorData.company_name) {
        supplierName = vendorData.company_name;
      } else if (vendorData.first_name || vendorData.last_name) {
        supplierName = `${vendorData.first_name || ''} ${vendorData.last_name || ''}`.trim();
      }
    }

    // Build contact_person with all info
    let contactPerson = '';
    if (vendorData.salutation || vendorData.first_name || vendorData.last_name) {
      contactPerson = `${vendorData.salutation || ''} ${vendorData.first_name || ''} ${vendorData.last_name || ''}`.trim();
    }
    if (vendorData.company_name) {
      contactPerson = contactPerson ? `${contactPerson} (${vendorData.company_name})` : vendorData.company_name;
    }

    // Store additional info in notes field since columns don't exist
    let notesText = vendorData.notes || '';
    if (vendorData.gst_treatment) {
      notesText += `\nGST Treatment: ${vendorData.gst_treatment}`;
    }
    if (vendorData.source_of_supply) {
      notesText += `\nSource of Supply: ${vendorData.source_of_supply}`;
    }
    if (vendorData.pan) {
      notesText += `\nPAN: ${vendorData.pan}`;
    }
    if (vendorData.is_msme_registered) {
      notesText += `\nMSME Registered: Yes`;
    }
    if (vendorData.currency) {
      notesText += `\nCurrency: ${vendorData.currency}`;
    }
    if (vendorData.work_phone) {
      notesText += `\nWork Phone: ${vendorData.work_phone}`;
    }
    notesText = notesText.trim();

    // Validate PAN format if provided
    if (vendorData.pan && !validatePAN(vendorData.pan)) {
      throw new Error('Invalid PAN format. Expected: ABCDE1234F (10 characters)');
    }

    // Only use columns that exist in the original schema
    const newVendor = {
      organization_id: org?.id,
      supplier_name: supplierName,
      contact_person: contactPerson || null,
      email: vendorData.email || null,
      phone: vendorData.mobile || vendorData.work_phone || null,
      address: vendorData.address || null,
      city: vendorData.city || null,
      state: vendorData.state || null,
      country: vendorData.country || null,
      postal_code: vendorData.postal_code || null,
      tax_id: vendorData.pan || null,
      payment_terms: vendorData.payment_terms || 'Due on Receipt',
      credit_limit: vendorData.credit_limit ? parseFloat(vendorData.credit_limit) : null,
      current_balance: 0,
      is_active: true,
      notes: notesText || null
    };

    const { data, error } = await supabaseAdmin
      .from('suppliers')
      .insert(newVendor)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update an existing vendor
   */
  async updateVendor(id: string, vendorData: any) {
    // Validate PAN format if provided
    if (vendorData.pan && !validatePAN(vendorData.pan)) {
      throw new Error('Invalid PAN format. Expected: ABCDE1234F (10 characters)');
    }

    const updateData: any = {};

    if (vendorData.display_name) updateData.supplier_name = vendorData.display_name;
    if (vendorData.email !== undefined) updateData.email = vendorData.email;
    if (vendorData.mobile !== undefined || vendorData.work_phone !== undefined) {
      updateData.phone = vendorData.mobile || vendorData.work_phone;
    }
    if (vendorData.address !== undefined) updateData.address = vendorData.address;
    if (vendorData.city !== undefined) updateData.city = vendorData.city;
    if (vendorData.state !== undefined) updateData.state = vendorData.state;
    if (vendorData.country !== undefined) updateData.country = vendorData.country;
    if (vendorData.postal_code !== undefined) updateData.postal_code = vendorData.postal_code;
    if (vendorData.pan !== undefined) updateData.tax_id = vendorData.pan;
    if (vendorData.payment_terms !== undefined) updateData.payment_terms = vendorData.payment_terms;
    if (vendorData.notes !== undefined) updateData.notes = vendorData.notes;

    const { data, error } = await supabaseAdmin
      .from('suppliers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a vendor (soft delete by marking as inactive)
   */
  async deleteVendor(id: string) {
    const { data, error } = await supabaseAdmin
      .from('suppliers')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
