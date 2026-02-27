import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Calendar,
  Grid3x3,
  Settings,
  ChevronDown,
  ShoppingBag,
  FileText,
  DollarSign,
  CheckCircle,
  MoreVertical,
  Upload,
  Download,
  Eye,
  Edit,
  X,
  AlertCircle,
  CheckCircle2,
  List,
  LayoutGrid
} from 'lucide-react';
import ProcessFlow from '../components/common/ProcessFlow';
import { billsService, Bill } from '../services/bills.service';
import BulkActionBar, { createBulkDeleteAction, createBulkExportAction, createBulkPrintAction } from '../components/common/BulkActionBar';
import { parseCSV } from '../utils/csvParser';

const BillsPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBills, setSelectedBills] = useState<string[]>([]);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState({
    status: 'idle' as 'idle' | 'validating' | 'importing' | 'complete' | 'error',
    current: 0,
    total: 0,
    errors: [] as string[],
  });
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    reference: true,
    vendor: true,
    status: true,
    dueDate: true,
    amount: true,
    balance: true,
    actions: true,
  });
  const settingsRef = useRef<HTMLDivElement>(null);
  const dateFilterRef = useRef<HTMLDivElement>(null);

  // Fetch bills on component mount
  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await billsService.getAllBills();
      setBills(response.data);
    } catch (err: any) {
      console.error('Error fetching bills:', err);
      setError(err.message || 'Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  // Selection handlers
  const handleSelectBill = (billId: string) => {
    setSelectedBills(prev =>
      prev.includes(billId)
        ? prev.filter(id => id !== billId)
        : [...prev, billId]
    );
  };

  const handleSelectAll = () => {
    if (selectedBills.length === bills.length) {
      setSelectedBills([]);
    } else {
      setSelectedBills(bills.map(bill => bill.id!));
    }
  };

  const clearSelection = () => {
    setSelectedBills([]);
  };

  // Bulk action handlers
  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedBills.length} bill(s)?`)) {
      try {
        await Promise.all(selectedBills.map(id => billsService.deleteBill(id)));
        setSelectedBills([]);
        fetchBills();
      } catch (error) {
        console.error('Error deleting bills:', error);
        alert('Failed to delete some bills. Please try again.');
      }
    }
  };

  const handleBulkExport = () => {
    const selectedData = bills.filter(bill => selectedBills.includes(bill.id!));
    const csv = [
      ['Bill Number', 'Vendor', 'Status', 'Date', 'Due Date', 'Amount', 'Balance Due'].join(','),
      ...selectedData.map(bill => [
        bill.bill_number,
        bill.vendor_name,
        bill.status,
        bill.bill_date || '',
        bill.due_date || '',
        bill.total_amount,
        bill.balance_due || bill.total_amount
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bills_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleBulkPrint = () => {
    window.print();
  };

  // Export all bills as CSV
  const handleExportBills = () => {
    const csv = [
      ['Bill Number', 'Vendor Name', 'Status', 'Bill Date', 'Due Date', 'Subtotal', 'Tax Amount', 'Discount', 'Total Amount', 'Amount Paid', 'Balance Due', 'Reference Number', 'Notes'].join(','),
      ...bills.map(bill => [
        `"${bill.bill_number || ''}"`,
        `"${bill.vendor_name || ''}"`,
        bill.status,
        bill.bill_date || '',
        bill.due_date || '',
        bill.subtotal || 0,
        bill.tax_amount || 0,
        bill.discount_amount || 0,
        bill.total_amount || 0,
        bill.amount_paid || 0,
        bill.balance_due || bill.total_amount || 0,
        `"${bill.reference_number || ''}"`,
        `"${(bill.notes || '').replace(/"/g, '""')}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bills_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Import bills from CSV
  const handleImportSubmit = async () => {
    if (!importFile) return;

    try {
      setImportProgress({ status: 'validating', current: 0, total: 0, errors: [] });
      const parseResult = await parseCSV(importFile);
      const rows = parseResult.data;

      if (!rows || rows.length === 0) {
        setImportProgress({ status: 'error', current: 0, total: 0, errors: parseResult.errors.length > 0 ? parseResult.errors : ['No data found in file'] });
        return;
      }

      setImportProgress({ status: 'importing', current: 0, total: rows.length, errors: [] });
      const errors: string[] = [];
      let imported = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const billData = {
            vendor_name: row['Vendor Name'] || row['vendor_name'] || 'Unknown Vendor',
            bill_number: row['Bill Number'] || row['bill_number'] || '',
            bill_date: row['Bill Date'] || row['bill_date'] || new Date().toISOString().split('T')[0],
            due_date: row['Due Date'] || row['due_date'] || undefined,
            status: (row['Status'] || row['status'] || 'draft').toLowerCase() as 'draft' | 'open',
            subtotal: parseFloat(row['Subtotal'] || row['subtotal'] || row['Total Amount'] || row['total_amount'] || '0'),
            tax_amount: parseFloat(row['Tax Amount'] || row['tax_amount'] || '0'),
            discount_amount: parseFloat(row['Discount'] || row['discount_amount'] || '0'),
            total_amount: parseFloat(row['Total Amount'] || row['total_amount'] || row['Subtotal'] || row['subtotal'] || '0'),
            reference_number: row['Reference Number'] || row['reference_number'] || undefined,
            notes: row['Notes'] || row['notes'] || undefined,
            items: [{
              item_name: row['Vendor Name'] || 'Imported Item',
              quantity: 1,
              unit_price: parseFloat(row['Total Amount'] || row['total_amount'] || row['Subtotal'] || row['subtotal'] || '0'),
              tax_rate: 0,
              discount: 0,
              total: parseFloat(row['Total Amount'] || row['total_amount'] || row['Subtotal'] || row['subtotal'] || '0'),
            }],
          };

          if (billData.total_amount <= 0) {
            errors.push(`Row ${i + 1}: Total amount must be greater than zero`);
            continue;
          }

          await billsService.createBill(billData);
          imported++;
        } catch (err: any) {
          errors.push(`Row ${i + 1}: ${err.message || 'Failed to import'}`);
        }
        setImportProgress(prev => ({ ...prev, current: i + 1 }));
      }

      setImportProgress({ status: 'complete', current: imported, total: rows.length, errors });
      if (imported > 0) fetchBills();
    } catch (error: any) {
      setImportProgress({ status: 'error', current: 0, total: 0, errors: [error.message || 'Import failed'] });
    }
  };

  // Bulk actions configuration
  const bulkActions = [
    createBulkDeleteAction(handleBulkDelete),
    createBulkExportAction(handleBulkExport),
    createBulkPrintAction(handleBulkPrint)
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'partially_paid':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Bill lifecycle steps for the diagram
  const billLifecycleSteps = [
    {
      icon: ShoppingBag,
      title: 'Purchase Items',
      description: 'Create purchase order',
      status: 'default' as const,
    },
    {
      icon: FileText,
      title: 'Record Bill',
      description: 'Convert to bill',
      status: 'default' as const,
      arrowLabel: 'CONVERT TO OPEN',
    },
    {
      icon: DollarSign,
      title: 'Record Payment',
      description: 'Pay vendor',
      status: 'default' as const,
    },
    {
      icon: CheckCircle,
      title: 'Record Partial Payment',
      description: 'Partial payment tracking',
      status: 'default' as const,
    },
  ];

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettingsMenu(false);
      }
      if (dateFilterRef.current && !dateFilterRef.current.contains(e.target as Node)) {
        setShowDateFilter(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleColumn = (col: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  const clearDateFilter = () => {
    setDateFrom('');
    setDateTo('');
  };

  // Filter bills based on search query and date range
  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.bill_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.vendor_name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (dateFrom) {
      const billDate = bill.bill_date || '';
      if (billDate < dateFrom) return false;
    }
    if (dateTo) {
      const billDate = bill.bill_date || '';
      if (billDate > dateTo) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="border-b border-gray-200">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
                All Bills
                <ChevronDown className="ml-2 h-5 w-5 text-gray-500" />
              </h1>
            </div>

            <div className="flex items-center space-x-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search in Bills ( / )"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* New Button */}
              <button
                onClick={() => navigate('/purchases/bills/new')}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="h-5 w-5" />
                <span>New</span>
              </button>

              {/* View Toggle */}
              <button
                onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}
                title={viewMode === 'table' ? 'Switch to grid view' : 'Switch to table view'}
              >
                {viewMode === 'table' ? <LayoutGrid className="h-5 w-5" /> : <List className="h-5 w-5" />}
              </button>

              {/* Date Filter */}
              <div className="relative" ref={dateFilterRef}>
                <button
                  onClick={() => { setShowDateFilter(!showDateFilter); setShowSettingsMenu(false); }}
                  className={`p-2 rounded-lg transition-colors ${(dateFrom || dateTo) ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}
                  title="Filter by date"
                >
                  <Calendar className="h-5 w-5" />
                </button>
                {showDateFilter && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-20">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Filter by Bill Date</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">From</label>
                        <input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">To</label>
                        <input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      {(dateFrom || dateTo) && (
                        <button
                          onClick={clearDateFilter}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Clear filter
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Settings - Column Visibility */}
              <div className="relative" ref={settingsRef}>
                <button
                  onClick={() => { setShowSettingsMenu(!showSettingsMenu); setShowDateFilter(false); }}
                  className={`p-2 rounded-lg transition-colors ${showSettingsMenu ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-600'}`}
                  title="Column settings"
                >
                  <Settings className="h-5 w-5" />
                </button>
                {showSettingsMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                    <h4 className="px-4 pb-2 text-xs font-medium text-gray-500 uppercase border-b mb-1">Visible Columns</h4>
                    {([
                      { key: 'reference' as const, label: 'Reference Number' },
                      { key: 'vendor' as const, label: 'Vendor Name' },
                      { key: 'status' as const, label: 'Status' },
                      { key: 'dueDate' as const, label: 'Due Date' },
                      { key: 'amount' as const, label: 'Amount' },
                      { key: 'balance' as const, label: 'Balance Due' },
                      { key: 'actions' as const, label: 'Actions' },
                    ]).map(col => (
                      <label key={col.key} className="flex items-center px-4 py-1.5 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={visibleColumns[col.key]}
                          onChange={() => toggleColumn(col.key)}
                          className="rounded mr-3"
                        />
                        <span className="text-sm text-gray-700">{col.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowActionsMenu(!showActionsMenu)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="More actions"
                >
                  <MoreVertical className="h-5 w-5 text-gray-600" />
                </button>

                {showActionsMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowActionsMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      <button
                        onClick={() => {
                          setShowImportModal(true);
                          setShowActionsMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                      >
                        <Upload className="w-4 h-4" />
                        Import Bills
                      </button>
                      <button
                        onClick={() => {
                          handleExportBills();
                          setShowActionsMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                      >
                        <Download className="w-4 h-4" />
                        Export Bills
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-8 py-6">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="text-gray-500">Loading bills...</div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center py-16">
            <div className="text-red-500">Error: {error}</div>
          </div>
        ) : filteredBills.length === 0 && searchQuery === '' ? (
          /* Empty State */
          <div className="max-w-4xl mx-auto py-16">
            <div className="text-center">
              <h2 className="text-3xl font-semibold text-gray-900 mb-4">
                Owe money? It's good to pay bills on time!
              </h2>
              <p className="text-gray-600 text-base mb-8 max-w-2xl mx-auto">
                If you've purchased something for your business, and you don't have to repay it immediately,
                then you can record it as a bill.
              </p>
              <button
                onClick={() => navigate('/purchases/bills/new')}
                className="inline-flex items-center px-8 py-3 bg-blue-600 text-white text-base font-medium rounded-lg hover:bg-blue-700 transition-colors mb-4"
              >
                CREATE A BILL
              </button>
              <div className="mb-16">
                <button
                  onClick={() => {/* Handle import */}}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Import Bills
                </button>
              </div>
              <div className="mt-16">
                <h3 className="text-xl font-semibold text-gray-900 mb-8">
                  Life cycle of a Bill
                </h3>
                <ProcessFlow title="" steps={billLifecycleSteps} />
                <div className="mt-12 text-left max-w-xl mx-auto">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">
                    In the Bills module, you can:
                  </h4>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Create bills and record payments</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Apply credits to bills</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Make online payments</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Allocate landed costs</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : filteredBills.length === 0 ? (
          /* No Search Results */
          <div className="flex justify-center items-center py-16">
            <div className="text-gray-500">No bills found matching "{searchQuery}"</div>
          </div>
        ) : (
          /* Bills - Table or Grid View */
          <>
            {/* Active date filter indicator */}
            {(dateFrom || dateTo) && (
              <div className="mb-4 flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-4 py-2 rounded-lg">
                <Calendar className="w-4 h-4" />
                <span>
                  Filtered: {dateFrom ? formatDate(dateFrom) : 'Start'} — {dateTo ? formatDate(dateTo) : 'Now'}
                </span>
                <button onClick={clearDateFilter} className="ml-2 text-blue-600 hover:text-blue-800 font-medium">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {viewMode === 'table' ? (
              <div className="bg-white">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedBills.length === filteredBills.length && filteredBills.length > 0}
                            onChange={handleSelectAll}
                            className="rounded"
                          />
                        </th>
                        {visibleColumns.reference && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Reference Number
                          </th>
                        )}
                        {visibleColumns.vendor && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Vendor Name
                          </th>
                        )}
                        {visibleColumns.status && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        )}
                        {visibleColumns.dueDate && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Due Date
                          </th>
                        )}
                        {visibleColumns.amount && (
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                        )}
                        {visibleColumns.balance && (
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Balance Due
                          </th>
                        )}
                        {visibleColumns.actions && (
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredBills.map((bill) => (
                        <tr
                          key={bill.id}
                          onClick={() => navigate(`/purchases/bills/${bill.id}`)}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedBills.includes(bill.id!)}
                              onChange={() => handleSelectBill(bill.id!)}
                              className="rounded"
                            />
                          </td>
                          {visibleColumns.reference && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                              {bill.reference_number || bill.bill_number}
                            </td>
                          )}
                          {visibleColumns.vendor && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {bill.vendor_name}
                            </td>
                          )}
                          {visibleColumns.status && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(bill.status)}`}>
                                {bill.status.toUpperCase()}
                              </span>
                            </td>
                          )}
                          {visibleColumns.dueDate && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {bill.due_date ? formatDate(bill.due_date) : '-'}
                            </td>
                          )}
                          {visibleColumns.amount && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {formatCurrency(bill.total_amount)}
                            </td>
                          )}
                          {visibleColumns.balance && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {formatCurrency(bill.balance_due || bill.total_amount)}
                            </td>
                          )}
                          {visibleColumns.actions && (
                            <td className="px-6 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => navigate(`/purchases/bills/${bill.id}`)}
                                  className="p-1.5 hover:bg-blue-50 rounded text-blue-600 transition-colors"
                                  title="View"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => navigate(`/purchases/bills/${bill.id}/edit`)}
                                  className="p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Grid / Card View */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredBills.map((bill) => (
                  <div
                    key={bill.id}
                    onClick={() => navigate(`/purchases/bills/${bill.id}`)}
                    className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 cursor-pointer transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-blue-600">
                          {bill.reference_number || bill.bill_number}
                        </p>
                        <p className="text-sm text-gray-700 mt-0.5">{bill.vendor_name}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusBadgeColor(bill.status)}`}>
                        {bill.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="border-t pt-3 space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Amount</span>
                        <span className="font-medium text-gray-900">{formatCurrency(bill.total_amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Balance</span>
                        <span className="font-medium text-gray-900">{formatCurrency(bill.balance_due || bill.total_amount)}</span>
                      </div>
                      {bill.due_date && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Due</span>
                          <span className="text-gray-600">{formatDate(bill.due_date)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 mt-3 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/purchases/bills/${bill.id}`)}
                        className="flex-1 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => navigate(`/purchases/bills/${bill.id}/edit`)}
                        className="flex-1 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Bulk Action Bar */}
      {selectedBills.length > 0 && (
        <BulkActionBar
          selectedCount={selectedBills.length}
          totalCount={filteredBills.length}
          onClearSelection={clearSelection}
          onSelectAll={handleSelectAll}
          actions={bulkActions}
          entityName="bill"
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Import Bills</h2>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setImportProgress({ status: 'idle', current: 0, total: 0, errors: [] });
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV File
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  CSV should have columns: Bill Number, Vendor Name, Bill Date, Due Date, Status, Subtotal, Tax Amount, Total Amount, Reference Number, Notes
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {importProgress.status !== 'idle' && (
                <div className="mt-4">
                  {importProgress.status === 'validating' && (
                    <p className="text-sm text-blue-600">Validating file...</p>
                  )}
                  {importProgress.status === 'importing' && (
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Importing... {importProgress.current}/{importProgress.total}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {importProgress.status === 'complete' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="font-medium">Import Complete!</span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        Successfully imported: {importProgress.current} of {importProgress.total} bills
                      </p>
                      {importProgress.errors.length > 0 && (
                        <div className="mt-2 text-sm text-orange-700">
                          <p className="font-medium">Issues:</p>
                          <ul className="list-disc pl-4 mt-1 max-h-32 overflow-y-auto">
                            {importProgress.errors.map((err, idx) => (
                              <li key={idx}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  {importProgress.status === 'error' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-medium">Import Failed</span>
                      </div>
                      <ul className="list-disc pl-4 mt-1 text-sm text-red-700">
                        {importProgress.errors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setImportProgress({ status: 'idle', current: 0, total: 0, errors: [] });
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={handleImportSubmit}
                disabled={!importFile || importProgress.status === 'importing'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importProgress.status === 'importing' ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillsPage;
