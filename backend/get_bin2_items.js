require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  global: { headers: { Prefer: 'return=representation' } }
});

(async () => {
  const binId = 'a1acea1e-d29b-4d2a-a3f4-b5e4c5f598f4'; // bin2

  const { data: allocs, error } = await s
    .from('bill_item_bin_allocations')
    .select('quantity, bill_items!inner(item_id, item_name)')
    .eq('bin_location_id', binId);

  if (error) { console.error(error.message); return; }

  const m = {};
  (allocs || []).forEach(a => {
    const k = a.bill_items.item_id;
    if (!m[k]) m[k] = { id: k, name: a.bill_items.item_name, qty: 0 };
    m[k].qty += Number(a.quantity);
  });

  const items = Object.values(m);
  const ids = items.map(i => i.id);

  const { data: recs } = await s.from('items').select('id, item_name, sku, upc, ean').in('id', ids);
  const sm = {};
  (recs || []).forEach(r => { sm[r.id] = r; });

  console.log('Items in bin2 (' + items.length + '):');
  console.log('');
  items.forEach((it, i) => {
    const r = sm[it.id] || {};
    console.log((i + 1) + '. ' + it.name);
    console.log('   SKU: ' + (r.sku || '-'));
    console.log('   Qty: ' + it.qty);
    console.log('');
  });
})();
