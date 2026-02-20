import { ReactNode } from 'react';
import { LogOut, Wrench } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface TechnicianLayoutProps {
  children: ReactNode;
}

const TechnicianLayout = ({ children }: TechnicianLayoutProps) => {
  const { user, logout } = useAuth();

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Minimal header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <Wrench className="text-white" size={18} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900 leading-tight">2XG Buildline</h1>
            <p className="text-xs text-gray-500">{user?.name}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4">
        {children}
      </main>
    </div>
  );
};

export default TechnicianLayout;
