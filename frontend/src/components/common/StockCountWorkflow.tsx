import { FileText, UserCheck, Smartphone, Send, MessageSquare, CheckCircle, XCircle, ThumbsUp, ThumbsDown } from 'lucide-react';

const StockCountWorkflow = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-12 text-center">Life cycle of a Stock Counts</h2>

      <div className="flex flex-col items-center space-y-8">
        {/* Row 1: First 3 steps */}
        <div className="flex items-start justify-center gap-4">
          {/* Step 1 */}
          <div className="flex items-start gap-2">
            <div className="flex flex-col items-center" style={{ width: '180px' }}>
              <div className="w-12 h-12 rounded-full bg-blue-50 border-2 border-blue-500 flex items-center justify-center mb-2">
                <FileText size={24} className="text-blue-600" />
              </div>
              <h3 className="font-medium text-slate-800 text-sm text-center">Create Stock Count</h3>
            </div>
            <div className="flex items-center mt-5">
              <div className="flex flex-col items-center">
                <span className="text-xs text-slate-600 mb-1 whitespace-nowrap">Assign to user</span>
                <svg width="30" height="2" className="text-slate-400">
                  <line x1="0" y1="1" x2="30" y2="1" stroke="currentColor" strokeWidth="2" />
                  <polygon points="30,1 26,0 26,2" fill="currentColor" />
                </svg>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-2">
            <div className="flex flex-col items-center" style={{ width: '180px' }}>
              <div className="w-12 h-12 rounded-full bg-blue-50 border-2 border-blue-500 flex items-center justify-center mb-2">
                <Smartphone size={24} className="text-blue-600" />
              </div>
              <p className="text-xs text-slate-700 text-center leading-tight">Assigned users can enter the counted stock from the mobile app</p>
            </div>
            <div className="mt-5">
              <svg width="30" height="2" className="text-slate-400">
                <line x1="0" y1="1" x2="30" y2="1" stroke="currentColor" strokeWidth="2" />
                <polygon points="30,1 26,0 26,2" fill="currentColor" />
              </svg>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center" style={{ width: '180px' }}>
            <div className="w-12 h-12 rounded-full bg-blue-50 border-2 border-blue-500 flex items-center justify-center mb-2">
              <Send size={24} className="text-blue-600" />
            </div>
            <p className="text-xs text-slate-700 text-center leading-tight">Users submit the stock count for approval</p>
          </div>
        </div>

        {/* Vertical Arrow Down */}
        <div className="flex justify-center">
          <svg width="2" height="40" className="text-slate-400">
            <line x1="1" y1="0" x2="1" y2="40" stroke="currentColor" strokeWidth="2" />
            <polygon points="1,40 0,36 2,36" fill="currentColor" />
          </svg>
        </div>

        {/* Row 2: Approval step */}
        <div className="flex flex-col items-center" style={{ width: '200px' }}>
          <div className="w-12 h-12 rounded-full bg-blue-50 border-2 border-blue-500 flex items-center justify-center mb-2">
            <UserCheck size={24} className="text-blue-600" />
          </div>
          <p className="text-xs text-slate-700 text-center leading-tight mb-3">Approver receives the approval request on the web app</p>
        </div>

        {/* Branching paths */}
        <div className="flex items-start justify-center gap-24">
          {/* Approval Path (Left) */}
          <div className="flex flex-col items-center">
            {/* Vertical arrow down */}
            <div className="mb-2">
              <svg width="2" height="40" className="text-slate-400">
                <line x1="1" y1="0" x2="1" y2="40" stroke="currentColor" strokeWidth="2" />
                <polygon points="1,40 0,36 2,36" fill="currentColor" />
              </svg>
            </div>

            {/* Approval Badge */}
            <div className="flex items-center gap-2 mb-4 bg-green-100 px-3 py-1.5 rounded-full">
              <ThumbsUp size={16} className="text-green-600" />
              <span className="text-xs font-semibold text-green-700">Item Approved</span>
            </div>

            {/* Steps after approval */}
            <div className="flex items-start gap-2 mb-4">
              <div className="flex flex-col items-center" style={{ width: '160px' }}>
                <div className="w-12 h-12 rounded-full bg-green-50 border-2 border-green-500 flex items-center justify-center mb-2">
                  <MessageSquare size={24} className="text-green-600" />
                </div>
                <p className="text-xs text-slate-700 text-center leading-tight">Enter the adjustment reason for approved items with difference</p>
              </div>
              <div className="mt-5">
                <svg width="30" height="2" className="text-slate-400">
                  <line x1="0" y1="1" x2="30" y2="1" stroke="currentColor" strokeWidth="2" />
                  <polygon points="30,1 26,0 26,2" fill="currentColor" />
                </svg>
              </div>
            </div>

            {/* Final step */}
            <div className="flex flex-col items-center" style={{ width: '160px' }}>
              <div className="w-12 h-12 rounded-full bg-green-50 border-2 border-green-500 flex items-center justify-center mb-2">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <p className="text-xs text-slate-700 text-center leading-tight">Adjustment will be created for items with difference</p>
            </div>
          </div>

          {/* Rejection Path (Right) */}
          <div className="flex flex-col items-center">
            {/* Vertical arrow down */}
            <div className="mb-2">
              <svg width="2" height="40" className="text-slate-400">
                <line x1="1" y1="0" x2="1" y2="40" stroke="currentColor" strokeWidth="2" />
                <polygon points="1,40 0,36 2,36" fill="currentColor" />
              </svg>
            </div>

            {/* Rejection Badge */}
            <div className="flex items-center gap-2 mb-4 bg-red-100 px-3 py-1.5 rounded-full">
              <ThumbsDown size={16} className="text-red-600" />
              <span className="text-xs font-semibold text-red-700">Item Rejected</span>
            </div>

            {/* Rejection result */}
            <div className="flex flex-col items-center" style={{ width: '160px' }}>
              <div className="w-12 h-12 rounded-full bg-red-50 border-2 border-red-500 flex items-center justify-center mb-2">
                <XCircle size={24} className="text-red-600" />
              </div>
              <p className="text-xs text-slate-700 text-center leading-tight">No adjustment for rejected items</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockCountWorkflow;
