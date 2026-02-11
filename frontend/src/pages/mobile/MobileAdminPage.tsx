import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { putawayService, AdminStats } from '../../services/putaway.service';

export default function MobileAdminPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = location.pathname.startsWith('/items/');
  const prefix = isDesktop ? '/items/stock-count' : '';
  const [stats, setStats] = useState<AdminStats>({
    total_bins: 0,
    total_items: 0,
    utilization_pct: 0,
    total_capacity: 0,
    pending_placements: 0,
    pending_stock_counts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    putawayService.getAdminStats().then((res) => {
      if (res.data) setStats(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const overviewCards = [
    { label: 'Total Bins', value: stats.total_bins, icon: '📦' },
    { label: 'Total Items', value: stats.total_items, icon: '📊' },
    { label: 'Utilization', value: `${stats.utilization_pct}%`, icon: '📈' },
    { label: 'Total Capacity', value: stats.total_capacity, icon: '📋' },
  ];

  const pendingTasks = [
    { label: 'Pending Placements', count: stats.pending_placements, icon: '📦', onClick: () => navigate(`${prefix}/placement`) },
    { label: 'Pending Transfers', count: stats.pending_stock_counts, icon: '🚚', onClick: () => navigate(isDesktop ? `${prefix}/tasks` : '/stock-counts') },
  ];

  return (
    <div style={{ paddingTop: isDesktop ? 0 : 48 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: isDesktop ? '20px 20px 20px' : '0 20px 20px', gap: 12 }}>
        <button
          onClick={() => navigate(isDesktop ? '/items/stock-count' : '/home')}
          style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#374151', padding: 0 }}
        >
          ←
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: 0, flex: 1, textAlign: 'center' }}>
          Admin Dashboard
        </h1>
        <div style={{ width: 28 }} />
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Overview Section */}
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: '0 0 16px 0' }}>Overview</h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Loading...</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
              {overviewCards.map((card) => (
                <div key={card.label} style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  padding: 20,
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{card.icon}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>{card.value}</div>
                  <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{card.label}</div>
                </div>
              ))}
            </div>

            {/* Pending Tasks */}
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: '0 0 16px 0' }}>Pending Tasks</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pendingTasks.map((task) => (
                <button
                  key={task.label}
                  onClick={task.onClick}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: 12,
                    padding: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  <span style={{ fontSize: 28 }}>{task.icon}</span>
                  <span style={{ fontSize: 15, fontWeight: 500, color: '#374151', flex: 1 }}>
                    {task.label}
                  </span>
                  {task.count > 0 && (
                    <span style={{
                      backgroundColor: '#EF4444',
                      color: '#FFF',
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 10,
                      minWidth: 20,
                      textAlign: 'center',
                    }}>
                      {task.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
