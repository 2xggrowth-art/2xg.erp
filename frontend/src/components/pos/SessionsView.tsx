import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Clock, TrendingUp, DollarSign } from 'lucide-react';
import { PosSession } from '../../services/pos-sessions.service';

interface SessionsViewProps {
  sessions: PosSession[];
  activeSession: PosSession | null;
  onStartSession: () => void;
  onCloseSession: (session: PosSession) => void;
  onViewSession: (sessionId: string) => void;
  formatCurrency: (amount: number) => string;
}

const SessionsView: React.FC<SessionsViewProps> = ({
  sessions,
  activeSession,
  onStartSession,
  onCloseSession,
  formatCurrency,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Sessions Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">POS Sessions</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your point of sale sessions</p>
        </div>
        {!activeSession && (
          <button
            onClick={onStartSession}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Start New Session
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Session #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Register
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Opened By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Opened At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Closed At
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Sales
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <Clock className="w-12 h-12 mb-3" />
                    <p className="text-lg font-medium">No sessions found</p>
                    <p className="text-sm mt-1">Start a new session to begin</p>
                    <button
                      onClick={onStartSession}
                      className="mt-4 px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      Start Session
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              sessions.map((session) => (
                <tr
                  key={session.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/sales/pos/sessions/${session.id}`)}
                >
                  <td className="px-6 py-4 text-sm font-medium text-blue-600 hover:underline">
                    {session.session_number}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {session.register}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {session.opened_by}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(session.opened_at).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {session.closed_at
                      ? new Date(session.closed_at).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                      : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right font-semibold">
                    {formatCurrency(session.total_sales)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${session.status === 'In-Progress'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                      {session.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {session.status === 'In-Progress' ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCloseSession(session);
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
                          title="Close Session"
                        >
                          Close Session
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/sales/pos/sessions/${session.id}`);
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
                        title="View Details"
                      >
                        View Details
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Session Summary Stats */}
        {sessions.length > 0 && (
          <div className="border-t border-gray-200 bg-gray-50 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total Sessions</div>
                    <div className="text-xl font-bold text-gray-800">{sessions.length}</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Active Sessions</div>
                    <div className="text-xl font-bold text-green-600">
                      {sessions.filter(s => s.status === 'In-Progress').length}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Closed Sessions</div>
                    <div className="text-xl font-bold text-gray-600">
                      {sessions.filter(s => s.status === 'Closed').length}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total Revenue</div>
                    <div className="text-xl font-bold text-purple-600">
                      {formatCurrency(sessions.reduce((sum, s) => sum + s.total_sales, 0))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionsView;
