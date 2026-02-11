import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { stockCountService } from '../../services/stockCount.service';
import { binLocationService, BinLocationWithStock } from '../../services/binLocation.service';
import apiClient from '../../services/api.client';

interface LocationOption { id: string; name: string; }
interface UserOption { id: string; name: string; employee_name?: string; }
interface ItemOption { id: string; item_name: string; name: string; sku: string; current_stock: number; }

interface SelectedItem {
  item_id: string;
  item_name: string;
  sku: string;
  bin_location_id: string;
  bin_code: string;
  expected_quantity: number;
}

// For a given item, which bins have stock
interface ItemBinInfo {
  bin_id: string;
  bin_code: string;
  location_name: string;
  quantity: number;
}

export default function MobileNewStockCountPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const isDesktop = loc.pathname.startsWith('/items/');
  const listPath = isDesktop ? '/items/stock-count/tasks' : '/stock-counts';

  // Form state
  const [description, setDescription] = useState('');
  const [locationId, setLocationId] = useState('');
  const [locationName, setLocationName] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [assignedUserName, setAssignedUserName] = useState('');
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Dropdowns data
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);

  // Add member
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  // Item search
  const [allItems, setAllItems] = useState<ItemOption[]>([]);
  const [itemQuery, setItemQuery] = useState('');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Bin stock data
  const [allBinStock, setAllBinStock] = useState<BinLocationWithStock[]>([]);
  const [loadingBins, setLoadingBins] = useState(false);

  // Load locations, users, items
  useEffect(() => {
    apiClient.get('/locations').then(res => {
      setLocations(res.data?.data || []);
    }).catch(() => {});
    apiClient.get('/auth/users').then(res => {
      setUsers(res.data?.data || res.data?.users || []);
    }).catch(() => {});
    apiClient.get('/items').then(res => {
      setAllItems(res.data?.data || []);
    }).catch(() => {});
  }, []);

  // Fetch bin stock data once
  useEffect(() => {
    const fetchBins = async () => {
      setLoadingBins(true);
      try {
        const res = await binLocationService.getBinLocationsWithStock();
        setAllBinStock(res.data || []);
      } catch {
        setAllBinStock([]);
      } finally {
        setLoadingBins(false);
      }
    };
    fetchBins();
  }, []);

  // Get bins for a specific item, filtered by location
  const getBinsForItem = (itemId: string): ItemBinInfo[] => {
    const bins: ItemBinInfo[] = [];
    const filteredBins = locationId === 'all'
      ? allBinStock
      : allBinStock.filter(b => b.location_id === locationId);

    for (const bin of filteredBins) {
      const itemInBin = bin.items.find(i => i.item_id === itemId);
      if (itemInBin && itemInBin.quantity > 0) {
        bins.push({
          bin_id: bin.id,
          bin_code: bin.bin_code,
          location_name: bin.locations?.name || '',
          quantity: itemInBin.quantity,
        });
      }
    }
    return bins;
  };

  // Filter items for search
  const q = itemQuery.trim().toLowerCase();
  const filteredItems = q.length < 1
    ? []
    : allItems.filter(i =>
        (i.item_name || i.name || '').toLowerCase().includes(q) ||
        (i.sku || '').toLowerCase().includes(q)
      ).slice(0, 20);

  // Check if an item+bin combo is already selected
  const isItemBinSelected = (itemId: string, binId: string) =>
    selectedItems.some(si => si.item_id === itemId && si.bin_location_id === binId);

  const addItemBin = (item: ItemOption, binInfo: ItemBinInfo) => {
    if (isItemBinSelected(item.id, binInfo.bin_id)) return;
    setSelectedItems(prev => [...prev, {
      item_id: item.id,
      item_name: item.item_name || item.name,
      sku: item.sku || '',
      bin_location_id: binInfo.bin_id,
      bin_code: binInfo.bin_code,
      expected_quantity: binInfo.quantity,
    }]);
  };

  const addAllBinsForItem = (item: ItemOption, bins: ItemBinInfo[]) => {
    const newItems: SelectedItem[] = [];
    for (const b of bins) {
      if (!isItemBinSelected(item.id, b.bin_id)) {
        newItems.push({
          item_id: item.id,
          item_name: item.item_name || item.name,
          sku: item.sku || '',
          bin_location_id: b.bin_id,
          bin_code: b.bin_code,
          expected_quantity: b.quantity,
        });
      }
    }
    if (newItems.length > 0) {
      setSelectedItems(prev => [...prev, ...newItems]);
    }
  };

  const removeItem = (itemId: string, binId: string) => {
    setSelectedItems(prev => prev.filter(si => !(si.item_id === itemId && si.bin_location_id === binId)));
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setLocationId(id);
    if (id === 'all') {
      setLocationName('All Locations');
    } else {
      const found = locations.find(l => l.id === id);
      setLocationName(found?.name || '');
    }
    setSelectedItems([]);
    setExpandedItemId(null);
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setAssignedUserId(id);
    const found = users.find(u => u.id === id);
    setAssignedUserName(found?.employee_name || found?.name || '');
  };

  const refreshUsers = async () => {
    const res = await apiClient.get('/auth/users');
    setUsers(res.data?.data || res.data?.users || []);
  };

  const handleAddMember = async () => {
    if (!newMemberName.trim() || !newMemberEmail.trim() || !newMemberPassword.trim()) {
      alert('Please fill in name, email, and password');
      return;
    }
    try {
      setAddingMember(true);
      const res = await apiClient.post('/auth/register', {
        name: newMemberName.trim(),
        email: newMemberEmail.trim(),
        password: newMemberPassword.trim(),
        role: 'Staff',
      });
      const newUser = res.data?.data || res.data?.user;
      await refreshUsers();
      if (newUser?.id) {
        setAssignedUserId(newUser.id);
        setAssignedUserName(newUser.name || newMemberName.trim());
      }
      setNewMemberName('');
      setNewMemberEmail('');
      setNewMemberPassword('');
      setShowAddMember(false);
      alert('Team member added successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleCreate = async () => {
    if (!locationId) {
      alert('Please select a location');
      return;
    }
    if (!assignedUserId) {
      alert('Please assign to a team member');
      return;
    }
    if (selectedItems.length === 0) {
      alert('Please add at least one item');
      return;
    }

    try {
      setSubmitting(true);
      await stockCountService.createStockCount({
        description: description || undefined,
        location_id: locationId === 'all' ? undefined : locationId,
        location_name: locationName,
        assigned_to_user_id: assignedUserId,
        assigned_to_name: assignedUserName,
        items: selectedItems.map(si => ({
          item_id: si.item_id,
          bin_location_id: si.bin_location_id,
          bin_code: si.bin_code,
          expected_quantity: si.expected_quantity,
        })),
      });
      alert('Stock count created and assigned!');
      navigate(listPath);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create stock count');
    } finally {
      setSubmitting(false);
    }
  };

  // Count how many bin entries are selected for a given item
  const selectedBinCountForItem = (itemId: string) =>
    selectedItems.filter(si => si.item_id === itemId).length;

  return (
    <div style={{ paddingTop: isDesktop ? 0 : 48, paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: isDesktop ? '20px 20px 16px' : '0 20px 16px', gap: 12 }}>
        <button
          onClick={() => navigate(listPath)}
          style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#374151', padding: 0 }}
        >
          &larr;
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#111827', margin: 0 }}>New Stock Count</h1>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Description */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 14, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 8 }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What is this stock count for?"
            rows={2}
            maxLength={500}
            style={{
              width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB',
              borderRadius: 12, fontSize: 15, resize: 'none', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Location */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 14, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 8 }}>
            Location <span style={{ color: '#DC2626' }}>*</span>
          </label>
          <select
            value={locationId}
            onChange={handleLocationChange}
            style={{
              width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB',
              borderRadius: 12, fontSize: 15, backgroundColor: '#FFFFFF', outline: 'none',
              color: locationId ? '#111827' : '#9CA3AF',
            }}
          >
            <option value="">Select location</option>
            <option value="all">All Locations</option>
            {locations.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        {/* Assign To */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>
              Assign To <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <button
              onClick={() => setShowAddMember(!showAddMember)}
              style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}
            >
              {showAddMember ? 'Cancel' : '+ Add Member'}
            </button>
          </div>

          {showAddMember ? (
            <div style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 12 }}>New Team Member</div>
              <input type="text" value={newMemberName} onChange={e => setNewMemberName(e.target.value)}
                placeholder="Full name"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 14, outline: 'none', marginBottom: 8, boxSizing: 'border-box' }}
              />
              <input type="email" value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)}
                placeholder="Email address"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 14, outline: 'none', marginBottom: 8, boxSizing: 'border-box' }}
              />
              <input type="text" value={newMemberPassword} onChange={e => setNewMemberPassword(e.target.value)}
                placeholder="Password"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 14, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }}
              />
              <button onClick={handleAddMember} disabled={addingMember}
                style={{ width: '100%', backgroundColor: '#059669', color: '#FFF', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: addingMember ? 0.6 : 1 }}
              >
                {addingMember ? 'Adding...' : 'Add & Assign'}
              </button>
            </div>
          ) : (
            <select value={assignedUserId} onChange={handleUserChange}
              style={{ width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: 12, fontSize: 15, backgroundColor: '#FFFFFF', outline: 'none', color: assignedUserId ? '#111827' : '#9CA3AF' }}
            >
              <option value="">Select team member</option>
              {users.filter(u => u.id !== user?.id).map(u => (
                <option key={u.id} value={u.id}>{u.employee_name || u.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Items Section */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: '#111827', display: 'block', marginBottom: 12 }}>
            Items to Count {selectedItems.length > 0 && `(${selectedItems.length} bin entries)`}
          </label>

          {!locationId ? (
            <div style={{ textAlign: 'center', padding: 40, backgroundColor: '#F9FAFB', borderRadius: 12, border: '1px dashed #D1D5DB' }}>
              <div style={{ fontSize: 14, color: '#6B7280' }}>Select a location first</div>
            </div>
          ) : (
            <>
              {/* Item Search */}
              <div style={{
                backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, marginBottom: 12, border: '1px solid #E5E7EB',
              }}>
                <input
                  type="text"
                  value={itemQuery}
                  onChange={e => setItemQuery(e.target.value)}
                  placeholder="Search items by name or SKU..."
                  style={{
                    width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB',
                    borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box',
                  }}
                />

                {loadingBins && (
                  <div style={{ textAlign: 'center', padding: 12, color: '#9CA3AF', fontSize: 13 }}>Loading bin data...</div>
                )}

                {/* Search Results */}
                {filteredItems.length > 0 && (
                  <div style={{ maxHeight: 400, overflowY: 'auto', marginTop: 8 }}>
                    {filteredItems.map(item => {
                      const isExpanded = expandedItemId === item.id;
                      const itemBins = getBinsForItem(item.id);
                      const addedCount = selectedBinCountForItem(item.id);

                      return (
                        <div key={item.id} style={{
                          borderBottom: '1px solid #E5E7EB',
                          backgroundColor: isExpanded ? '#F0F9FF' : 'transparent',
                        }}>
                          {/* Item row - click to expand */}
                          <button
                            onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                            style={{
                              width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              padding: '12px 12px', border: 'none', backgroundColor: 'transparent',
                              cursor: 'pointer', textAlign: 'left',
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
                                {item.item_name || item.name}
                              </div>
                              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                                {item.sku || 'No SKU'} | Global stock: {item.current_stock || 0}
                                {itemBins.length > 0 && ` | ${itemBins.length} bin${itemBins.length !== 1 ? 's' : ''}`}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {addedCount > 0 && (
                                <span style={{
                                  fontSize: 11, fontWeight: 600, color: '#059669',
                                  backgroundColor: '#D1FAE5', padding: '2px 8px', borderRadius: 10,
                                }}>
                                  {addedCount} added
                                </span>
                              )}
                              {itemBins.length > 0 ? (
                                <span style={{ fontSize: 14, color: '#6B7280', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                                  &#9660;
                                </span>
                              ) : (
                                <span style={{ fontSize: 11, color: '#9CA3AF' }}>No bins</span>
                              )}
                            </div>
                          </button>

                          {/* Expanded: show bins for this item */}
                          {isExpanded && itemBins.length > 0 && (
                            <div style={{ padding: '0 12px 12px' }}>
                              {/* Add all bins button */}
                              {addedCount < itemBins.length && (
                                <button
                                  onClick={() => addAllBinsForItem(item, itemBins)}
                                  style={{
                                    width: '100%', padding: '8px 12px', border: 'none',
                                    backgroundColor: '#EFF6FF', color: '#2563EB', fontSize: 13,
                                    fontWeight: 600, cursor: 'pointer', borderRadius: 8,
                                    marginBottom: 8, textAlign: 'center',
                                  }}
                                >
                                  + Add All {itemBins.length} Bins
                                </button>
                              )}

                              {itemBins.map(binInfo => {
                                const alreadyAdded = isItemBinSelected(item.id, binInfo.bin_id);
                                return (
                                  <div key={binInfo.bin_id} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '10px 12px', borderRadius: 8, marginBottom: 4,
                                    backgroundColor: alreadyAdded ? '#F0FDF4' : '#FFFFFF',
                                    border: `1px solid ${alreadyAdded ? '#BBF7D0' : '#E5E7EB'}`,
                                  }}>
                                    <div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{
                                          fontSize: 13, fontWeight: 600, color: '#1E40AF',
                                          backgroundColor: '#DBEAFE', padding: '2px 8px', borderRadius: 6,
                                        }}>
                                          {binInfo.bin_code}
                                        </span>
                                        {locationId === 'all' && binInfo.location_name && (
                                          <span style={{ fontSize: 11, color: '#6B7280' }}>{binInfo.location_name}</span>
                                        )}
                                      </div>
                                      <div style={{ fontSize: 13, color: '#374151', marginTop: 4 }}>
                                        Qty: <span style={{ fontWeight: 700 }}>{binInfo.quantity}</span>
                                      </div>
                                    </div>
                                    {alreadyAdded ? (
                                      <span style={{
                                        fontSize: 12, fontWeight: 600, color: '#059669',
                                        padding: '4px 12px', backgroundColor: '#D1FAE5', borderRadius: 8,
                                      }}>
                                        Added
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => addItemBin(item, binInfo)}
                                        style={{
                                          backgroundColor: '#2563EB', color: '#FFF', border: 'none',
                                          borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                        }}
                                      >
                                        + Add
                                      </button>
                                    )}
                                  </div>
                                );
                              })}

                              {itemBins.length === 0 && (
                                <div style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: 8 }}>
                                  No stock in bins at this location
                                </div>
                              )}
                            </div>
                          )}

                          {isExpanded && itemBins.length === 0 && (
                            <div style={{ padding: '0 12px 12px', fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>
                              This item has no bin stock at the selected location
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.length >= 1 && filteredItems.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 16, color: '#9CA3AF', fontSize: 13 }}>
                    No items found for "{q}"
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Selected Items Summary */}
        {selectedItems.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: '#111827', display: 'block', marginBottom: 12 }}>
              Selected ({selectedItems.length})
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedItems.map(si => (
                <div key={`${si.item_id}-${si.bin_location_id}`} style={{
                  backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14,
                  border: '1px solid #E5E7EB', display: 'flex',
                  justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{si.item_name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, color: '#2563EB',
                        backgroundColor: '#DBEAFE', padding: '2px 8px', borderRadius: 6,
                      }}>
                        {si.bin_code}
                      </span>
                      <span style={{ fontSize: 12, color: '#6B7280' }}>Expected: {si.expected_quantity}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(si.item_id, si.bin_location_id)}
                    style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: 18, cursor: 'pointer', padding: '4px 8px' }}
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom: Create Button */}
      <div style={{
        position: 'fixed', bottom: isDesktop ? 0 : 72, left: isDesktop ? 'auto' : 0, right: 0,
        padding: 16, backgroundColor: '#FFFFFF', borderTop: '1px solid #E5E7EB', zIndex: 40,
      }}>
        <button
          onClick={handleCreate}
          disabled={submitting || !locationId || !assignedUserId || selectedItems.length === 0}
          style={{
            width: '100%', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            color: '#FFF', border: 'none', borderRadius: 12, padding: 16,
            fontSize: 16, fontWeight: 600, cursor: 'pointer',
            opacity: (submitting || !locationId || !assignedUserId || selectedItems.length === 0) ? 0.5 : 1,
          }}
        >
          {submitting ? 'Creating...' : `Create & Assign Stock Count (${selectedItems.length} items)`}
        </button>
      </div>
    </div>
  );
}
