import { getDb } from '../db/database';
import { getApiClient } from './api-client';
import * as syncQueue from './sync-queue';

interface SyncResult {
  success: boolean;
  pulled: number;
  pushed: number;
  errors: string[];
}

// ─── PULL (Cloud → Local) ─────────────────────────────────────────────

export async function pullFromCloud(): Promise<SyncResult> {
  const api = getApiClient();
  if (!api) {
    return { success: false, pulled: 0, pushed: 0, errors: ['No cloud connection configured'] };
  }

  const db = getDb();
  const errors: string[] = [];
  let pulled = 0;

  // Pull items
  try {
    const response = await api.get('/items', { params: { _t: Date.now() } });
    const items = response.data?.data?.data || response.data?.data || [];
    if (Array.isArray(items)) {
      const upsert = db.prepare(`
        INSERT INTO items (id, item_name, sku, unit_price, cost_price, current_stock,
          unit_of_measurement, category_id, subcategory_id, item_type, size, color, variant,
          barcode, hsn_code, tax_rate, is_active, image_url, synced_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(id) DO UPDATE SET
          item_name=excluded.item_name, sku=excluded.sku, unit_price=excluded.unit_price,
          cost_price=excluded.cost_price, current_stock=excluded.current_stock,
          unit_of_measurement=excluded.unit_of_measurement, category_id=excluded.category_id,
          subcategory_id=excluded.subcategory_id, item_type=excluded.item_type,
          size=excluded.size, color=excluded.color, variant=excluded.variant,
          barcode=excluded.barcode, hsn_code=excluded.hsn_code, tax_rate=excluded.tax_rate,
          is_active=excluded.is_active, image_url=excluded.image_url, synced_at=datetime('now')
      `);

      const runAll = db.transaction((rows: any[]) => {
        for (const item of rows) {
          upsert.run(
            item.id, item.item_name || item.name, item.sku, item.unit_price || item.selling_price || 0,
            item.cost_price || 0, item.current_stock || item.opening_stock || 0,
            item.unit_of_measurement || item.unit || 'pcs', item.category_id || null,
            item.subcategory_id || null, item.item_type || 'goods',
            item.size || null, item.color || null, item.variant || null,
            item.barcode || null, item.hsn_code || null, item.tax_rate || 0,
            item.is_active !== false ? 1 : 0, item.image_url || null
          );
        }
      });
      runAll(items);
      pulled += items.length;
    }
  } catch (error: any) {
    errors.push(`Items pull failed: ${error.message}`);
  }

  // Pull customers
  try {
    const response = await api.get('/customers');
    const customers = response.data?.data?.data || response.data?.data || [];
    if (Array.isArray(customers)) {
      const upsert = db.prepare(`
        INSERT INTO customers (id, customer_name, company_name, email, phone, mobile,
          billing_address, shipping_address, gstin, pan, state_code, payment_terms,
          current_balance, is_active, synced_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(id) DO UPDATE SET
          customer_name=excluded.customer_name, company_name=excluded.company_name,
          email=excluded.email, phone=excluded.phone, mobile=excluded.mobile,
          billing_address=excluded.billing_address, shipping_address=excluded.shipping_address,
          gstin=excluded.gstin, pan=excluded.pan, state_code=excluded.state_code,
          payment_terms=excluded.payment_terms, current_balance=excluded.current_balance,
          is_active=excluded.is_active, synced_at=datetime('now')
      `);

      const runAll = db.transaction((rows: any[]) => {
        for (const c of rows) {
          upsert.run(
            c.id, c.customer_name, c.company_name || null, c.email || null,
            c.phone || null, c.mobile || null, c.billing_address || c.address || null,
            c.shipping_address || null, c.gstin || null, c.pan || null,
            c.state_code || null, c.payment_terms || 'Due on Receipt',
            c.current_balance || 0, c.is_active !== false ? 1 : 0
          );
        }
      });
      runAll(customers);
      pulled += customers.length;
    }
  } catch (error: any) {
    errors.push(`Customers pull failed: ${error.message}`);
  }

  // Pull bin locations with stock
  try {
    const response = await api.get('/bin-locations/stock/all');
    const bins = response.data?.data || [];
    if (Array.isArray(bins)) {
      const upsertBin = db.prepare(`
        INSERT INTO bin_locations (id, bin_code, warehouse, location_name, status, synced_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(id) DO UPDATE SET
          bin_code=excluded.bin_code, warehouse=excluded.warehouse,
          location_name=excluded.location_name, status=excluded.status, synced_at=datetime('now')
      `);
      const upsertStock = db.prepare(`
        INSERT INTO bin_stock (bin_location_id, item_id, quantity)
        VALUES (?, ?, ?)
        ON CONFLICT(bin_location_id, item_id) DO UPDATE SET quantity=excluded.quantity
      `);

      const runAll = db.transaction((rows: any[]) => {
        for (const bin of rows) {
          const locationName = bin.locations?.name || bin.location_name || bin.warehouse || '';
          upsertBin.run(bin.id, bin.bin_code, bin.warehouse || null, locationName, bin.status || 'active');

          if (bin.items && Array.isArray(bin.items)) {
            for (const item of bin.items) {
              if (item.item_id && item.quantity > 0) {
                upsertStock.run(bin.id, item.item_id, item.quantity);
              }
            }
          }
        }
      });
      runAll(bins);
      pulled += bins.length;
    }
  } catch (error: any) {
    errors.push(`Bin locations pull failed: ${error.message}`);
  }

  // Pull org settings
  try {
    const response = await api.get('/org-settings');
    const settings = response.data?.data;
    if (settings) {
      db.prepare(`
        INSERT INTO org_settings (id, organization_id, company_name, tagline,
          address_line1, address_line2, city, state, state_code, postal_code,
          phone, email, website, gstin, pan, logo_url,
          bank_name, bank_account_name, bank_account_number, bank_ifsc,
          org_code, invoice_prefix, session_prefix, default_register, place_of_supply, default_notes,
          theme_color, synced_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(id) DO UPDATE SET
          company_name=excluded.company_name, tagline=excluded.tagline,
          address_line1=excluded.address_line1, address_line2=excluded.address_line2,
          city=excluded.city, state=excluded.state, state_code=excluded.state_code,
          postal_code=excluded.postal_code, phone=excluded.phone, email=excluded.email,
          website=excluded.website, gstin=excluded.gstin, pan=excluded.pan,
          logo_url=excluded.logo_url, bank_name=excluded.bank_name,
          bank_account_name=excluded.bank_account_name, bank_account_number=excluded.bank_account_number,
          bank_ifsc=excluded.bank_ifsc, org_code=excluded.org_code,
          invoice_prefix=excluded.invoice_prefix,
          session_prefix=excluded.session_prefix, default_register=excluded.default_register,
          place_of_supply=excluded.place_of_supply, default_notes=excluded.default_notes,
          theme_color=excluded.theme_color, synced_at=datetime('now')
      `).run(
        settings.id, settings.organization_id || null, settings.company_name,
        settings.tagline || null, settings.address_line1 || null, settings.address_line2 || null,
        settings.city || null, settings.state || null, settings.state_code || null,
        settings.postal_code || null, settings.phone || null, settings.email || null,
        settings.website || null, settings.gstin || null, settings.pan || null,
        settings.logo_url || null, settings.bank_name || null,
        settings.bank_account_name || null, settings.bank_account_number || null,
        settings.bank_ifsc || null, settings.org_code || null,
        settings.invoice_prefix || 'INV-',
        settings.session_prefix || 'SE1-', settings.default_register || 'billing desk',
        settings.place_of_supply || null, settings.default_notes || null,
        settings.theme_color || '#2563EB'
      );

      // Remove demo org settings — real cloud data takes over
      if (settings.id !== 'org-default') {
        db.prepare(`DELETE FROM org_settings WHERE id = 'org-default'`).run();
      }

      pulled++;
    }
  } catch (error: any) {
    errors.push(`Org settings pull failed: ${error.message}`);
  }

  // Pull POS codes
  try {
    const response = await api.get('/pos-codes');
    const codes = response.data?.data || [];
    if (Array.isArray(codes) && codes.length > 0) {
      const deleteThenInsert = db.transaction((rows: any[]) => {
        // Clear all synced POS codes, then re-insert from cloud
        db.prepare(`DELETE FROM pos_codes WHERE synced_at IS NOT NULL`).run();
        const insert = db.prepare(`
          INSERT OR REPLACE INTO pos_codes (id, code, employee_name, is_active, synced_at)
          VALUES (?, ?, ?, ?, datetime('now'))
        `);
        for (const c of rows) {
          insert.run(c.id, c.code, c.employee_name, c.is_active ? 1 : 0);
        }
      });
      deleteThenInsert(codes);

      // Remove demo POS code — real cloud codes take over
      db.prepare(`DELETE FROM pos_codes WHERE id = 'poscode-demo' AND synced_at IS NULL`).run();

      pulled += codes.length;
    }
  } catch (error: any) {
    errors.push(`POS codes pull failed: ${error.message}`);
  }

  // Update last pull time
  db.prepare(`INSERT INTO app_settings (key, value) VALUES ('last_pull', datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = datetime('now')`).run();

  return { success: errors.length === 0, pulled, pushed: 0, errors };
}

// ─── PUSH (Local → Cloud) ─────────────────────────────────────────────

export async function pushToCloud(): Promise<SyncResult> {
  const api = getApiClient();
  if (!api) {
    return { success: false, pulled: 0, pushed: 0, errors: ['No cloud connection configured'] };
  }

  const pending = syncQueue.getPending(50);
  const errors: string[] = [];
  let pushed = 0;

  for (const entry of pending) {
    try {
      const payload = entry.payload ? JSON.parse(entry.payload) : null;

      switch (entry.table_name) {
        case 'invoices': {
          if (entry.operation === 'INSERT' && payload) {
            await api.post('/invoices', payload);
          }
          break;
        }
        case 'pos_sessions': {
          if (entry.operation === 'INSERT' && payload) {
            await api.post('/pos-sessions/start', payload);
          } else if (entry.operation === 'UPDATE' && payload) {
            await api.post(`/pos-sessions/${entry.record_id}/close`, payload);
          }
          break;
        }
        case 'customers': {
          if (entry.operation === 'INSERT' && payload) {
            await api.post('/customers', payload);
          }
          break;
        }
        case 'payments_received': {
          if (entry.operation === 'INSERT' && payload) {
            await api.post('/payments-received', payload);
          }
          break;
        }
        default:
          break;
      }

      syncQueue.markSynced(entry.id);
      pushed++;
    } catch (error: any) {
      syncQueue.markFailed(entry.id, error.message || 'Push failed');
      errors.push(`${entry.table_name}/${entry.record_id}: ${error.message}`);
    }
  }

  // Update last push time
  const db = getDb();
  db.prepare(`INSERT INTO app_settings (key, value) VALUES ('last_push', datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = datetime('now')`).run();

  return { success: errors.length === 0, pulled: 0, pushed, errors };
}

// ─── Device Registration ──────────────────────────────────────────────

export async function registerDevice(): Promise<{ success: boolean; device_number: number | null; error?: string }> {
  const api = getApiClient();
  if (!api) {
    return { success: false, device_number: null, error: 'No cloud connection configured' };
  }

  const db = getDb();

  try {
    // Get a device name (use hostname or a stored name)
    const os = require('os');
    const deviceName = db.prepare(`SELECT value FROM app_settings WHERE key = 'device_name'`).get() as { value: string } | undefined;
    const name = deviceName?.value || `POS-${os.hostname()}`;

    // Call the backend register-device endpoint
    const response = await api.post('/registers/register-device', { name });
    const register = response.data?.data;

    if (!register || register.device_number == null) {
      return { success: false, device_number: null, error: 'No device number returned' };
    }

    // Store device_number in app_settings
    db.prepare(
      `INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    ).run('device_number', String(register.device_number));

    // Store device name
    db.prepare(
      `INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    ).run('device_name', name);

    // Build device-specific prefixes using org_code from local org_settings
    const orgSettings = db.prepare(
      `SELECT org_code FROM org_settings ORDER BY synced_at DESC NULLS LAST LIMIT 1`
    ).get() as { org_code: string | null } | undefined;

    const orgCode = orgSettings?.org_code;
    if (orgCode) {
      const invoicePrefix = `${orgCode}-POS${register.device_number}-INV-`;
      const sessionPrefix = `${orgCode}-POS${register.device_number}-S`;

      // Update local org_settings with device-specific prefixes
      db.prepare(
        `UPDATE org_settings SET invoice_prefix = ?, session_prefix = ? WHERE id = (SELECT id FROM org_settings ORDER BY synced_at DESC NULLS LAST LIMIT 1)`
      ).run(invoicePrefix, sessionPrefix);

      console.log(`[Sync] Device registered: #${register.device_number}, invoice_prefix=${invoicePrefix}, session_prefix=${sessionPrefix}`);
    } else {
      console.log(`[Sync] Device registered: #${register.device_number} (no org_code set — prefixes unchanged)`);
    }

    return { success: true, device_number: register.device_number };
  } catch (error: any) {
    console.error('[Sync] Device registration failed:', error.message);
    return { success: false, device_number: null, error: error.message };
  }
}

// ─── Full Sync ─────────────────────────────────────────────────────────

export async function fullSync(): Promise<SyncResult> {
  const pushResult = await pushToCloud();
  const pullResult = await pullFromCloud();

  return {
    success: pushResult.success && pullResult.success,
    pulled: pullResult.pulled,
    pushed: pushResult.pushed,
    errors: [...pushResult.errors, ...pullResult.errors],
  };
}
