import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import {
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
  ExternalLink,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Package,
  ArrowRightLeft,
  Building2,
  FileEdit,
  CreditCard,
  Wallet,
  BookOpen,
  FileText as Invoice,
  Banknote,
  FilePlus,
  FileCheck,
  Clock,
  Calculator, // Added for the POS icon
  TrendingUp
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const { canAccessModule } = usePermissions();
  const [isItemsOpen, setIsItemsOpen] = useState(false);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isSalesOpen, setIsSalesOpen] = useState(false);
  const [isLogisticsOpen, setIsLogisticsOpen] = useState(false);

  const navItems = [
    { icon: Headphones, label: '2XG CARE', path: '/care', module: 'Tasks' },
    { icon: Receipt, label: 'Expenses', path: '/expenses', module: 'Expenses' },
    { icon: CheckSquare, label: 'Workchat', path: '/tasks', module: 'Workchat' },
    { icon: TrendingUp, label: '2XG Earn', path: '/earn', module: 'Reports' },
    { icon: FileText, label: 'Reports', path: '/reports', module: 'Reports' },
    { icon: Search, label: 'Search', path: '/search', module: 'Reports' },
    { icon: Users, label: 'Sales Pipeline', path: '/crm', module: 'Customers' },
    { icon: Brain, label: 'AI Advanced Reporting', path: '/ai-reporting', module: 'Reports' }
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed lg:sticky lg:top-0 inset-y-0 left-0 z-30
        w-64 bg-slate-800 h-screen text-white flex-shrink-0 flex flex-col
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-700 flex-shrink-0">
          <h1 className="text-2xl font-bold">2XG</h1>
          <p className="text-slate-400 text-sm mt-1">Business Suite</p>
        </div>
        <nav className="mt-6 pb-6 overflow-y-auto flex-1">
          {/* BUILDLINE Section */}
          <div className="mb-6 border-b border-slate-700 pb-6">
            <a
              href="https://docs.google.com/document/d/1_MAorKNpbdesPiKaR1y_sCHRU9yso1ZlBOSUQcxrpwc/edit?pli=1&tab=t.0"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-6 py-3 hover:bg-slate-700 transition-colors border-l-4 border-transparent hover:border-green-500"
            >
              <ExternalLink size={20} />
              <span className="font-medium">BUILDLINE</span>
            </a>
          </div>

          {/* Item with Dropdown */}
          {canAccessModule('Items') && (
            <div>
              <button
                onClick={() => setIsItemsOpen(!isItemsOpen)}
                className={`w-full flex items-center justify-between px-6 py-3 transition-colors border-l-4 ${location.pathname.startsWith('/items')
                  ? 'bg-slate-700 border-blue-500 text-white'
                  : 'border-transparent hover:bg-slate-700 hover:border-blue-500'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Box size={20} />
                  <span className="font-medium">Item</span>
                </div>
                {isItemsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {/* Dropdown Items */}
              {isItemsOpen && (
                <div className="bg-slate-900">
                  <Link
                    to="/items"
                    className="flex items-center gap-3 px-6 py-2 pl-12 hover:bg-slate-700 transition-colors text-sm text-slate-300 hover:text-white"
                  >
                    <Box size={16} />
                    <span>Items</span>
                  </Link>
                  <Link
                    to="/items/new-category"
                    className="flex items-center gap-3 px-6 py-2 pl-12 hover:bg-slate-700 transition-colors text-sm text-slate-300 hover:text-white"
                  >
                    <FolderPlus size={16} />
                    <span>New Category</span>
                  </Link>
                  <Link
                    to="/items/stock-count"
                    className="flex items-center gap-3 px-6 py-2 pl-12 hover:bg-slate-700 transition-colors text-sm text-slate-300 hover:text-white"
                  >
                    <Package size={16} />
                    <span>Stock Count</span>
                  </Link>
                  <Link
                    to="/inventory/transfer-orders"
                    className="flex items-center gap-3 px-6 py-2 pl-12 hover:bg-slate-700 transition-colors text-sm text-slate-300 hover:text-white"
                  >
                    <ArrowRightLeft size={16} />
                    <span>Transfer Order</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Purchase with Dropdown */}
          {canAccessModule('Purchase') && (
            <div>
              <button
                onClick={() => setIsPurchaseOpen(!isPurchaseOpen)}
                className={`w-full flex items-center justify-between px-6 py-3 transition-colors border-l-4 ${location.pathname.startsWith('/purchases')
                  ? 'bg-slate-700 border-blue-500 text-white'
                  : 'border-transparent hover:bg-slate-700 hover:border-blue-500'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <ShoppingCart size={20} />
                  <span className="font-medium">Purchase</span>
                </div>
                {isPurchaseOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {/* Dropdown Items */}
              {isPurchaseOpen && (
                <div className="bg-slate-900">
                  <Link
                    to="/purchases/vendor-management"
                    className="flex items-center gap-3 px-6 py-2 pl-12 hover:bg-slate-700 transition-colors text-sm text-slate-300 hover:text-white"
                  >
                    <Building2 size={16} />
                    <span>Vendor Management</span>
                  </Link>
                  <Link
                    to="/purchases/po"
                    className="flex items-center gap-3 px-6 py-2 pl-12 hover:bg-slate-700 transition-colors text-sm text-slate-300 hover:text-white"
                  >
                    <FileEdit size={16} />
                    <span>PO</span>
                  </Link>
                  <Link
                    to="/purchases/bills"
                    className="flex items-center gap-3 px-6 py-2 pl-12 hover:bg-slate-700 transition-colors text-sm text-slate-300 hover:text-white"
                  >
                    <Receipt size={16} />
                    <span>Bills</span>
                  </Link>
                  <Link
                    to="/purchases/payment-made"
                    className="flex items-center gap-3 px-6 py-2 pl-12 hover:bg-slate-700 transition-colors text-sm text-slate-300 hover:text-white"
                  >
                    <CreditCard size={16} />
                    <span>Payment Made</span>
                  </Link>
                  <Link
                    to="/purchases/vendor-credits"
                    className="flex items-center gap-3 px-6 py-2 pl-12 hover:bg-slate-700 transition-colors text-sm text-slate-300 hover:text-white"
                  >
                    <Wallet size={16} />
                    <span>Vendor Credits</span>
                  </Link>
                  <Link
                    to="/purchases/ledger-account"
                    className="flex items-center gap-3 px-6 py-2 pl-12 hover:bg-slate-700 transition-colors text-sm text-slate-300 hover:text-white"
                  >
                    <BookOpen size={16} />
                    <span>Ledger Account</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Sales with Dropdown */}
          {canAccessModule('Sales') && (
            <div>
              <button
                onClick={() => setIsSalesOpen(!isSalesOpen)}
                className={`w-full flex items-center justify-between px-6 py-3 transition-colors border-l-4 ${location.pathname.startsWith('/sales')
                  ? 'bg-slate-700 border-blue-500 text-white'
                  : 'border-transparent hover:bg-slate-700 hover:border-blue-500'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <DollarSign size={20} />
                  <span className="font-medium">Sales</span>
                </div>
                {isSalesOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {/* Dropdown Items */}
              {isSalesOpen && (
                <div className="bg-slate-900">
                  {/* POS Link Added Below */}
                  <Link
                    to="/sales/pos"
                    className={`flex items-center gap-3 px-6 py-2 pl-12 hover:bg-slate-700 transition-colors text-sm ${location.pathname === '/sales/pos' ? 'text-white' : 'text-slate-300'
                      } hover:text-white`}
                  >
                    <Calculator size={16} />
                    <span>POS</span>
                  </Link>
                  <Link
                    to="/sales/customers"
                    className="flex items-center gap-3 px-6 py-2 pl-12 hover:bg-slate-700 transition-colors text-sm text-slate-300 hover:text-white"
                  >
                    <Users size={16} />
                    <span>Customers</span>
                  </Link>
                  <Link
                    to="/sales/sales-orders"
                    className="flex items-center gap-3 px-6 py-2 pl-12 hover:bg-slate-700 transition-colors text-sm text-slate-300 hover:text-white"
                  >
                    <FileEdit size={16} />
                    <span>Sales Orders</span>
                  </Link>
                  <Link
                    to="/sales/invoices"
                    className="flex items-center gap-3 px-6 py-2 pl-12 hover:bg-slate-700 transition-colors text-sm text-slate-300 hover:text-white"
                  >
                    <Invoice size={16} />
                    <span>Invoices</span>
                  </Link>
                  <Link
                    to="/sales/payment-received"
                    className="flex items-center gap-3 px-6 py-2 pl-12 hover:bg-slate-700 transition-colors text-sm text-slate-300 hover:text-white"
                  >
                    <Banknote size={16} />
                    <span>Payment Received</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* 2XG Logistics with Dropdown */}
          {canAccessModule('Logistics') && (
            <div>
              <button
                onClick={() => setIsLogisticsOpen(!isLogisticsOpen)}
                className={`w-full flex items-center justify-between px-6 py-3 transition-colors border-l-4 ${location.pathname.startsWith('/logistics')
                  ? 'bg-slate-700 border-blue-500 text-white'
                  : 'border-transparent hover:bg-slate-700 hover:border-blue-500'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Truck size={20} />
                  <span className="font-medium">2XG Logistics</span>
                </div>
                {isLogisticsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {/* Dropdown Items */}
              {isLogisticsOpen && (
                <div className="bg-slate-900">
                  <Link
                    to="/logistics/create-delivery-challan"
                    className="flex items-center gap-3 px-6 py-2 pl-12 hover:bg-slate-700 transition-colors text-sm text-slate-300 hover:text-white"
                  >
                    <FilePlus size={16} />
                    <span>Create Delivery Challan</span>
                  </Link>
                  <Link
                    to="/logistics/delivery-challan"
                    className="flex items-center gap-3 px-6 py-2 pl-12 hover:bg-slate-700 transition-colors text-sm text-slate-300 hover:text-white"
                  >
                    <FileCheck size={16} />
                    <span>Delivery Challan</span>
                  </Link>
                  <Link
                    to="/logistics/pending-delivery"
                    className="flex items-center gap-3 px-6 py-2 pl-12 hover:bg-slate-700 transition-colors text-sm text-slate-300 hover:text-white"
                  >
                    <Clock size={16} />
                    <span>Pending Delivery</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Other Navigation Items */}
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            // Only show if user has access to the module
            if (!canAccessModule(item.module)) return null;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-6 py-3 transition-colors border-l-4 ${isActive
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
    </>
  );
};

export default Sidebar;