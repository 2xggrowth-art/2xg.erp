import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { transferOrdersService, TransferOrder } from '../../services/transfer-orders.service';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft: { bg: '#F3F4F6', text: '#6B7280' },
  initiated: { bg: '#DBEAFE', text: '#2563EB' },
  in_transit: { bg: '#FEF3C7', text: '#D97706' },
  received: { bg: '#D1FAE5', text: '#059669' },
  cancelled: { bg: '#FEE2E2', text: '#DC2626' },
};

const STATUS_TABS = ['', 'draft', 'initiated', 'in_transit', 'received'];
const STATUS_LABELS: Record<string, string> = {
  '': 'All',
  draft: 'Draft',
  initiated: 'Initiated',
  in_transit: 'In Transit',
  received: 'Received',
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

export default function MobileTransfersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = location.pathname.startsWith('/items/');
  const [transfers, setTransfers] = useState<TransferOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchTransfers = useCallback(async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (statusFilter) filters.status = statusFilter;
      const res = await transferOrdersService.getAllTransferOrders(filters);
      setTransfers(res.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  const formatStatus = (status: string) =>
    status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const activeCount = transfers.filter((t) => t.status === 'initiated' || t.status === 'in_transit').length;

  return (
    <div style={{ paddingTop: isDesktop ? 0 : 48 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: isDesktop ? '20px 20px 12px' : '0 20px 12px', gap: 12 }}>
        <button
          onClick={() => navigate(isDesktop ? '/items/stock-count' : '/home')}
          style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#374151', padding: 0 }}
        >
          &larr;
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#111827', margin: 0 }}>Transfers</h1>
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>{activeCount} active</p>
        </div>
      </div>

      {/* Status Tabs */}
      <div style={{
        display: 'flex',
        gap: 6,
        padding: '0 20px 16px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: 'none',
              fontSize: 13,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              backgroundColor: statusFilter === tab ? '#2563EB' : '#F3F4F6',
              color: statusFilter === tab ? '#FFFFFF' : '#6B7280',
            }}
          >
            {STATUS_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '0 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Loading...</div>
        ) : transfers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🚚</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#374151' }}>No Transfers</div>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>
              {statusFilter ? `No ${formatStatus(statusFilter)} transfers` : 'No transfer orders yet'}
            </div>
            <button
              onClick={fetchTransfers}
              style={{
                marginTop: 16,
                padding: '10px 24px',
                backgroundColor: '#2563EB',
                color: '#FFF',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Refresh
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 20 }}>
            {transfers.map((to) => {
              const colors = STATUS_COLORS[to.status] || STATUS_COLORS.draft;

              return (
                <div
                  key={to.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  {/* Header row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#2563EB' }}>
                      {to.transfer_order_number}
                    </span>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: colors.text,
                      backgroundColor: colors.bg,
                      padding: '3px 10px',
                      borderRadius: 12,
                    }}>
                      {formatStatus(to.status)}
                    </span>
                  </div>

                  {/* Route */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>{to.source_location}</span>
                    <span style={{ color: '#9CA3AF' }}>&rarr;</span>
                    <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>{to.destination_location}</span>
                  </div>

                  {/* Reason */}
                  {to.reason && (
                    <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>
                      {to.reason}
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>
                      {to.total_items} items &middot; {to.total_quantity} units
                    </span>
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                      {timeAgo(to.created_at)}
                    </span>
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
