import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { putawayService, PutawayStats } from '../../services/putaway.service';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function MobileHomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = location.pathname.startsWith('/items/');
  const prefix = isDesktop ? '/items/stock-count' : '';
  const [stats, setStats] = useState<PutawayStats>({ pending_count: 0, in_progress_count: 0, completed_today: 0, queued_offline: 0 });

  useEffect(() => {
    putawayService.getStats(user?.id).then((res) => {
      if (res.data) setStats(res.data);
    }).catch(() => {});
  }, [user?.id]);

  const metrics = [
    { label: 'Pending Tasks', value: stats.pending_count + stats.in_progress_count, color: '#F59E0B' },
    { label: 'Ready to Place', value: stats.pending_count, color: '#3B82F6' },
    { label: 'Queued Offline', value: stats.queued_offline, color: '#10B981' },
  ];

  const actions = [
    { label: 'Scan & Place', icon: '📷', onClick: () => navigate(`${prefix}/placement/scan`) },
    { label: 'My Tasks', icon: '📋', onClick: () => navigate(isDesktop ? `${prefix}/tasks` : '/stock-counts') },
    { label: 'Item Lookup', icon: '🔍', onClick: () => navigate(`${prefix}/lookup`) },
    { label: 'Transfers', icon: '🚚', onClick: () => navigate(`${prefix}/admin`) },
  ];

  return (
    <div style={{ padding: 20, paddingTop: isDesktop ? 20 : 48 }}>
      {/* Greeting */}
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0, fontStyle: 'italic' }}>
        {getGreeting()}, {user?.employee_name || user?.name || 'User'}
      </h1>
      <p style={{ fontSize: 14, color: '#6B7280', margin: '4px 0 24px 0' }}>
        Here's your inventory overview
      </p>

      {/* Metric Cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
        {metrics.map((m) => (
          <div key={m.label} style={{
            flex: 1,
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: '20px 12px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: '0 0 16px 0' }}>
        Quick Actions
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={a.onClick}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: 12,
              padding: '20px 8px',
              textAlign: 'center',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 28 }}>{a.icon}</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
