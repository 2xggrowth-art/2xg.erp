import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { putawayService, PutawayTask, BinSuggestion } from '../../services/putaway.service';
import apiClient from '../../services/api.client';

interface BinOption {
  id: string;
  bin_code: string;
}

export default function ScanAndPlacePage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = location.pathname.startsWith('/items/');
  const placementPath = isDesktop ? '/items/stock-count/placement' : '/placement';
  const [task, setTask] = useState<PutawayTask | null>(null);
  const [loading, setLoading] = useState(!!taskId);
  const [placing, setPlacing] = useState(false);

  // Scan mode (no taskId)
  const [barcode, setBarcode] = useState('');
  const [searching, setSearching] = useState(false);
  const [scannedItem, setScannedItem] = useState<any>(null);

  // Placement form
  const [selectedBinId, setSelectedBinId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [bins, setBins] = useState<BinOption[]>([]);
  const [suggestion, setSuggestion] = useState<BinSuggestion | null>(null);

  // Load task if taskId provided
  useEffect(() => {
    if (taskId && taskId !== 'scan') {
      putawayService.getById(taskId).then((res) => {
        const t = res.data;
        setTask(t);
        setQuantity(String(t.quantity - t.placed_quantity));
        if (t.suggested_bin_id) {
          setSelectedBinId(t.suggested_bin_id);
          setSuggestion({ bin_id: t.suggested_bin_id, bin_code: t.suggested_bin_code || '', reason: 'Suggested' });
        }
      }).catch(() => {
        navigate(placementPath);
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [taskId, navigate]);

  // Load bins
  useEffect(() => {
    apiClient.get('/bin-locations').then((res) => {
      const list = res.data?.data || [];
      setBins(list.filter((b: any) => b.status === 'active'));
    }).catch(() => {});
  }, []);

  const handleSearch = async () => {
    if (!barcode.trim()) return;
    setSearching(true);
    try {
      const res = await apiClient.get(`/items/barcode/${encodeURIComponent(barcode.trim())}`);
      const item = res.data?.data || res.data;
      setScannedItem(item);

      // Get bin suggestion
      if (item?.id) {
        try {
          const sugRes = await putawayService.suggestBin(item.id);
          if (sugRes.data) {
            setSuggestion(sugRes.data);
            setSelectedBinId(sugRes.data.bin_id);
          }
        } catch {}
      }
    } catch {
      alert('Item not found for this barcode/SKU');
    } finally {
      setSearching(false);
    }
  };

  const handleStartTask = async () => {
    if (!task) return;
    try {
      setPlacing(true);
      const res = await putawayService.startTask(task.id);
      setTask(res.data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to start task');
    } finally {
      setPlacing(false);
    }
  };

  const handlePlace = async () => {
    if (!selectedBinId || !quantity) {
      alert('Please select a bin and enter quantity');
      return;
    }
    if (!task) {
      alert('No task to place');
      return;
    }

    try {
      setPlacing(true);
      await putawayService.placeItem(task.id, { bin_location_id: selectedBinId, quantity: Number(quantity) });
      alert('Item placed successfully!');
      navigate(placementPath);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to place item');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ color: '#6B7280' }}>Loading...</div>
      </div>
    );
  }

  const itemName = task?.item_name || scannedItem?.item_name || scannedItem?.name;
  const itemSku = task?.sku || scannedItem?.sku;
  const serialNumber = task?.serial_number;
  const showPlacementForm = task || scannedItem;

  return (
    <div style={{ paddingTop: isDesktop ? 0 : 48 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: isDesktop ? '20px 20px 16px' : '0 20px 16px', gap: 12 }}>
        <button
          onClick={() => navigate(placementPath)}
          style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#374151', padding: 0 }}
        >
          ←
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: 0 }}>
          {task ? task.task_number : 'Scan & Place'}
        </h1>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Scan Mode: Barcode Input */}
        {!taskId || taskId === 'scan' ? (
          !scannedItem && (
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 14, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 8 }}>
                Scan or enter barcode/SKU
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter barcode or SKU..."
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: '1px solid #D1D5DB',
                    borderRadius: 10,
                    fontSize: 16,
                    outline: 'none',
                  }}
                  autoFocus
                />
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  style={{
                    backgroundColor: '#2563EB',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: 10,
                    padding: '12px 20px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    opacity: searching ? 0.6 : 1,
                  }}
                >
                  {searching ? '...' : 'Search'}
                </button>
              </div>
            </div>
          )
        ) : null}

        {/* Item Info Card */}
        {showPlacementForm && (
          <>
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              border: '1px solid #E5E7EB',
              borderLeft: '4px solid #2563EB',
            }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 4 }}>
                {itemName}
              </div>
              {itemSku && (
                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 2 }}>SKU: {itemSku}</div>
              )}
              {serialNumber && (
                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 2 }}>S/N: {serialNumber}</div>
              )}
              {task && (
                <div style={{ fontSize: 13, color: '#6B7280' }}>
                  Qty: {task.quantity - task.placed_quantity} remaining
                </div>
              )}
            </div>

            {/* Task needs to be started first */}
            {task && task.status === 'pending' && (
              <button
                onClick={handleStartTask}
                disabled={placing}
                style={{
                  width: '100%',
                  backgroundColor: '#2563EB',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginBottom: 16,
                  opacity: placing ? 0.6 : 1,
                }}
              >
                {placing ? 'Starting...' : 'Start Task'}
              </button>
            )}

            {/* Placement Form (only if in_progress) */}
            {(!task || task.status === 'in_progress') && (
              <>
                {/* Suggested Bin */}
                {suggestion && (
                  <div style={{
                    backgroundColor: '#ECFDF5',
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    <span style={{ color: '#10B981', fontWeight: 600 }}>→</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#065F46' }}>
                        Suggested: {suggestion.bin_code}
                      </div>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>{suggestion.reason}</div>
                    </div>
                  </div>
                )}

                {/* Bin Selector */}
                <label style={{ fontSize: 14, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 8 }}>
                  Select Bin Location
                </label>
                <select
                  value={selectedBinId}
                  onChange={(e) => setSelectedBinId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #D1D5DB',
                    borderRadius: 10,
                    fontSize: 16,
                    backgroundColor: '#FFFFFF',
                    marginBottom: 16,
                    outline: 'none',
                  }}
                >
                  <option value="">Choose a bin...</option>
                  {bins.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bin_code} {suggestion?.bin_id === b.id ? '(Suggested)' : ''}
                    </option>
                  ))}
                </select>

                {/* Quantity */}
                <label style={{ fontSize: 14, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 8 }}>
                  Quantity
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #D1D5DB',
                    borderRadius: 10,
                    fontSize: 16,
                    marginBottom: 24,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />

                {/* Place Button */}
                <button
                  onClick={handlePlace}
                  disabled={placing || !selectedBinId}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: 'pointer',
                    opacity: placing || !selectedBinId ? 0.6 : 1,
                  }}
                >
                  {placing ? 'Placing...' : 'Place Item'}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
