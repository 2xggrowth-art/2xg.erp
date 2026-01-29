import { supabaseAdmin } from './src/config/supabase';

async function deleteItemBySku(sku: string) {
  console.log(`Deleting item with SKU: ${sku}...\n`);

  try {
    // First, find the item
    const { data: items, error: findError } = await supabaseAdmin
      .from('items')
      .select('*')
      .eq('sku', sku);

    if (findError) {
      console.error('❌ Error finding item:', findError);
      return;
    }

    if (!items || items.length === 0) {
      console.log('✅ No item found with that SKU. You can safely create a new one.');
      return;
    }

    console.log('Found item:', items[0]);

    // Delete the item
    const { error: deleteError } = await supabaseAdmin
      .from('items')
      .delete()
      .eq('sku', sku);

    if (deleteError) {
      console.error('❌ Error deleting item:', deleteError);
      return;
    }

    console.log(`\n✅ Successfully deleted item with SKU: ${sku}`);
    console.log('You can now create a new item with this SKU.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Get SKU from command line argument
const sku = process.argv[2] || 'ews';
deleteItemBySku(sku);
