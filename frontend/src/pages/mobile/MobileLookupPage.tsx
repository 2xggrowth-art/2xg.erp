import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import apiClient from '../../services/api.client';

interface ItemResult {
  id: string;
  item_name: string;
  name: string;
  sku: string;
  current_stock: number;
  cost_price: number;
  unit_price: number;
  unit_of_measurement: string;
  category_name?: string;
}

interface BinInfo {
  bin_code: string;
  bin_location_id: string;
  net_quantity: number;
}

export default function MobileLookupPage() {
  const location = useLocation();
  const isDesktop = location.pathname.startsWith('/items/');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [item, setItem] = useState<ItemResult | null>(null);
  const [bins, setBins] = useState<BinInfo[]>([]);

  const handleSearch = async () => {
    const q = query.trim();
    if (q.length < 2) return;

    setLoading(true);
    setItem(null);
    setBins([]);

    try {
      const res = await apiClient.get(`/items/barcode/${encodeURIComponent(q)}`);
      const itemData = res.data?.data || res.data;
      setItem(itemData);

      // Fetch bin locations
      if (itemData?.id) {
        try {
          const binRes = await apiClient.get(`/bin-locations/item/${itemData.id}`);
          setBins(binRes.data?.data || []);
        } catch {}
      }
    } catch {
      alert('No item found for this code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingTop: isDesktop ? 0 : 48 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', padding: isDesktop ? '20px 20px 16px' : '0 20px 16px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#111827', margin: 0 }}>Item Lookup</h1>
      </div>

      {/* Search Input */}
      <div style={{ padding: '0 20px 20px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search by item code or serial number..."
          style={{
            width: '100%',
            padding: '14px 16px',
            border: '1px solid #E5E7EB',
            borderRadius: 12,
            fontSize: 15,
            color: '#111827',
            backgroundColor: '#FFFFFF',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Content */}
      <div style={{ padding: '0 20px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: 60, color: '#6B7280' }}>
            Searching...
          </div>
        )}

        {!loading && !item && (
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.6 }}>🔍</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Start Searching</div>
            <div style={{ fontSize: 14, color: '#9CA3AF' }}>Enter at least 2 characters to search</div>
          </div>
        )}

        {item && (
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
              {item.item_name || item.name}
            </div>
            <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 16 }}>
              SKU: {item.sku || '—'}
            </div>

            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 16 }}>
              {[
                { label: 'Stock', value: `${item.current_stock || 0} ${item.unit_of_measurement || 'pcs'}`, highlight: (item.current_stock || 0) <= 0 },
                { label: 'Cost Price', value: `₹${(item.cost_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
                { label: 'Selling Price', value: `₹${(item.unit_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
                ...(item.category_name ? [{ label: 'Category', value: item.category_name }] : []),
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 14, color: '#6B7280' }}>{row.label}</span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: row.highlight ? '#DC2626' : '#111827' }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Bin Locations */}
            {bins.length > 0 && (
              <>
                <div style={{ borderTop: '1px solid #E5E7EB', margin: '16px 0', paddingTop: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
                    Bin Locations
                  </div>
                  {bins.map((bin, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#F9FAFB',
                      borderRadius: 8,
                      padding: 10,
                      marginBottom: 6,
                    }}>
                      <span style={{
                        backgroundColor: '#EFF6FF',
                        padding: '3px 10px',
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#2563EB',
                      }}>
                        {bin.bin_code}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>
                        {bin.net_quantity} units
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
