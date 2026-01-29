
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import { BillsService } from './services/bills.service';
import { supabaseAdmin } from './config/supabase';

async function testDraftBillCreation() {
    const billsService = new BillsService();

    try {
        // 1. Get a valid vendor
        const { data: vendor, error: vendorError } = await supabaseAdmin
            .from('vendors')
            .select('id, vendor_name')
            .limit(1)
            .single();

        if (vendorError || !vendor) {
            console.error('Cannot find a vendor to test with:', vendorError);
            return;
        }

        console.log('Using vendor:', vendor.vendor_name, vendor.id);

        const draftData = {
            vendor_id: vendor.id,
            vendor_name: vendor.vendor_name,
            bill_number: '',
            bill_date: new Date().toISOString().split('T')[0],
            status: 'draft',
            subtotal: 0,
            tax_amount: 0,
            total_amount: 0,
            items: [
                {
                    item_id: undefined, // Simulating what frontend sends (JSON.stringify removes undefined keys, but service receives object usually)
                    // Actually, if coming from Express req.body, keys with undefined might not exist.
                    // Let's explicitly set it to null or omit it.
                    // But here we are calling TS service directly. 
                    item_name: '',
                    quantity: 0, // Frontend number input with 0
                    unit_price: 0,
                    tax_rate: 0,
                    discount: 0,
                    total: 0,
                    account: 'Cost of Goods Sold'
                }
            ]
        };

        console.log('Attempting to create draft bill with data:', JSON.stringify(draftData, null, 2));
        const result = await billsService.createBill(draftData as any);
        console.log('Success!', result);

    } catch (error) {
        console.error('Failed to create draft bill:', error);
    }
}

testDraftBillCreation();
