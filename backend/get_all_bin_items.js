require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  global: { headers: { Prefer: 'return=representation' } }
});

(async () => {
  const { data: bins } = await s.from('bin_locations').select('id, bin_code').order('bin_code');

  for (const bin of bins) {
    const { data: allocs } = await s
      .from('bill_item_bin_allocations')
      .select('quantity, bill_items!inner(item_id, item_name)')
      .eq('bin_location_id', bin.id);

    const m = {};
    (allocs || []).forEach(a => {
      const k = a.bill_items.item_id;
      if (!m[k]) m[k] = { id: k, name: a.bill_items.item_name, qty: 0 };
      m[k].qty += Number(a.quantity);
    });

    const items = Object.values(m);
    if (items.length === 0) continue;

    const ids = items.map(i => i.id);
    const { data: recs } = await s.from('items').select('id, sku').in('id', ids);
    const sm = {};
    (recs || []).forEach(r => { sm[r.id] = r; });

    console.log('=== ' + bin.bin_code + ' (' + items.length + ' items) ===');
    items.forEach((it, i) => {
      const r = sm[it.id] || {};
      console.log('  ' + (i + 1) + '. ' + it.name + ' | SKU: ' + (r.sku || '-') + ' | Qty: ' + it.qty);
    });
    console.log('');
  }
})();
