import { Link, useLocation } from 'react-router-dom';
import {
  Package,
  Truck,
  Headphones,
  Users,
  Box,
  ShoppingCart,
  DollarSign,
  Receipt,
  CheckSquare,
  FileText,
  Search,
  Brain,
  LayoutDashboard
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Package, label: 'ERP Section', path: '/erp' },
    { icon: Truck, label: '2XG Logistics', path: '/logistics' },
    { icon: Headphones, label: '2XG CARE', path: '/care' },
    { icon: Users, label: 'Sales Pipeline', path: '/crm' },
    { icon: Box, label: 'Item', path: '/items' },
    { icon: ShoppingCart, label: 'Purchase', path: '/purchases' },
    { icon: DollarSign, label: 'Sales', path: '/sales' },
    { icon: Receipt, label: 'Expenses', path: '/expenses' },
    { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
    { icon: FileText, label: 'Reports', path: '/reports' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: Brain, label: 'AI Advanced Reporting', path: '/ai-reporting' }
  ];

  return (
    <aside className="w-64 bg-slate-800 min-h-screen text-white flex-shrink-0 overflow-y-auto">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold">2XG Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Business Suite</p>
      </div>
      <nav className="mt-6 pb-6">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-6 py-3 transition-colors border-l-4 ${
                isActive
                  ? 'bg-slate-700 border-blue-500 text-white'
                  : 'border-transparent hover:bg-slate-700 hover:border-blue-500'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
