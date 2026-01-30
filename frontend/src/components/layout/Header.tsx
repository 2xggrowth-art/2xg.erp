import { Search, Bell, Settings, LogOut, ChevronDown, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';

interface HeaderProps {
  onMenuClick?: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b px-6 py-4 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        {/* Mobile menu button */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 mr-2 hover:bg-gray-100 rounded-full transition"
            aria-label="Open menu"
          >
            <Menu size={24} className="text-gray-600" />
          </button>
        )}

        {/* Search Bar */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder='Search in Customers ( / )'
              className="w-full pl-10 pr-16 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded text-gray-600">
              /
            </kbd>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4 ml-6">
          {/* Notification Bell */}
          <button className="relative p-2 hover:bg-gray-100 rounded-full transition">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Settings */}
          <button
            onClick={() => navigate('/settings')}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            title="Settings"
          >
            <Settings size={20} className="text-gray-600" />
          </button>

          {/* User Profile with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-3 py-2 transition"
            >
              <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.name.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-700 text-sm">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500">{user?.role || 'Role'}</p>
              </div>
              <ChevronDown size={16} className="text-gray-500" />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                ></div>

                {/* Menu */}
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                  >
                    <Settings size={16} />
                    Settings
                  </button>

                  <div className="border-t border-gray-200 my-2"></div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
