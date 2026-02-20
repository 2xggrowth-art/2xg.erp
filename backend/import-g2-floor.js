/**
 * Import Ground Floor G2 Inventory from consolidated Excel
 */

const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: 'public' },
  global: { headers: { 'Prefer': 'return=representation' } }
});

async function main() {
  const excelPath = path.resolve('C:\\Users\\Admin\\Downloads\\G2_FLOOR_INVENTORY_CONSOLIDATED.xlsx');
  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  console.log(`Read ${rows.length} unique items from Excel\n`);

  // Find location "bch"
  let { data: location } = await supabase
    .from('locations')
    .select('id, name')
    .ilike('name', 'bch')
    .single();

  if (!location) {
    console.error('Location "bch" not found!');
    process.exit(1);
  }
  console.log(`Location: ${location.name} (${location.id})`);

  // Find or create bin "ground floor g2"
  let { data: bin } = await supabase
    .from('bin_locations')
    .select('id, bin_code, location_id')
    .ilike('bin_code', 'ground floor g2')
    .single();

  if (!bin) {
    console.log('Bin "ground floor g2" not found, creating...');
    const { data: newBin, error: binErr } = await supabase
      .from('bin_locations')
      .insert({ bin_code: 'ground floor g2', location_id: location.id, description: 'Ground Floor G2 Inventory', status: 'active' })
      .select()
      .single();
    if (binErr) { console.error('Failed to create bin:', binErr); process.exit(1); }
    bin = newBin;
  }
  console.log(`Bin: ${bin.bin_code} (${bin.id})\n`);

  // Get highest existing SKU number
  const { data: existingSkus } = await supabase
    .from('items')
    .select('sku')
    .like('sku', 'SKU-%')
    .order('sku', { ascending: false })
    .limit(1);

  let nextSkuNum = 1;
  if (existingSkus && existingSkus.length > 0) {
    const match = existingSkus[0].sku.match(/SKU-(\d+)/);
    if (match) nextSkuNum = parseInt(match[1]) + 1;
  }
  console.log(`Starting SKU number: SKU-${String(nextSkuNum).padStart(4, '0')}\n`);

  // Get all existing items to check for duplicates
  const { data: allItems } = await supabase
    .from('items')
    .select('id, item_name, sku, size, color, variant, current_stock');

  const existingItemMap = new Map();
  if (allItems) {
    for (const item of allItems) {
      const key = `${(item.item_name || '').toLowerCase().trim()}|${(item.size || '').toLowerCase().trim()}|${(item.variant || '').toLowerCase().trim()}|${(item.color || '').toLowerCase().trim()}`;
      existingItemMap.set(key, item);
    }
  }

  // Process each row
  const billItems = [];
  let created = 0, found = 0, failed = 0;

  for (const row of rows) {
    const itemName = String(row['ITEM NAME'] || '').trim();
    const variant = String(row['M/S S/S'] || '').trim();
    const size = String(row['SIZE'] || '').trim();
    const color = String(row['CLR'] || '').trim();
    const qty = parseInt(row['QTY']) || 1;

    if (!itemName) continue;

    const key = `${itemName.toLowerCase()}|${size.toLowerCase()}|${variant.toLowerCase()}|${color.toLowerCase()}`;
    let item = existingItemMap.get(key);

    if (item) {
      console.log(`  FOUND: ${itemName} (${size}, ${variant}, ${color}) -> ${item.sku}`);
      found++;
    } else {
      const sku = `SKU-${String(nextSkuNum).padStart(4, '0')}`;
      nextSkuNum++;

      const { data: newItem, error: itemErr } = await supabase
        .from('items')
        .insert({
          item_name: itemName,
          sku: sku,
          size: size || null,
          color: color || null,
          variant: variant || null,
          unit_price: 0,
          cost_price: 0,
          current_stock: 0,
          unit_of_measurement: 'pieces',
          item_type: 'goods',
          is_active: true,
          advanced_tracking_type: 'serial',
        })
        .select()
        .single();

      if (itemErr) {
        console.error(`  FAILED: ${itemName} (${sku}) - ${itemErr.message}`);
        failed++;
        continue;
      }

      item = newItem;
      existingItemMap.set(key, item);
      console.log(`  CREATED: ${itemName} (${size}, ${variant}, ${color}) -> ${sku}`);
      created++;
    }

    // Generate serial numbers
    const serialNumbers = [];
    for (let i = 1; i <= qty; i++) {
      serialNumbers.push(`${item.sku}/${i}`);
    }

    billItems.push({
      item_id: item.id,
      item_name: itemName,
      quantity: qty,
      sku: item.sku,
      serial_numbers: serialNumbers,
      bin_allocations: [{
        bin_location_id: bin.id,
        bin_code: bin.bin_code,
        quantity: qty,
      }]
    });
  }

  console.log(`\nItems: ${created} created, ${found} found, ${failed} failed`);
  console.log(`Bill items to add: ${billItems.length}`);
  const totalQty = billItems.reduce((sum, i) => sum + i.quantity, 0);
  console.log(`Total quantity: ${totalQty}\n`);

  if (billItems.length === 0) {
    console.log('No items to process. Exiting.');
    return;
  }

  // Generate bill number
  const { data: lastBill } = await supabase
    .from('bills')
    .select('bill_number')
    .like('bill_number', 'BILL-%')
    .order('bill_number', { ascending: false })
    .limit(1);

  let nextBillNum = 1;
  if (lastBill && lastBill.length > 0) {
    const match = lastBill[0].bill_number.match(/BILL-(\d+)/);
    if (match) nextBillNum = parseInt(match[1]) + 1;
  }
  const billNumber = `BILL-${String(nextBillNum).padStart(4, '0')}`;

  // Create the bill
  const today = new Date().toISOString().split('T')[0];
  const { data: bill, error: billErr } = await supabase
    .from('bills')
    .insert({
      bill_number: billNumber,
      vendor_name: 'Ground Floor G2 Inventory Import',
      bill_date: today,
      due_date: today,
      subtotal: 0,
      tax_amount: 0,
      discount_amount: 0,
      total_amount: 0,
      status: 'open',
      payment_status: 'unpaid',
      notes: 'Auto-imported from Ground Floor G2 Inventory Excel',
    })
    .select()
    .single();

  if (billErr) {
    console.error('Failed to create bill:', billErr);
    process.exit(1);
  }
  console.log(`Created bill: ${billNumber} (${bill.id})`);

  // Create bill items, bin allocations, and serial numbers
  let itemsAdded = 0;
  for (const bi of billItems) {
    const { data: billItem, error: biErr } = await supabase
      .from('bill_items')
      .insert({
        bill_id: bill.id,
        item_id: bi.item_id,
        item_name: bi.item_name,
        quantity: bi.quantity,
        unit_price: 0,
        tax_rate: 0,
        discount: 0,
        total: 0,
        unit_of_measurement: 'pieces',
        serial_numbers: bi.serial_numbers,
      })
      .select()
      .single();

    if (biErr) {
      console.error(`  Failed bill item: ${bi.item_name} - ${biErr.message}`);
      continue;
    }

    const { error: allocErr } = await supabase
      .from('bill_item_bin_allocations')
      .insert({
        bill_item_id: billItem.id,
        bin_location_id: bin.id,
        quantity: bi.quantity,
      });

    if (allocErr) {
      console.error(`  Failed bin allocation: ${bi.item_name} - ${allocErr.message}`);
      continue;
    }

    // Update item current_stock
    const { error: stockErr } = await supabase.rpc('exec_sql', {
      sql: `UPDATE items SET current_stock = COALESCE(current_stock, 0) + ${bi.quantity} WHERE id = '${bi.item_id}'`
    });

    if (stockErr) {
      const existing = await supabase.from('items').select('current_stock').eq('id', bi.item_id).single();
      const currentStock = (existing.data?.current_stock || 0) + bi.quantity;
      await supabase.from('items').update({ current_stock: currentStock }).eq('id', bi.item_id);
    }

    console.log(`  Added: ${bi.item_name} (${bi.sku}) x${bi.quantity} | Serials: ${bi.serial_numbers.join(', ')}`);
    itemsAdded++;
  }

  console.log(`\n=== DONE ===`);
  console.log(`Bill: ${billNumber}`);
  console.log(`Items added to bill: ${itemsAdded}/${billItems.length}`);
  console.log(`Total quantity added to bin "${bin.bin_code}": ${totalQty}`);
  console.log(`Location: ${location.name}`);
  console.log(`Serial numbers generated for all items`);
}

main().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});
