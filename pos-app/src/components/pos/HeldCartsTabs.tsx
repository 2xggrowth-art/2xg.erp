import React from 'react';
import { Plus, ShoppingCart, X, Clock, FileText, RotateCcw, BarChart3 } from 'lucide-react';
import { PosSession } from '../../services/pos-sessions.service';
import { CartItem, HeldCart, TabType } from './posTypes';
import SessionBar from './SessionBar';
import SyncStatusIndicator from './SyncStatusIndicator';

interface HeldCartsTabsProps {
  activeTab: TabType;
  activeHeldCartId: string | null;
  heldCarts: HeldCart[];
  cart: CartItem[];
  activeSession: PosSession | null;
  onTabChange: (tab: TabType) => void;
  onRecallCart: (cart: HeldCart) => void;
  onDeleteHeldCart: (id: string) => void;
  // SessionBar props
  onCashIn: () => void;
  onCashOut: () => void;
  onEndSession: () => void;
  onStartSession: () => void;
  formatCurrency: (amount: number) => string;
}

const HeldCartsTabs: React.FC<HeldCartsTabsProps> = ({
  activeTab,
  activeHeldCartId,
  heldCarts,
  cart,
  activeSession,
  onTabChange,
  onRecallCart,
  onDeleteHeldCart,
  onCashIn,
  onCashOut,
  onEndSession,
  onStartSession,
  formatCurrency,
}) => {
  return (
    <div className="flex bg-gray-100 dark:bg-gray-900 text-xs border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
      {/* Current Active Tab */}
      <div
        className={`px-4 py-2.5 flex items-center gap-2 cursor-pointer ${
          activeTab === 'newsale' && !activeHeldCartId
            ? 'bg-white dark:bg-gray-800 border-t-2 border-blue-500'
            : 'border-r border-gray-200 dark:border-gray-700'
        }`}
        onClick={() => onTabChange('newsale')}
      >
        <Plus
          size={12}
          className={
            activeTab === 'newsale' && !activeHeldCartId
              ? 'text-blue-500 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400'
          }
        />
        <span
          className={
            activeTab === 'newsale' && !activeHeldCartId
              ? 'font-medium text-gray-800 dark:text-gray-200'
              : 'text-gray-600 dark:text-gray-400'
          }
        >
          Sale
        </span>
        {activeTab === 'newsale' && !activeHeldCartId && cart.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white rounded-full text-[10px]">
            {cart.length}
          </span>
        )}
      </div>

      {/* Held Cart Tabs */}
      {heldCarts.map((heldCart) => (
        <div
          key={heldCart.id}
          onClick={() => onRecallCart(heldCart)}
          className={`px-4 py-2.5 flex items-center gap-2 border-r border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-white dark:hover:bg-gray-800 transition-colors ${
            activeHeldCartId === heldCart.id
              ? 'bg-white dark:bg-gray-800 border-t-2 border-blue-500'
              : 'opacity-60 hover:opacity-100'
          }`}
        >
          <ShoppingCart size={12} className="text-gray-500 dark:text-gray-400" />
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {heldCart.customer?.customer_name || 'Guest'} ({heldCart.items.length})
          </span>
          <X
            size={12}
            className="ml-1 cursor-pointer hover:text-red-500 dark:hover:text-red-400 text-gray-500 dark:text-gray-400"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteHeldCart(heldCart.id);
            }}
          />
        </div>
      ))}

      {/* Sessions Tab */}
      <div
        onClick={() => onTabChange('sessions')}
        className={`px-4 py-2.5 flex items-center gap-2 border-r border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-white dark:hover:bg-gray-800 transition-colors ${
          activeTab === 'sessions'
            ? 'bg-white dark:bg-gray-800 border-t-2 border-blue-500'
            : 'opacity-60 hover:opacity-100'
        }`}
      >
        <Clock size={12} className="text-gray-500 dark:text-gray-400" />
        <span className="font-medium text-gray-700 dark:text-gray-300">Sessions</span>
      </div>

      {/* Invoices Tab */}
      <div
        onClick={() => onTabChange('invoices')}
        className={`px-4 py-2.5 flex items-center gap-2 border-r border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-white dark:hover:bg-gray-800 transition-colors ${
          activeTab === 'invoices'
            ? 'bg-white dark:bg-gray-800 border-t-2 border-blue-500'
            : 'opacity-60 hover:opacity-100'
        }`}
      >
        <FileText size={12} className="text-gray-500 dark:text-gray-400" />
        <span className="font-medium text-gray-700 dark:text-gray-300">Invoices</span>
      </div>

      {/* Returns Tab */}
      <div
        onClick={() => onTabChange('returns')}
        className={`px-4 py-2.5 flex items-center gap-2 border-r border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-white dark:hover:bg-gray-800 transition-colors ${
          activeTab === 'returns'
            ? 'bg-white dark:bg-gray-800 border-t-2 border-blue-500'
            : 'opacity-60 hover:opacity-100'
        }`}
      >
        <RotateCcw size={12} className="text-gray-500 dark:text-gray-400" />
        <span className="font-medium text-gray-700 dark:text-gray-300">Returns</span>
      </div>

      {/* Session Detail Tab */}
      <div
        onClick={() => onTabChange('session-detail')}
        className={`px-4 py-2.5 flex items-center gap-2 border-r border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-white dark:hover:bg-gray-800 transition-colors ${
          activeTab === 'session-detail'
            ? 'bg-white dark:bg-gray-800 border-t-2 border-blue-500'
            : 'opacity-60 hover:opacity-100'
        }`}
      >
        <BarChart3 size={12} className="text-gray-500 dark:text-gray-400" />
        <span className="font-medium text-gray-700 dark:text-gray-300">Session</span>
      </div>

      {/* Sync Status Indicator */}
      <SyncStatusIndicator />

      {/* Session Status Indicator */}
      <SessionBar
        activeSession={activeSession}
        onCashIn={onCashIn}
        onCashOut={onCashOut}
        onEndSession={onEndSession}
        onStartSession={onStartSession}
        formatCurrency={formatCurrency}
      />
    </div>
  );
};

export default HeldCartsTabs;
