import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Keyboard, Camera } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import type { QueueBike } from './TechnicianDashboard';

const SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.QR_CODE,
];

interface ScanConfirmProps {
  bike: QueueBike;
  onConfirmed: (bike: QueueBike) => void;
  onBack: () => void;
}

interface ManualFields {
  name: string;
  color: string;
  size: string;
  barcode: string;
}

interface MismatchDetail {
  field: string;
  expected: string;
  entered: string;
}

export const ScanConfirm = ({ bike, onConfirmed, onBack }: ScanConfirmProps) => {
  const [status, setStatus] = useState<'waiting' | 'match' | 'mismatch'>('waiting');
  const [mode, setMode] = useState<'manual' | 'camera'>('manual');
  const [manualFields, setManualFields] = useState<ManualFields>({ name: '', color: '', size: '', barcode: '' });
  const [mismatches, setMismatches] = useState<MismatchDetail[]>([]);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'confirm-scanner-container';

  useEffect(() => {
    return () => { stopScanner(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
          await scannerRef.current.stop();
        }
      }
    } catch { /* ignore */ }
    scannerRef.current = null;
    setScannerActive(false);
  };

  const startScanner = async () => {
    try {
      if (scannerRef.current) {
        await stopScanner();
      }
      const scanner = new Html5Qrcode(scannerContainerId, { formatsToSupport: SUPPORTED_FORMATS, verbose: false });
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 15, qrbox: { width: 280, height: 120 }, aspectRatio: 1.0 },
        (decodedText: string) => {
          const trimmed = decodedText.trim();
          if (trimmed) {
            setScannedBarcode(trimmed);
            if (trimmed.toLowerCase() === bike.barcode.toLowerCase()) {
              setStatus('match');
            } else {
              setMismatches([{ field: 'Barcode', expected: bike.barcode, entered: trimmed }]);
              setStatus('mismatch');
            }
            stopScanner();
          }
        },
        () => {}
      );
      setScannerActive(true);
    } catch {
      setScannerActive(false);
    }
  };

  const normalize = (val: string) => val.trim().toLowerCase();

  // If item_name is available, verify by name/color/size. Otherwise fall back to barcode.
  const hasItemDetails = Boolean(bike.item_name);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: MismatchDetail[] = [];

    if (hasItemDetails) {
      // Verify by item name, color, size
      const expectedName = bike.item_name || '';
      const expectedColor = bike.item_color || '';
      const expectedSize = bike.item_size || '';

      if (normalize(manualFields.name) !== normalize(expectedName)) {
        errors.push({ field: 'Item Name', expected: expectedName, entered: manualFields.name.trim() });
      }
      if (expectedColor && normalize(manualFields.color) !== normalize(expectedColor)) {
        errors.push({ field: 'Color', expected: expectedColor, entered: manualFields.color.trim() });
      }
      if (expectedSize && normalize(manualFields.size) !== normalize(expectedSize)) {
        errors.push({ field: 'Size', expected: expectedSize, entered: manualFields.size.trim() });
      }
    } else {
      // No item details available - verify by barcode
      if (normalize(manualFields.barcode) !== normalize(bike.barcode)) {
        errors.push({ field: 'Barcode', expected: bike.barcode, entered: manualFields.barcode.trim() });
      }
    }

    if (errors.length === 0) {
      setStatus('match');
    } else {
      setMismatches(errors);
      setStatus('mismatch');
    }
  };

  const handleConfirm = () => {
    onConfirmed(bike);
  };

  const handleRetry = () => {
    setManualFields({ name: '', color: '', size: '', barcode: '' });
    setScannedBarcode('');
    setMismatches([]);
    setStatus('waiting');
  };

  const displayName = bike.item_name || bike.model_sku;
  const details = [bike.item_color, bike.item_size, bike.item_variant].filter(Boolean).join(' / ');

  // Check which fields are available for manual verification
  const hasColor = Boolean(bike.item_color);
  const hasSize = Boolean(bike.item_size);
  const canSubmitManual = hasItemDetails
    ? (manualFields.name.trim() && (!hasColor || manualFields.color.trim()) && (!hasSize || manualFields.size.trim()))
    : manualFields.barcode.trim();

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Queue
      </button>

      {/* Bike info card - only show barcode/bin to help locate, NOT the details they need to verify */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Confirm Bike Before Starting</h2>
        <p className="text-sm text-gray-500 mb-4">
          {mode === 'manual'
            ? 'Look at the bike and enter what you see to verify it matches.'
            : 'Scan the barcode on the bike to verify it matches.'}
        </p>

        <div className="bg-gray-50 rounded-lg p-3 space-y-1">
          {bike.item_name && (
            <p className="text-sm text-gray-500">Item: <span className="font-medium text-gray-700">{bike.item_name}</span></p>
          )}
          {bike.item_color && (
            <p className="text-sm text-gray-500">Color: <span className="font-medium text-gray-700">{bike.item_color}</span></p>
          )}
          {bike.item_size && (
            <p className="text-sm text-gray-500">Size: <span className="font-medium text-gray-700">{bike.item_size}</span></p>
          )}
          {bike.item_variant && (
            <p className="text-sm text-gray-500">Variant: <span className="font-medium text-gray-700">{bike.item_variant}</span></p>
          )}
          {!bike.item_name && (
            <p className="text-sm text-gray-500">Barcode: <span className="font-mono font-medium text-gray-700">{bike.barcode}</span></p>
          )}
          {bike.bin_location?.bin_code && (
            <p className="text-sm text-gray-500">Bin Location: <span className="font-medium text-gray-700">{bike.bin_location.bin_code}</span></p>
          )}
        </div>
      </div>

      {/* Match result */}
      {status === 'match' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
          <p className="font-medium text-green-800">Verification passed!</p>
          <p className="text-sm text-green-600 mt-1">{displayName}</p>
          {details && <p className="text-xs text-green-500">{details}</p>}
          <button
            onClick={handleConfirm}
            className="mt-4 w-full py-3 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition-colors"
          >
            Start Assembly
          </button>
        </div>
      )}

      {status === 'mismatch' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-center mb-3">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
            <p className="font-medium text-red-800">Verification failed!</p>
          </div>
          <div className="space-y-2 mb-4">
            {mismatches.map((m, i) => (
              <div key={i} className="bg-white rounded p-2 text-sm">
                <span className="font-medium text-gray-700">{m.field}:</span>
                <div className="flex justify-between mt-0.5 text-xs">
                  <span className="text-red-600">You entered: {m.entered || '(empty)'}</span>
                  <span className="text-green-700">Expected: {m.expected}</span>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleRetry}
            className="w-full py-3 bg-gray-600 text-white rounded-lg font-medium text-sm hover:bg-gray-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Input (only when waiting) */}
      {status === 'waiting' && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => { setMode('manual'); stopScanner(); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium text-sm transition-colors ${
                mode === 'manual' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <Keyboard className="w-4 h-4" /> Manual
            </button>
            <button
              onClick={() => setMode('camera')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium text-sm transition-colors ${
                mode === 'camera' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <Camera className="w-4 h-4" /> Scan
            </button>
          </div>

          {mode === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-3">
              {hasItemDetails ? (
                <>
                  <p className="text-xs text-gray-500 mb-1">Enter the details you see on the bike:</p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={manualFields.name}
                      onChange={(e) => setManualFields(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Mountain Bike Pro"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      autoFocus
                      autoComplete="off"
                    />
                  </div>
                  {hasColor && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Color <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={manualFields.color}
                        onChange={(e) => setManualFields(prev => ({ ...prev, color: e.target.value }))}
                        placeholder="e.g. Red"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        autoComplete="off"
                      />
                    </div>
                  )}
                  {hasSize && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Size <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={manualFields.size}
                        onChange={(e) => setManualFields(prev => ({ ...prev, size: e.target.value }))}
                        placeholder="e.g. Large"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        autoComplete="off"
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-500 mb-1">Type the barcode printed on the bike to confirm:</p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Barcode <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={manualFields.barcode}
                      onChange={(e) => setManualFields(prev => ({ ...prev, barcode: e.target.value }))}
                      placeholder="e.g. SKU-0042/1"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                      autoFocus
                      autoComplete="off"
                    />
                  </div>
                </>
              )}
              <button
                type="submit"
                disabled={!canSubmitManual}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Verify
              </button>
            </form>
          )}

          {mode === 'camera' && (
            <div>
              <div
                id={scannerContainerId}
                className="w-full rounded-lg overflow-hidden bg-gray-900"
                style={{ minHeight: scannerActive ? 300 : 0 }}
              />
              {!scannerActive ? (
                <div className="text-center py-6">
                  <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-3">Point camera at the bike's barcode</p>
                  <button
                    onClick={startScanner}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
                  >
                    Start Camera
                  </button>
                </div>
              ) : (
                <div className="mt-3 text-center">
                  <p className="text-sm text-gray-600 mb-2">Position the barcode within the scanning area</p>
                  <button
                    onClick={stopScanner}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium text-sm hover:bg-red-200 transition-colors"
                  >
                    Stop Camera
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
