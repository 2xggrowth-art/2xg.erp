import { useState, useEffect, useRef } from 'react';
import { Barcode, Camera, AlertTriangle, X, Keyboard } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeSupportedFormats } from 'html5-qrcode';

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

interface BikeScannerProps {
  onScan: (barcode: string) => void;
}

export const BikeScanner = ({ onScan }: BikeScannerProps) => {
  const [manualBarcode, setManualBarcode] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [mode, setMode] = useState<'camera' | 'manual'>('manual');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'bike-scanner-container';

  useEffect(() => {
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startScanner = async () => {
    setScannerError(null);

    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
          await scannerRef.current.stop();
        }
        scannerRef.current = null;
      }

      const scanner = new Html5Qrcode(scannerContainerId, { formatsToSupport: SUPPORTED_FORMATS, verbose: false });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: 280, height: 120 },
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          const trimmed = decodedText.trim();
          if (trimmed) {
            onScan(trimmed);
            stopScanner();
          }
        },
        () => {
          // QR scan failure callback - ignore, it fires on every frame without a match
        }
      );

      setScannerActive(true);
    } catch (err: any) {
      const message = err?.message || String(err);
      if (message.includes('NotAllowedError') || message.includes('Permission denied')) {
        setScannerError(
          'Camera permission denied. Please allow camera access in your browser settings and try again.'
        );
      } else if (message.includes('NotFoundError') || message.includes('Requested device not found')) {
        setScannerError('No camera found on this device. Use manual entry instead.');
      } else {
        setScannerError(`Camera error: ${message}`);
      }
      setScannerActive(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
          await scannerRef.current.stop();
        }
      }
    } catch (err) {
      // Ignore stop errors during cleanup
    }
    scannerRef.current = null;
    setScannerActive(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = manualBarcode.trim();
    if (!trimmed) return;
    onScan(trimmed);
    setManualBarcode('');
  };

  const handleModeSwitch = (newMode: 'camera' | 'manual') => {
    if (newMode === 'manual' && scannerActive) {
      stopScanner();
    }
    setMode(newMode);
    setScannerError(null);
  };

  return (
    <div className="space-y-4">
      {/* Mode Tabs */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Scan Bike Barcode</h2>
        <div className="flex gap-2">
          <button
            onClick={() => handleModeSwitch('manual')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-colors ${
              mode === 'manual'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            Manual Entry
          </button>
          <button
            onClick={() => handleModeSwitch('camera')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-colors ${
              mode === 'camera'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            Camera Scan
          </button>
        </div>
      </div>

      {/* Manual Entry */}
      {mode === 'manual' && (
        <div className="bg-white rounded-lg shadow p-4">
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div>
              <label htmlFor="barcode-input" className="block text-sm font-medium text-gray-700 mb-1">
                Enter Barcode
              </label>
              <div className="relative">
                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="barcode-input"
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="Scan or type barcode..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  autoFocus
                  autoComplete="off"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={!manualBarcode.trim()}
              className="w-full py-3 px-4 rounded-lg font-medium text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Look Up Bike
            </button>
          </form>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              Tip: If you have a USB/Bluetooth barcode scanner, just click the input field and scan.
              The barcode will be entered automatically.
            </p>
          </div>
        </div>
      )}

      {/* Camera Scanner */}
      {mode === 'camera' && (
        <div className="bg-white rounded-lg shadow p-4">
          {scannerError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-700">{scannerError}</p>
              </div>
              <button onClick={() => setScannerError(null)} className="text-red-400 hover:text-red-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div
            id={scannerContainerId}
            className="w-full rounded-lg overflow-hidden bg-gray-900"
            style={{ minHeight: scannerActive ? 300 : 0 }}
          />

          {!scannerActive ? (
            <div className="text-center py-8">
              <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-500 mb-4">
                Point your camera at the bike barcode to scan it.
              </p>
              <button
                onClick={startScanner}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
              >
                Start Camera
              </button>
            </div>
          ) : (
            <div className="mt-3 text-center">
              <p className="text-sm text-gray-600 mb-2">
                Position the barcode within the scanning area
              </p>
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
  );
};
