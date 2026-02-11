import { useAuth } from '../../contexts/AuthContext';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  const initials = (user?.employee_name || user?.name || 'U')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <div style={{ paddingTop: 48 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', padding: '0 20px 20px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#111827', margin: 0 }}>Profile</h1>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Avatar + Info */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: '#EFF6FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            fontSize: 28,
            fontWeight: 700,
            color: '#2563EB',
          }}>
            {initials}
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#111827' }}>
            {user?.employee_name || user?.name || 'User'}
          </div>
          {user?.email && (
            <div style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>{user.email}</div>
          )}
          {user?.role && (
            <div style={{
              display: 'inline-block',
              marginTop: 8,
              padding: '4px 12px',
              backgroundColor: '#DBEAFE',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 500,
              color: '#1D4ED8',
            }}>
              {user.role}
            </div>
          )}
        </div>

        {/* Info Rows */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          overflow: 'hidden',
          marginBottom: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          {[
            { label: 'Name', value: user?.employee_name || user?.name },
            { label: 'Email', value: user?.email },
            { label: 'Role', value: user?.role },
            { label: 'Branch', value: user?.branch },
          ].filter(r => r.value).map((row, idx) => (
            <div key={row.label} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderBottom: idx < 3 ? '1px solid #F3F4F6' : 'none',
            }}>
              <span style={{ fontSize: 14, color: '#6B7280' }}>{row.label}</span>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            backgroundColor: '#FEE2E2',
            color: '#DC2626',
            border: 'none',
            borderRadius: 12,
            padding: 16,
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Logout
        </button>

        {/* Version */}
        <div style={{ textAlign: 'center', marginTop: 32, fontSize: 12, color: '#9CA3AF' }}>
          2XG ERP Mobile v1.0
        </div>
      </div>
    </div>
  );
}
