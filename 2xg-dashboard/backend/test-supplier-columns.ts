import { supabaseAdmin } from './src/config/supabase';

async function testSupplierColumns() {
  console.log('Testing Suppliers table columns...\n');

  try {
    // Try to select all columns including the new ones
    const { data, error } = await supabaseAdmin
      .from('suppliers')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error querying suppliers table:', error);
      return;
    }

    console.log('✅ Successfully queried suppliers table');
    console.log('Sample data (or empty if no records):', data);

    // Try to insert a test vendor with all columns
    const testVendor = {
      supplier_name: 'Test Vendor',
      company_name: 'Test Company',
      contact_person: 'Test Person',
      email: 'test@example.com',
      phone: '1234567890',
      work_phone: '0987654321',
      gst_treatment: 'Regular',
      gstin: 'TEST123456',
      pan: 'TESTPAN',
      source_of_supply: 'Test State',
      currency: 'INR',
      is_msme_registered: false,
      payment_terms: 'Due on Receipt',
      country: 'India',
      is_active: true
    };

    console.log('\nAttempting to insert test vendor...');
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('suppliers')
      .insert(testVendor)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting test vendor:', insertError);
      console.error('This likely means the columns are not in the schema cache yet.');
      console.error('Please reload the schema cache in Supabase Dashboard.');
      return;
    }

    console.log('✅ Successfully inserted test vendor!');
    console.log('Inserted data:', insertData);

    // Clean up - delete the test vendor
    if (insertData && insertData.id) {
      await supabaseAdmin
        .from('suppliers')
        .delete()
        .eq('id', insertData.id);
      console.log('\n✅ Test vendor cleaned up');
    }

    console.log('\n🎉 All columns are working correctly!');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testSupplierColumns();
