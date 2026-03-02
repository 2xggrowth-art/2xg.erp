import React, { useState, useEffect } from 'react';
import { Printer, RefreshCw, CheckCircle, XCircle, Loader2, SkipForward } from 'lucide-react';
import { printerService, PrinterInfo } from '../../services/printer.service';

const PAPER_SIZES = [
  { value: '58mm', label: '58mm Thermal', description: 'Compact receipt printer' },
  { value: '80mm', label: '80mm Thermal', description: 'Standard receipt printer' },
  { value: 'A4', label: 'A4', description: 'Full-size paper' },
  { value: 'A5', label: 'A5', description: 'Half-size paper' },
];

const Step3Printer: React.FC = () => {
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [paperSize, setPaperSize] = useState<string>('80mm');
  const [loading, setLoading] = useState(true);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const loadPrinters = async () => {
    setLoading(true);
    try {
      const printerList = await printerService.listPrinters();
      setPrinters(printerList);

      // Auto-select default printer
      const defaultPrinter = printerList.find((p) => p.isDefault);
      if (defaultPrinter && !selectedPrinter) {
        setSelectedPrinter(defaultPrinter.name);
      }
    } catch (err) {
      console.error('Failed to load printers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrinters();
  }, []);

  const handleTestPrint = async () => {
    if (!selectedPrinter) return;

    setTestStatus('testing');
    setTestMessage('');

    try {
      const result = await printerService.testPrint(selectedPrinter);
      if (result.success) {
        setTestStatus('success');
        setTestMessage('Test page sent to printer successfully!');
      } else {
        setTestStatus('error');
        setTestMessage('Test print failed. Check printer connection.');
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(err?.message || 'Failed to send test print.');
    }
  };

  const handleSaveSettings = async () => {
    if (selectedPrinter) {
      await window.electronAPI.setAppSetting('default_printer', selectedPrinter);
    }
    await window.electronAPI.setAppSetting('paper_size', paperSize);
  };

  const handleSkip = async () => {
    await window.electronAPI.setAppSetting('printer_configured', 'false');
  };

  // Save settings whenever selections change
  useEffect(() => {
    if (selectedPrinter || paperSize) {
      handleSaveSettings();
    }
  }, [selectedPrinter, paperSize]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Printer Setup
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Configure your receipt printer. You can change this anytime in Settings.
        </p>
      </div>

      {/* Printer Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Printer size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Default Printer
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {printers.length} printer{printers.length !== 1 ? 's' : ''} detected
              </p>
            </div>
          </div>

          <button
            onClick={loadPrinters}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              Detecting printers...
            </span>
          </div>
        ) : printers.length === 0 ? (
          <div className="text-center py-8">
            <Printer size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No printers found. Connect a printer and click Refresh.
            </p>
          </div>
        ) : (
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
        )}
      </div>

      {/* Paper Size */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Paper Size
        </label>
        <div className="grid grid-cols-2 gap-3">
          {PAPER_SIZES.map((size) => {
            const isSelected = paperSize === size.value;

            return (
              <button
                key={size.value}
                onClick={() => setPaperSize(size.value)}
                className={`
                  p-3 rounded-lg border-2 text-left transition-all
                  ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-semibold ${
                      isSelected
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {size.label}
                  </span>
                  {isSelected && (
                    <CheckCircle size={16} className="text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {size.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Test Print & Status */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-4">
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

          <button
            onClick={handleSkip}
            className="flex items-center gap-2 px-5 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            <SkipForward size={14} />
            Skip -- I'll set up printing later
          </button>
        </div>

        {testStatus !== 'idle' && testStatus !== 'testing' && (
          <div
            className={`flex items-center gap-2 text-sm mt-4 px-4 py-2.5 rounded-lg ${
              testStatus === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
            }`}
          >
            {testStatus === 'success' ? (
              <CheckCircle size={16} />
            ) : (
              <XCircle size={16} />
            )}
            {testMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default Step3Printer;
