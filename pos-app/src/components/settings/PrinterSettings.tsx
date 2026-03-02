import React, { useState, useEffect } from 'react';
import {
  Printer,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  DollarSign,
} from 'lucide-react';
import { printerService, PrinterInfo } from '../../services/printer.service';

const PAPER_SIZES = [
  { value: '58mm', label: '58mm Thermal' },
  { value: '80mm', label: '80mm Thermal' },
  { value: 'A4', label: 'A4' },
  { value: 'A5', label: 'A5' },
];

const PrinterSettings: React.FC = () => {
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [paperSize, setPaperSize] = useState<string>('80mm');
  const [receiptHeader, setReceiptHeader] = useState<string>('');
  const [receiptFooter, setReceiptFooter] = useState<string>('');
  const [cashDrawerEnabled, setCashDrawerEnabled] = useState<boolean>(false);
  const [cashDrawerCommand, setCashDrawerCommand] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const [printerList, savedPrinter, savedPaperSize, savedHeader, savedFooter, savedDrawer, savedDrawerCmd] =
        await Promise.all([
          printerService.listPrinters(),
          window.electronAPI.getAppSetting('default_printer'),
          window.electronAPI.getAppSetting('paper_size'),
          window.electronAPI.getAppSetting('receipt_header'),
          window.electronAPI.getAppSetting('receipt_footer'),
          window.electronAPI.getAppSetting('cash_drawer_enabled'),
          window.electronAPI.getAppSetting('cash_drawer_command'),
        ]);

      setPrinters(printerList);
      if (savedPrinter) setSelectedPrinter(savedPrinter);
      if (savedPaperSize) setPaperSize(savedPaperSize);
      if (savedHeader) setReceiptHeader(savedHeader);
      if (savedFooter) setReceiptFooter(savedFooter);
      if (savedDrawer) setCashDrawerEnabled(savedDrawer === 'true');
      if (savedDrawerCmd) setCashDrawerCommand(savedDrawerCmd);

      // If no saved printer, auto-select default
      if (!savedPrinter) {
        const defaultPrinter = printerList.find((p) => p.isDefault);
        if (defaultPrinter) setSelectedPrinter(defaultPrinter.name);
      }
    } catch (err) {
      console.error('Failed to load printer settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshPrinters = async () => {
    setLoading(true);
    try {
      const printerList = await printerService.listPrinters();
      setPrinters(printerList);
    } catch (err) {
      console.error('Failed to refresh printers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await Promise.all([
        window.electronAPI.setAppSetting('default_printer', selectedPrinter),
        window.electronAPI.setAppSetting('paper_size', paperSize),
        window.electronAPI.setAppSetting('receipt_header', receiptHeader),
        window.electronAPI.setAppSetting('receipt_footer', receiptFooter),
        window.electronAPI.setAppSetting('cash_drawer_enabled', String(cashDrawerEnabled)),
        window.electronAPI.setAppSetting('cash_drawer_command', cashDrawerCommand),
        window.electronAPI.setAppSetting('printer_configured', 'true'),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save printer settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestPrint = async () => {
    if (!selectedPrinter) return;
    setTestStatus('testing');
    setTestMessage('');

    try {
      const result = await printerService.testPrint(selectedPrinter);
      if (result.success) {
        setTestStatus('success');
        setTestMessage('Test page sent successfully!');
      } else {
        setTestStatus('error');
        setTestMessage('Test print failed.');
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(err?.message || 'Failed to send test print.');
    }
  };

  const handleOpenCashDrawer = async () => {
    try {
      await printerService.openCashDrawer();
    } catch (err) {
      console.error('Failed to open cash drawer:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
          Loading printer settings...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Printer</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure receipt printing and cash drawer.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : null}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Default Printer */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Default Printer
          </h3>
          <button
            onClick={refreshPrinters}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>

        <select
          value={selectedPrinter}
          onChange={(e) => setSelectedPrinter(e.target.value)}
          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
        >
          <option value="">Select a printer</option>
          {printers.map((printer) => (
            <option key={printer.name} value={printer.name}>
              {printer.displayName || printer.name}
              {printer.isDefault ? ' (System Default)' : ''}
            </option>
          ))}
        </select>

        {printers.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            No printers detected. Connect a printer and click Refresh.
          </p>
        )}
      </div>

      {/* Paper Size */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Paper Size
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {PAPER_SIZES.map((size) => (
            <button
              key={size.value}
              onClick={() => setPaperSize(size.value)}
              className={`
                px-3 py-2 rounded-lg border text-sm font-medium transition-all
                ${
                  paperSize === size.value
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              {size.label}
            </button>
          ))}
        </div>
      </div>

      {/* Receipt Header / Footer */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Receipt Customization
        </h3>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Receipt Header
          </label>
          <textarea
            value={receiptHeader}
            onChange={(e) => setReceiptHeader(e.target.value)}
            placeholder="e.g. Thank you for shopping with us!"
            rows={2}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Receipt Footer
          </label>
          <textarea
            value={receiptFooter}
            onChange={(e) => setReceiptFooter(e.target.value)}
            placeholder="e.g. Returns accepted within 7 days with receipt."
            rows={2}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none"
          />
        </div>
      </div>

      {/* Cash Drawer */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign size={18} className="text-gray-500 dark:text-gray-400" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Cash Drawer
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Open cash drawer automatically after payment.
              </p>
            </div>
          </div>
          <button
            onClick={() => setCashDrawerEnabled(!cashDrawerEnabled)}
            className={`
              relative w-11 h-6 rounded-full transition-colors
              ${cashDrawerEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
            `}
          >
            <span
              className={`
                absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
                ${cashDrawerEnabled ? 'left-[22px]' : 'left-0.5'}
              `}
            />
          </button>
        </div>

        {cashDrawerEnabled && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Drawer Command (optional)
              </label>
              <input
                type="text"
                value={cashDrawerCommand}
                onChange={(e) => setCashDrawerCommand(e.target.value)}
                placeholder="ESC/POS command or leave blank for default"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>
            <button
              onClick={handleOpenCashDrawer}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors"
            >
              <DollarSign size={14} />
              Test Cash Drawer
            </button>
          </>
        )}
      </div>

      {/* Test Print */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3">
          <button
            onClick={handleTestPrint}
            disabled={!selectedPrinter || testStatus === 'testing'}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors
              ${
                !selectedPrinter || testStatus === 'testing'
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }
            `}
          >
            {testStatus === 'testing' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Printer size={14} />
            )}
            Test Print
          </button>

          {testStatus !== 'idle' && testStatus !== 'testing' && (
            <div
              className={`flex items-center gap-2 text-sm ${
                testStatus === 'success'
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-red-700 dark:text-red-400'
              }`}
            >
              {testStatus === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
              {testMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrinterSettings;
