import React from 'react';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { PosSession } from '../../services/pos-sessions.service';

interface SessionBarProps {
  activeSession: PosSession | null;
  onCashIn: () => void;
  onCashOut: () => void;
  onEndSession: () => void;
  onStartSession: () => void;
  formatCurrency: (amount: number) => string;
}

const SessionBar: React.FC<SessionBarProps> = ({
  activeSession,
  onCashIn,
  onCashOut,
  onEndSession,
  onStartSession,
}) => {
  return (
    <div className="ml-auto flex items-center gap-2 px-4">
      {activeSession ? (
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-xs text-green-700 font-medium">
            Session: {activeSession.session_number}
          </span>
          <button
            onClick={onCashIn}
            className="ml-2 px-2 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors flex items-center gap-1"
          >
            <ArrowDownCircle size={12} />
            Cash In
          </button>
          <button
            onClick={onCashOut}
            className="px-2 py-1 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded hover:bg-orange-100 transition-colors flex items-center gap-1"
          >
            <ArrowUpCircle size={12} />
            Cash Out
          </button>
          <button
            onClick={onEndSession}
            className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
          >
            End Session
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
          <span className="text-xs text-red-700 font-medium">No Active Session</span>
          <button
            onClick={onStartSession}
            className="ml-2 px-3 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors"
          >
            Start Session
          </button>
        </div>
      )}
    </div>
  );
};

export default SessionBar;
