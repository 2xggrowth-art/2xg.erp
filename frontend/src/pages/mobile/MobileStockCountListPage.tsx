import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { binLocationService, BinLocationWithStock } from '../../services/binLocation.service';
import { stockCountService, StockCount } from '../../services/stockCount.service';

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

export default function MobileStockCountListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = location.pathname.startsWith('/items/');
  const basePath = isDesktop ? '/items/stock-count/tasks' : '/stock-counts';

  const [activeTab, setActiveTab] = useState<'bins' | 'history'>('bins');
  const [bins, setBins] = useState<BinLocationWithStock[]>([]);
  const [history, setHistory] = useState<StockCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchBins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await binLocationService.getBinLocationsWithStock();
      setBins(res.data || []);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await stockCountService.getAllStockCounts();
      setHistory(data);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'bins') fetchBins();
    else fetchHistory();
  }, [activeTab, fetchBins, fetchHistory]);

  // Group bins by location
  const groupedBins: Record<string, { locationName: string; bins: BinLocationWithStock[] }> = {};
  bins.forEach((bin) => {
    const locName = (bin as any).locations?.name || 'No Location';
    if (!groupedBins[locName]) {
      groupedBins[locName] = { locationName: locName, bins: [] };
    }
    groupedBins[locName].bins.push(bin);
  });

  // Filter by search
  const filteredGroups = Object.values(groupedBins)
    .map((g) => ({
      ...g,
      bins: g.bins.filter(
        (b) =>
          !search ||
          b.bin_code.toLowerCase().includes(search.toLowerCase()) ||
          g.locationName.toLowerCase().includes(search.toLowerCase()) ||
          b.items?.some((i) => i.item_name.toLowerCase().includes(search.toLowerCase()))
      ),
    }))
    .filter((g) => g.bins.length > 0);

  const filteredHistory = history.filter(
    (sc) =>
      !search ||
      sc.stock_count_number.toLowerCase().includes(search.toLowerCase()) ||
      sc.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ paddingTop: isDesktop ? 0 : 48 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: isDesktop ? '20px 20px 12px' : '0 20px 12px', gap: 12 }}>
        <button
          onClick={() => navigate(isDesktop ? '/items' : '/home')}
          style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#374151', padding: 0 }}
        >
          &larr;
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#111827', margin: 0 }}>Stock Count</h1>
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
            {activeTab === 'bins'
              ? `${bins.length} bin${bins.length !== 1 ? 's' : ''} with stock`
              : `${history.length} past scan${history.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, padding: '0 20px 12px' }}>
        {(['bins', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '10px 0',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #2563EB' : '2px solid #E5E7EB',
              backgroundColor: 'transparent',
              fontSize: 14,
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? '#2563EB' : '#6B7280',
              cursor: 'pointer',
            }}
          >
            {tab === 'bins' ? 'Bins' : 'History'}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ padding: '0 20px 12px' }}>
        <input
          type="text"
          placeholder={activeTab === 'bins' ? 'Search bins, locations, items...' : 'Search scan history...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            border: '1px solid #D1D5DB',
            borderRadius: 10,
            fontSize: 14,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Content */}
      <div style={{ padding: '0 20px', paddingBottom: 24 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Loading...</div>
        ) : activeTab === 'bins' ? (
          /* BINS TAB */
          filteredGroups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: '#374151' }}>No Bins Found</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                {search ? 'No bins match your search' : 'No bin locations with stock'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {filteredGroups.map((group) => (
                <div key={group.locationName}>
                  {/* Location header */}
                  <div style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: 8,
                    paddingLeft: 2,
                  }}>
                    {group.locationName} ({group.bins.length})
                  </div>

                  {/* Bin cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {group.bins.map((bin) => (
                      <div
                        key={bin.id}
                        style={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E5E7EB',
                          borderRadius: 12,
                          padding: 16,
                        }}
                      >
                        {/* Bin header row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <div>
                            <span style={{
                              fontSize: 15,
                              fontWeight: 700,
                              color: '#1E40AF',
                            }}>
                              {bin.bin_code}
                            </span>
                            <span style={{ fontSize: 12, color: '#6B7280', marginLeft: 8 }}>
                              {bin.total_items} item{bin.total_items !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <button
                            onClick={() => navigate(`${basePath}/scan/${bin.id}`)}
                            style={{
                              backgroundColor: '#2563EB',
                              color: '#FFF',
                              border: 'none',
                              borderRadius: 8,
                              padding: '6px 14px',
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            Scan
                          </button>
                        </div>

                        {/* Items preview (first 3 items) */}
                        {bin.items && bin.items.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {bin.items.slice(0, 3).map((item, idx) => (
                              <div key={idx} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: 13,
                                color: '#374151',
                              }}>
                                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {item.item_name}
                                </span>
                                <span style={{ marginLeft: 8, fontWeight: 500, color: '#6B7280', whiteSpace: 'nowrap' }}>
                                  {item.quantity} {item.unit_of_measurement || 'pcs'}
                                </span>
                              </div>
                            ))}
                            {bin.items.length > 3 && (
                              <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                                +{bin.items.length - 3} more
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* HISTORY TAB */
          filteredHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: '#374151' }}>No Scan History</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                {search ? 'No results match your search' : 'Scan a bin to create history'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredHistory.map((sc) => {
                const itemCount = sc.items?.length || 0;
                const hasVariance = sc.items?.some((i) => i.variance !== null && i.variance !== 0);
                const allMatch = itemCount > 0 && !hasVariance;

                return (
                  <button
                    key={sc.id}
                    onClick={() => navigate(`${basePath}/${sc.id}`)}
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: `1px solid ${allMatch ? '#D1FAE5' : hasVariance ? '#FDE68A' : '#E5E7EB'}`,
                      borderRadius: 12,
                      padding: 16,
                      textAlign: 'left',
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#2563EB' }}>
                        {sc.stock_count_number}
                      </span>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: allMatch ? '#059669' : hasVariance ? '#D97706' : '#6B7280',
                        backgroundColor: allMatch ? '#D1FAE5' : hasVariance ? '#FEF3C7' : '#F3F4F6',
                        padding: '3px 10px',
                        borderRadius: 12,
                      }}>
                        {allMatch ? 'Match' : hasVariance ? 'Variance' : sc.status?.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {sc.description && (
                      <div style={{ fontSize: 14, color: '#374151', marginBottom: 4, fontWeight: 500 }}>
                        {sc.description}
                      </div>
                    )}

                    {sc.location_name && (
                      <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 2 }}>
                        {sc.location_name}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                      <span style={{ fontSize: 12, color: '#6B7280' }}>
                        {itemCount} item{itemCount !== 1 ? 's' : ''} scanned
                        {sc.assigned_to_name && ` by ${sc.assigned_to_name}`}
                      </span>
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                        {timeAgo(sc.created_at)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
