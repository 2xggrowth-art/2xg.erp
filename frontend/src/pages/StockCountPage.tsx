import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { stockCountService, StockCount } from '../services/stockCount.service';

const statusColors: Record<string, { bg: string; text: string }> = {
  draft: { bg: '#F3F4F6', text: '#6B7280' },
  in_progress: { bg: '#DBEAFE', text: '#2563EB' },
  submitted: { bg: '#FEF3C7', text: '#D97706' },
  approved: { bg: '#D1FAE5', text: '#059669' },
  rejected: { bg: '#FEE2E2', text: '#DC2626' },
};

const STATUS_TABS = ['', 'draft', 'in_progress', 'submitted', 'approved', 'rejected'];
const STATUS_LABELS: Record<string, string> = {
  '': 'All',
  draft: 'Draft',
  in_progress: 'Active',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
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

export default function StockCountPage() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState<StockCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchCounts = useCallback(async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (statusFilter) filters.status = statusFilter;
      const data = await stockCountService.getAllStockCounts(filters);
      setCounts(data);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const formatStatus = (status: string) =>
    status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const totalActive = counts.filter((c) => c.status === 'draft' || c.status === 'in_progress').length;
  const totalSubmitted = counts.filter((c) => c.status === 'submitted').length;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Stock Counts</h1>
          <p style={{ fontSize: 14, color: '#6B7280', margin: '4px 0 0 0' }}>
            {totalActive} active · {totalSubmitted} awaiting review
          </p>
        </div>
        <button
          onClick={() => navigate('/items/stock-count/new')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 24px',
            backgroundColor: '#2563EB',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
          }}
        >
          <Plus size={20} />
          New Stock Count
        </button>
      </div>

      {/* Status Tabs */}
      <div style={{
        display: 'flex',
        gap: 6,
        marginBottom: 20,
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch' as any,
      }}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            style={{
              padding: '8px 16px',
              borderRadius: 20,
              border: 'none',
              fontSize: 13,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              backgroundColor: statusFilter === tab ? '#2563EB' : '#F3F4F6',
              color: statusFilter === tab ? '#FFFFFF' : '#6B7280',
              transition: 'all 0.2s',
            }}
          >
            {STATUS_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>Loading stock counts...</div>
      ) : counts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, backgroundColor: '#FFFFFF', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
            {statusFilter ? `No ${formatStatus(statusFilter)} stock counts` : 'No Stock Counts Yet'}
          </div>
          <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 20 }}>
            Create your first stock count to start tracking inventory.
          </p>
          {!statusFilter && (
            <button
              onClick={() => navigate('/items/stock-count/new')}
              style={{ padding: '12px 32px', backgroundColor: '#2563EB', color: '#FFF', border: 'none', borderRadius: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              New Stock Count
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {counts.map((sc) => {
            const colors = statusColors[sc.status] || statusColors.draft;
            const itemCount = sc.items?.length || 0;
            const countedCount = sc.items?.filter(
              (i) => i.counted_quantity !== null && i.counted_quantity !== undefined
            ).length || 0;

            return (
              <div
                key={sc.id}
                onClick={() => navigate(`/items/stock-count/${sc.id}`)}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: 16,
                  padding: 20,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#2563EB' }}>
                    {sc.stock_count_number}
                  </span>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: colors.text,
                    backgroundColor: colors.bg,
                    padding: '4px 12px',
                    borderRadius: 20,
                  }}>
                    {formatStatus(sc.status)}
                  </span>
                </div>

                {/* Description */}
                {sc.description && (
                  <div style={{ fontSize: 15, color: '#374151', marginBottom: 8, fontWeight: 500 }}>
                    {sc.description}
                  </div>
                )}

                {/* Info row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: '#6B7280', marginBottom: 12 }}>
                  {sc.location_name && <span>📍 {sc.location_name}</span>}
                  {sc.assigned_to_name && <span>👤 {sc.assigned_to_name}</span>}
                  <span>📦 {itemCount} items</span>
                </div>

                {/* Progress bar + footer */}
                {itemCount > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: '#6B7280' }}>
                        {countedCount}/{itemCount} items counted
                      </span>
                      <span style={{ fontSize: 12, color: '#6B7280' }}>
                        {Math.round((countedCount / itemCount) * 100)}%
                      </span>
                    </div>
                    <div style={{ height: 5, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${(countedCount / itemCount) * 100}%`,
                        backgroundColor: countedCount === itemCount ? '#10B981' : '#3B82F6',
                        borderRadius: 3,
                        transition: 'width 0.3s',
                      }} />
                    </div>
                  </div>
                )}

                {/* Time */}
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>{timeAgo(sc.created_at)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
