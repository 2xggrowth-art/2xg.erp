import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { stockCountService, StockCount, StockCountItem } from '../../services/stockCount.service';
import { binLocationService, BinLocationWithStock, BinItemStock } from '../../services/binLocation.service';
import BarcodeScanner from '../../components/BarcodeScanner';

interface ScannedItem {
  item_id: string;
  item_name: string;
  sku: string;
  counted_quantity: number;
  expected_quantity: number;
  unexpected?: boolean; // scanned but not expected in this bin
}

export default function MobileStockCountDetailPage() {
  const { id, binId } = useParams<{ id?: string; binId?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = location.pathname.startsWith('/items/');
  const listPath = isDesktop ? '/items/stock-count/tasks' : '/stock-counts';

  // Determine mode: scan (binId present) or view (id present)
  const isScanMode = !!binId;

  // Shared state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  // Scan mode state
  const [binData, setBinData] = useState<BinLocationWithStock | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [manualCounts, setManualCounts] = useState<Record<string, string>>({});
  const [lastScanResult, setLastScanResult] = useState('');

  // View mode state
  const [stockCount, setStockCount] = useState<StockCount | null>(null);

  // Fetch bin data for scan mode
  const fetchBinData = useCallback(async () => {
    if (!binId) return;
    setLoading(true);
    try {
      const res = await binLocationService.getBinLocationsWithStock();
      const bins = res.data || [];
      const bin = bins.find((b) => b.id === binId);
      if (bin) {
        setBinData(bin);
        // Initialize manual counts with empty strings for each expected item
        const mc: Record<string, string> = {};
        (bin.items || []).forEach((item) => {
          mc[item.item_id] = '';
        });
        setManualCounts(mc);
      } else {
        setError('Bin not found');
      }
    } catch {
      setError('Failed to load bin data');
    } finally {
      setLoading(false);
    }
  }, [binId]);

  // Fetch stock count for view mode
  const fetchStockCount = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await stockCountService.getStockCountById(id);
      if (data) setStockCount(data);
      else setError('Stock count not found');
    } catch {
      setError('Failed to load stock count');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isScanMode) fetchBinData();
    else fetchStockCount();
  }, [isScanMode, fetchBinData, fetchStockCount]);

  // Handle barcode scan
  const handleScan = async (code: string) => {
    setLastScanResult(`Scanning: ${code}...`);

    try {
      const item = await stockCountService.getItemByBarcode(code);
      if (!item) {
        setLastScanResult(`No item found for barcode: ${code}`);
        return;
      }

      setScannedItems((prev) => {
        const existing = prev.find((s) => s.item_id === item.id);
        if (existing) {
          // Increment count
          return prev.map((s) =>
            s.item_id === item.id
              ? { ...s, counted_quantity: s.counted_quantity + 1 }
              : s
          );
        }
        // New item scanned
        const expectedItem = binData?.items?.find((i) => i.item_id === item.id);
        return [
          ...prev,
          {
            item_id: item.id,
            item_name: item.item_name || item.name,
            sku: item.sku || '',
            counted_quantity: 1,
            expected_quantity: expectedItem?.quantity || 0,
            unexpected: !expectedItem,
          },
        ];
      });

      setLastScanResult(`Scanned: ${item.item_name || item.name}`);
    } catch {
      setLastScanResult(`Error looking up barcode: ${code}`);
    }
  };

  // Get merged list of expected items with scan/manual counts
  const getMergedItems = (): ScannedItem[] => {
    const items: ScannedItem[] = [];
    const scannedMap = new Map(scannedItems.map((s) => [s.item_id, s]));

    // Add all expected items (from bin data)
    (binData?.items || []).forEach((expected) => {
      const scanned = scannedMap.get(expected.item_id);
      const manualVal = manualCounts[expected.item_id];
      const manualQty = manualVal !== undefined && manualVal !== '' ? Number(manualVal) : 0;
      const scannedQty = scanned?.counted_quantity || 0;

      items.push({
        item_id: expected.item_id,
        item_name: expected.item_name,
        sku: '',
        expected_quantity: expected.quantity,
        counted_quantity: scannedQty + manualQty,
      });
    });

    // Add unexpected items (scanned but not expected)
    scannedItems
      .filter((s) => s.unexpected)
      .forEach((s) => {
        items.push(s);
      });

    return items;
  };

  // Save scan results
  const handleSave = async () => {
    if (!binData) return;
    setSaving(true);
    try {
      const mergedItems = getMergedItems();
      await stockCountService.saveBinScan({
        bin_location_id: binData.id,
        bin_code: binData.bin_code,
        location_id: (binData as any).location_id || undefined,
        location_name: (binData as any).locations?.name || undefined,
        scanned_by_user_id: user?.id,
        scanned_by_name: user?.name || user?.username,
        items: mergedItems.map((item) => ({
          item_id: item.item_id,
          item_name: item.item_name,
          sku: item.sku,
          expected_quantity: item.expected_quantity,
          counted_quantity: item.counted_quantity,
        })),
      });
      setSaved(true);
      setScanning(false);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Get status color for an item
  const getItemStatus = (expected: number, counted: number) => {
    if (counted === 0 && expected > 0) return { label: 'Missing', color: '#DC2626', bg: '#FEF2F2' };
    if (counted === expected) return { label: 'Match', color: '#059669', bg: '#ECFDF5' };
    if (counted < expected) return { label: 'Short', color: '#D97706', bg: '#FFFBEB' };
    return { label: 'Over', color: '#EA580C', bg: '#FFF7ED' };
  };

  if (loading) {
    return (
      <div style={{ paddingTop: isDesktop ? 0 : 48, textAlign: 'center', padding: 60, color: '#9CA3AF' }}>
        Loading...
      </div>
    );
  }

  if (error && !binData && !stockCount) {
    return (
      <div style={{ paddingTop: isDesktop ? 0 : 48, padding: 20 }}>
        <button onClick={() => navigate(listPath)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#374151' }}>&larr;</button>
        <div style={{ textAlign: 'center', padding: 40, color: '#DC2626' }}>{error}</div>
      </div>
    );
  }

  // ========================
  // VIEW MODE (saved result)
  // ========================
  if (!isScanMode && stockCount) {
    const items = stockCount.items || [];
    const totalVariance = items.filter((i) => i.variance !== null && i.variance !== 0).length;
    const allMatch = items.length > 0 && totalVariance === 0;

    return (
      <div style={{ paddingTop: isDesktop ? 0 : 48 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: isDesktop ? '20px 20px 12px' : '0 20px 12px', gap: 12 }}>
          <button onClick={() => navigate(listPath)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#374151', padding: 0 }}>&larr;</button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: 0 }}>{stockCount.stock_count_number}</h1>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>{stockCount.description}</p>
          </div>
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: allMatch ? '#059669' : '#D97706',
            backgroundColor: allMatch ? '#D1FAE5' : '#FEF3C7',
            padding: '4px 12px',
            borderRadius: 12,
          }}>
            {allMatch ? 'All Match' : `${totalVariance} Variance`}
          </span>
        </div>

        {/* Info */}
        <div style={{ padding: '0 20px 16px' }}>
          {stockCount.location_name && (
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Location: {stockCount.location_name}</div>
          )}
          {stockCount.assigned_to_name && (
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Scanned by: {stockCount.assigned_to_name}</div>
          )}
          <div style={{ fontSize: 13, color: '#6B7280' }}>
            Date: {new Date(stockCount.created_at).toLocaleDateString()} {new Date(stockCount.created_at).toLocaleTimeString()}
          </div>
        </div>

        {/* Items */}
        <div style={{ padding: '0 20px', paddingBottom: 24 }}>
          {/* Column headers */}
          <div style={{ display: 'flex', padding: '8px 12px', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>
            <span style={{ flex: 1 }}>Item</span>
            <span style={{ width: 60, textAlign: 'center' }}>Expected</span>
            <span style={{ width: 60, textAlign: 'center' }}>Counted</span>
            <span style={{ width: 70, textAlign: 'center' }}>Status</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {items.map((item) => {
              const status = getItemStatus(item.expected_quantity, item.counted_quantity || 0);
              return (
                <div key={item.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 12px',
                  backgroundColor: '#FFF',
                  border: `1px solid ${item.variance && item.variance !== 0 ? '#FDE68A' : '#E5E7EB'}`,
                  borderRadius: 10,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.item_name}
                    </div>
                    {item.bin_code && (
                      <div style={{ fontSize: 11, color: '#6B7280' }}>{item.bin_code}</div>
                    )}
                  </div>
                  <span style={{ width: 60, textAlign: 'center', fontSize: 14, color: '#374151' }}>{item.expected_quantity}</span>
                  <span style={{ width: 60, textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#111827' }}>{item.counted_quantity ?? '—'}</span>
                  <span style={{
                    width: 70,
                    textAlign: 'center',
                    fontSize: 11,
                    fontWeight: 600,
                    color: status.color,
                    backgroundColor: status.bg,
                    padding: '3px 8px',
                    borderRadius: 8,
                  }}>
                    {status.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ========================
  // SCAN MODE
  // ========================
  if (!binData) return null;

  const mergedItems = getMergedItems();
  const totalExpected = binData.items?.length || 0;
  const totalCounted = mergedItems.filter((i) => i.counted_quantity > 0 && !i.unexpected).length;
  const totalVariance = mergedItems.filter((i) => !i.unexpected && i.counted_quantity !== i.expected_quantity).length;
  const unexpectedCount = mergedItems.filter((i) => i.unexpected).length;
  const locationName = (binData as any).locations?.name || '';

  // Saved state
  if (saved) {
    return (
      <div style={{ paddingTop: isDesktop ? 0 : 48, textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>&#10003;</div>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#059669', margin: '0 0 8px' }}>Scan Saved</h2>
        <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 24px' }}>
          {binData.bin_code} — {totalCounted}/{totalExpected} items verified
        </p>
        <button
          onClick={() => navigate(listPath)}
          style={{
            backgroundColor: '#2563EB',
            color: '#FFF',
            border: 'none',
            borderRadius: 10,
            padding: '12px 32px',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Back to Bins
        </button>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: isDesktop ? 0 : 48 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: isDesktop ? '20px 20px 12px' : '0 20px 12px', gap: 12 }}>
        <button onClick={() => navigate(listPath)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#374151', padding: 0 }}>&larr;</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: 0 }}>Scan: {binData.bin_code}</h1>
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
            {locationName && `${locationName} — `}{totalExpected} expected item{totalExpected !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'flex', gap: 8, padding: '0 20px 16px' }}>
        <div style={{ flex: 1, padding: '10px 12px', backgroundColor: '#ECFDF5', borderRadius: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#059669' }}>{totalCounted}</div>
          <div style={{ fontSize: 11, color: '#6B7280' }}>Counted</div>
        </div>
        <div style={{ flex: 1, padding: '10px 12px', backgroundColor: '#EFF6FF', borderRadius: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#2563EB' }}>{totalExpected}</div>
          <div style={{ fontSize: 11, color: '#6B7280' }}>Expected</div>
        </div>
        {totalVariance > 0 && (
          <div style={{ flex: 1, padding: '10px 12px', backgroundColor: '#FFFBEB', borderRadius: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#D97706' }}>{totalVariance}</div>
            <div style={{ fontSize: 11, color: '#6B7280' }}>Variance</div>
          </div>
        )}
        {unexpectedCount > 0 && (
          <div style={{ flex: 1, padding: '10px 12px', backgroundColor: '#FFF7ED', borderRadius: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#EA580C' }}>{unexpectedCount}</div>
            <div style={{ fontSize: 11, color: '#6B7280' }}>Unexpected</div>
          </div>
        )}
      </div>

      {/* Scanner toggle */}
      <div style={{ padding: '0 20px 12px' }}>
        <button
          onClick={() => setScanning(!scanning)}
          style={{
            width: '100%',
            padding: '14px 0',
            backgroundColor: scanning ? '#DC2626' : '#2563EB',
            color: '#FFF',
            border: 'none',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {scanning ? 'Stop Scanning' : 'Start Scanning'}
        </button>
      </div>

      {/* Camera view */}
      {scanning && (
        <div style={{ padding: '0 20px 12px' }}>
          <BarcodeScanner
            isActive={scanning}
            onScan={handleScan}
            onError={(err) => setLastScanResult(`Camera error: ${err}`)}
          />
        </div>
      )}

      {/* Last scan result */}
      {lastScanResult && (
        <div style={{
          margin: '0 20px 12px',
          padding: '10px 14px',
          backgroundColor: '#F0F9FF',
          border: '1px solid #BAE6FD',
          borderRadius: 10,
          fontSize: 13,
          color: '#0369A1',
        }}>
          {lastScanResult}
        </div>
      )}

      {error && (
        <div style={{
          margin: '0 20px 12px',
          padding: '10px 14px',
          backgroundColor: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: 10,
          fontSize: 13,
          color: '#DC2626',
        }}>
          {error}
        </div>
      )}

      {/* Items list */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
          Items in this bin
        </div>

        {/* Column headers */}
        <div style={{ display: 'flex', padding: '6px 12px', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>
          <span style={{ flex: 1 }}>Item</span>
          <span style={{ width: 55, textAlign: 'center' }}>Expected</span>
          <span style={{ width: 70, textAlign: 'center' }}>Counted</span>
          <span style={{ width: 60, textAlign: 'center' }}>Status</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Expected items with scan counts and manual input */}
          {(binData.items || []).map((expectedItem: BinItemStock) => {
            const scanned = scannedItems.find((s) => s.item_id === expectedItem.item_id);
            const scannedQty = scanned?.counted_quantity || 0;
            const manualVal = manualCounts[expectedItem.item_id] || '';
            const manualQty = manualVal !== '' ? Number(manualVal) : 0;
            const totalCounted = scannedQty + manualQty;
            const status = getItemStatus(expectedItem.quantity, totalCounted);

            return (
              <div key={expectedItem.item_id} style={{
                padding: '10px 12px',
                backgroundColor: '#FFF',
                border: `1px solid ${totalCounted !== expectedItem.quantity && totalCounted > 0 ? '#FDE68A' : '#E5E7EB'}`,
                borderRadius: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {expectedItem.item_name}
                    </div>
                    {scannedQty > 0 && (
                      <div style={{ fontSize: 11, color: '#059669' }}>
                        {scannedQty} scanned
                      </div>
                    )}
                  </div>
                  <span style={{ width: 55, textAlign: 'center', fontSize: 14, color: '#374151' }}>
                    {expectedItem.quantity}
                  </span>
                  <div style={{ width: 70, display: 'flex', justifyContent: 'center' }}>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={manualVal}
                      onChange={(e) => setManualCounts((prev) => ({ ...prev, [expectedItem.item_id]: e.target.value }))}
                      placeholder={String(scannedQty || 0)}
                      style={{
                        width: 50,
                        padding: '4px 6px',
                        border: '1px solid #D1D5DB',
                        borderRadius: 6,
                        fontSize: 14,
                        textAlign: 'center',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <span style={{
                    width: 60,
                    textAlign: 'center',
                    fontSize: 11,
                    fontWeight: 600,
                    color: totalCounted > 0 ? status.color : '#9CA3AF',
                    backgroundColor: totalCounted > 0 ? status.bg : '#F9FAFB',
                    padding: '3px 6px',
                    borderRadius: 8,
                  }}>
                    {totalCounted > 0 ? status.label : '—'}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Unexpected scanned items */}
          {scannedItems.filter((s) => s.unexpected).map((item) => (
            <div key={item.item_id} style={{
              padding: '10px 12px',
              backgroundColor: '#FFF7ED',
              border: '1px solid #FDBA74',
              borderRadius: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.item_name}
                  </div>
                  <div style={{ fontSize: 11, color: '#EA580C' }}>Not expected in this bin</div>
                </div>
                <span style={{ width: 55, textAlign: 'center', fontSize: 14, color: '#9CA3AF' }}>0</span>
                <span style={{ width: 70, textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#EA580C' }}>{item.counted_quantity}</span>
                <span style={{
                  width: 60,
                  textAlign: 'center',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#EA580C',
                  backgroundColor: '#FFF7ED',
                  padding: '3px 6px',
                  borderRadius: 8,
                }}>
                  Extra
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save button */}
      <div style={{ padding: '20px 20px 40px' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%',
            padding: '14px 0',
            backgroundColor: saving ? '#9CA3AF' : '#059669',
            color: '#FFF',
            border: 'none',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 600,
            cursor: saving ? 'default' : 'pointer',
          }}
        >
          {saving ? 'Saving...' : 'Save Count'}
        </button>
      </div>
    </div>
  );
}
