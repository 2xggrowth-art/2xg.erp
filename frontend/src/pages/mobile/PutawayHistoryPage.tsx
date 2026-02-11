import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { putawayService, PutawayTask } from '../../services/putaway.service';

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

export default function PutawayHistoryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = location.pathname.startsWith('/items/');
  const placementPath = isDesktop ? '/items/stock-count/placement' : '/placement';
  const [tasks, setTasks] = useState<PutawayTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    putawayService.getHistory(50).then((res) => {
      if (res.data) setTasks(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

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
        <h1 style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: 0 }}>Putaway History</h1>
      </div>

      <div style={{ padding: '0 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Loading...</div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#374151' }}>No History</div>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>Completed putaway tasks will appear here</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 20 }}>
            {tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: '#059669', fontWeight: 500 }}>{task.task_number}</span>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#059669',
                    backgroundColor: '#D1FAE5',
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}>
                    COMPLETED
                  </span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 4 }}>
                  {task.sku || task.item_name}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {task.actual_bin_code && (
                    <span style={{ fontSize: 13, color: '#2563EB', fontWeight: 500 }}>
                      → {task.actual_bin_code}
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 'auto' }}>
                    {task.completed_at ? timeAgo(task.completed_at) : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
