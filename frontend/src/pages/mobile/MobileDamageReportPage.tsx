import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { damageReportsService, DamageReport } from '../../services/damageReports.service';
import apiClient from '../../services/api.client';

const DAMAGE_TYPES = [
  { value: 'broken', label: 'Broken', color: '#DC2626' },
  { value: 'water_damage', label: 'Water Damage', color: '#2563EB' },
  { value: 'expired', label: 'Expired', color: '#D97706' },
  { value: 'other', label: 'Other', color: '#6B7280' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  reported: { bg: '#FEF3C7', text: '#D97706' },
  reviewed: { bg: '#DBEAFE', text: '#2563EB' },
  written_off: { bg: '#FEE2E2', text: '#DC2626' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function MobileDamageReportPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = location.pathname.startsWith('/items/');
  const [reports, setReports] = useState<DamageReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [quantity, setQuantity] = useState('1');
  const [damageType, setDamageType] = useState('broken');
  const [description, setDescription] = useState('');

  const fetchReports = async () => {
    try {
      const data = await damageReportsService.getAll();
      setReports(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleSearchItem = async () => {
    if (searchQuery.trim().length < 2) return;
    try {
      const res = await apiClient.get(`/items/barcode/${encodeURIComponent(searchQuery.trim())}`);
      const item = res.data?.data || res.data;
      setSelectedItem(item);
    } catch {
      alert('Item not found');
    }
  };

  const handleSubmitReport = async () => {
    if (!selectedItem || !quantity) {
      alert('Please select an item and enter quantity');
      return;
    }
    try {
      setSubmitting(true);
      await damageReportsService.create({
        item_id: selectedItem.id,
        item_name: selectedItem.item_name || selectedItem.name,
        quantity: Number(quantity),
        damage_type: damageType,
        description: description || undefined,
      });
      alert('Damage report created!');
      setShowForm(false);
      setSelectedItem(null);
      setSearchQuery('');
      setQuantity('1');
      setDamageType('broken');
      setDescription('');
      fetchReports();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create report');
    } finally {
      setSubmitting(false);
    }
  };

  const formatStatus = (status: string) =>
    status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const reportedCount = reports.filter((r) => r.status === 'reported').length;
  const writtenOffCount = reports.filter((r) => r.status === 'written_off').length;

  return (
    <div style={{ paddingTop: isDesktop ? 0 : 48 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: isDesktop ? '20px 20px 16px' : '0 20px 16px', gap: 12 }}>
        <button
          onClick={() => navigate(isDesktop ? '/items/stock-count' : '/home')}
          style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#374151', padding: 0 }}
        >
          &larr;
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#111827', margin: 0 }}>Damage Reports</h1>
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>{reports.length} reports</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, padding: '0 20px', marginBottom: 20 }}>
        <div style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: '20px 16px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#F59E0B' }}>{reportedCount}</div>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Reported</div>
        </div>
        <div style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: '20px 16px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#DC2626' }}>{writtenOffCount}</div>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Written Off</div>
        </div>
      </div>

      {/* Report Damage Button */}
      <div style={{ padding: '0 20px', marginBottom: 24 }}>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            width: '100%',
            background: showForm ? '#F3F4F6' : 'linear-gradient(135deg, #DC2626, #B91C1C)',
            color: showForm ? '#374151' : '#FFFFFF',
            border: 'none',
            borderRadius: 12,
            padding: '14px 20px',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {showForm ? 'Cancel' : 'Report Damage'}
        </button>
      </div>

      {/* New Report Form */}
      {showForm && (
        <div style={{ padding: '0 20px', marginBottom: 24 }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, border: '1px solid #E5E7EB' }}>
            {/* Item Search */}
            {!selectedItem ? (
              <>
                <label style={{ fontSize: 14, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 8 }}>
                  Search Item (SKU / barcode)
                </label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchItem()}
                    placeholder="Enter SKU or barcode..."
                    style={{ flex: 1, padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 15, outline: 'none' }}
                    autoFocus
                  />
                  <button
                    onClick={handleSearchItem}
                    style={{ backgroundColor: '#2563EB', color: '#FFF', border: 'none', borderRadius: 10, padding: '12px 20px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Find
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Selected Item */}
                <div style={{ backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, marginBottom: 16, borderLeft: '4px solid #DC2626' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{selectedItem.item_name || selectedItem.name}</div>
                      <div style={{ fontSize: 13, color: '#6B7280' }}>SKU: {selectedItem.sku || '—'}</div>
                      <div style={{ fontSize: 13, color: '#6B7280' }}>Stock: {selectedItem.current_stock || 0}</div>
                    </div>
                    <button
                      onClick={() => { setSelectedItem(null); setSearchQuery(''); }}
                      style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: 16 }}
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Damage Type */}
                <label style={{ fontSize: 14, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 8 }}>
                  Damage Type
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  {DAMAGE_TYPES.map((dt) => (
                    <button
                      key={dt.value}
                      onClick={() => setDamageType(dt.value)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 20,
                        border: damageType === dt.value ? `2px solid ${dt.color}` : '1px solid #D1D5DB',
                        backgroundColor: damageType === dt.value ? `${dt.color}15` : '#FFFFFF',
                        color: damageType === dt.value ? dt.color : '#6B7280',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      {dt.label}
                    </button>
                  ))}
                </div>

                {/* Quantity */}
                <label style={{ fontSize: 14, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 8 }}>
                  Quantity Damaged
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  style={{ width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 16, marginBottom: 16, outline: 'none', boxSizing: 'border-box' }}
                />

                {/* Description */}
                <label style={{ fontSize: 14, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 8 }}>
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the damage..."
                  rows={3}
                  style={{ width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 15, resize: 'none', marginBottom: 16, outline: 'none', boxSizing: 'border-box' }}
                />

                {/* Submit */}
                <button
                  onClick={handleSubmitReport}
                  disabled={submitting}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #DC2626, #B91C1C)',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: 'pointer',
                    opacity: submitting ? 0.6 : 1,
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Reports List */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>Recent Reports</h2>
          <button
            onClick={fetchReports}
            style={{ background: 'none', border: 'none', color: '#3B82F6', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Loading...</div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#374151' }}>No Damage Reports</div>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>All items in good condition</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 20 }}>
            {reports.map((report) => {
              const colors = STATUS_COLORS[report.status] || STATUS_COLORS.reported;
              const damageLabel = DAMAGE_TYPES.find((d) => d.value === report.damage_type)?.label || report.damage_type;
              return (
                <div
                  key={report.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: '#3B82F6', fontWeight: 500 }}>{report.report_number}</span>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: colors.text,
                      backgroundColor: colors.bg,
                      padding: '3px 10px',
                      borderRadius: 12,
                    }}>
                      {formatStatus(report.status)}
                    </span>
                  </div>

                  <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 4 }}>
                    {report.item_name}
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#6B7280', marginBottom: 4 }}>
                    <span>Qty: {report.quantity}</span>
                    <span>Type: {damageLabel}</span>
                  </div>
                  {report.description && (
                    <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>{report.description}</div>
                  )}
                  <div style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'right' }}>
                    {timeAgo(report.created_at)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
