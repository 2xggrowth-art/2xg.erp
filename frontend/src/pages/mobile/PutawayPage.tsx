import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { putawayService, PutawayTask, PutawayStats } from '../../services/putaway.service';

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

export default function PutawayPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = location.pathname.startsWith('/items/');
  const prefix = isDesktop ? '/items/stock-count/placement' : '/placement';
  const [stats, setStats] = useState<PutawayStats>({ pending_count: 0, in_progress_count: 0, completed_today: 0, queued_offline: 0 });
  const [tasks, setTasks] = useState<PutawayTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, tasksRes] = await Promise.all([
        putawayService.getStats(user?.id),
        putawayService.getPending(user?.id),
      ]);
      if (statsRes.data) setStats(statsRes.data);
      if (tasksRes.data) setTasks(tasksRes.data);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalTasks = stats.pending_count + stats.in_progress_count;

  return (
    <div style={{ paddingTop: isDesktop ? 0 : 48 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', padding: isDesktop ? '20px 20px 20px' : '0 20px 20px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#111827', margin: 0 }}>Putaway</h1>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0 0' }}>{totalTasks} tasks</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'flex', gap: 12, padding: '0 20px', marginBottom: 20 }}>
        <div style={{
          flex: 1,
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          padding: '20px 16px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#F59E0B' }}>{stats.pending_count}</div>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Pending</div>
        </div>
        <div style={{
          flex: 1,
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          padding: '20px 16px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#3B82F6' }}>{stats.in_progress_count}</div>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>In Progress</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12, padding: '0 20px', marginBottom: 24 }}>
        <button
          onClick={() => navigate(`${prefix}/scan`)}
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 12,
            padding: '14px 20px',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Scan & Place
        </button>
        <button
          onClick={() => navigate(`${prefix}/history`)}
          style={{
            backgroundColor: '#FFFFFF',
            color: '#374151',
            border: '1px solid #D1D5DB',
            borderRadius: 12,
            padding: '14px 20px',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          History
        </button>
      </div>

      {/* Pending Tasks */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>Pending Tasks</h2>
          <button
            onClick={fetchData}
            style={{ background: 'none', border: 'none', color: '#3B82F6', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Loading...</div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#374151' }}>All Clear!</div>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>No pending putaway tasks</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 20 }}>
            {tasks.map((task) => (
              <button
                key={task.id}
                onClick={() => navigate(`${prefix}/${task.id}`)}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: 12,
                  padding: 16,
                  textAlign: 'left',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                {/* Task Number + Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: '#3B82F6', fontWeight: 500 }}>{task.task_number}</span>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#F59E0B',
                    backgroundColor: '#FEF3C7',
                    padding: '2px 8px',
                    borderRadius: 4,
                    textTransform: 'uppercase',
                  }}>
                    {task.status === 'pending' ? 'SUGGESTED' : task.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                {/* Item Info */}
                <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 4 }}>
                  {task.sku || task.item_name}
                </div>
                {task.serial_number && (
                  <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>
                    S/N: {task.serial_number}
                  </div>
                )}

                {/* Suggested Bin + Time */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {task.suggested_bin_code && (
                    <span style={{ fontSize: 13, color: '#10B981', fontWeight: 500 }}>
                      → {task.suggested_bin_code}
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 'auto' }}>
                    {timeAgo(task.created_at)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
