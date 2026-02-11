import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  isActive: boolean;
  onError?: (err: string) => void;
}

let scannerCounter = 0;

export default function BarcodeScanner({ onScan, isActive, onError }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const lastScanRef = useRef('');
  const lastScanTimeRef = useRef(0);
  const mountedRef = useRef(true);
  const startingRef = useRef(false);
  const [containerId] = useState(() => `barcode-scanner-${++scannerCounter}`);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    scannerRef.current = null;

    try {
      const state = scanner.getState();
      if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
        await scanner.stop();
      }
    } catch {
      // ignore stop errors
    }

    try {
      scanner.clear();
    } catch {
      // ignore clear errors
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (startingRef.current) return;
    startingRef.current = true;

    try {
      // First ensure any existing scanner is fully stopped
      await stopScanner();

      if (!mountedRef.current) return;

      // Wait for DOM element to be ready
      await new Promise(r => setTimeout(r, 400));
      if (!mountedRef.current) return;

      const el = document.getElementById(containerId);
      if (!el) return;

      // Get available cameras to pick the best one
      let cameraId: string | undefined;
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          // Prefer back/environment camera
          const backCam = devices.find(d =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
          );
          cameraId = backCam ? backCam.id : devices[devices.length - 1].id;
        }
      } catch {
        // getCameras failed — will try facingMode fallback
      }

      if (!mountedRef.current) return;

      const formatsToSupport = [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.CODE_93,
        Html5QrcodeSupportedFormats.CODABAR,
        Html5QrcodeSupportedFormats.ITF,
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.DATA_MATRIX,
      ];

      const scanner = new Html5Qrcode(containerId, {
        formatsToSupport,
        useBarCodeDetectorIfSupported: true,
      });
      scannerRef.current = scanner;

      // Use percentage-based scan region for better phone compatibility
      const qrboxFunction = (viewfinderWidth: number, viewfinderHeight: number) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        return {
          width: Math.floor(viewfinderWidth * 0.85),
          height: Math.floor(minEdge * 0.35),
        };
      };

      const config = {
        fps: 15,
        qrbox: qrboxFunction,
      };

      const onSuccess = (decodedText: string) => {
        const now = Date.now();
        if (decodedText === lastScanRef.current && now - lastScanTimeRef.current < 2000) {
          return;
        }
        lastScanRef.current = decodedText;
        lastScanTimeRef.current = now;
        if (navigator.vibrate) navigator.vibrate(100);
        onScan(decodedText);
      };

      const onFailure = () => {
        // No barcode in frame — ignore
      };

      // Try starting with specific camera ID first, fallback to facingMode
      try {
        if (cameraId) {
          await scanner.start(cameraId, config, onSuccess, onFailure);
        } else {
          await scanner.start({ facingMode: 'environment' }, config, onSuccess, onFailure);
        }
      } catch {
        // If specific camera failed, try facingMode as fallback
        if (cameraId) {
          try {
            // Need fresh scanner instance after a failed start
            scannerRef.current = null;
            try { scanner.clear(); } catch { /* ignore */ }

            const scanner2 = new Html5Qrcode(containerId, { formatsToSupport, useBarCodeDetectorIfSupported: true });
            scannerRef.current = scanner2;
            await scanner2.start({ facingMode: 'environment' }, config, onSuccess, onFailure);
          } catch (err2: any) {
            throw err2;
          }
        } else {
          // Try with facingMode 'user' (front camera) as last resort
          try {
            scannerRef.current = null;
            try { scanner.clear(); } catch { /* ignore */ }

            const scanner3 = new Html5Qrcode(containerId, { formatsToSupport, useBarCodeDetectorIfSupported: true });
            scannerRef.current = scanner3;
            await scanner3.start({ facingMode: 'user' }, config, onSuccess, onFailure);
          } catch (err3: any) {
            throw err3;
          }
        }
      }

      if (mountedRef.current) {
        setCameraReady(true);
        setError('');
      }
    } catch (err: any) {
      if (!mountedRef.current) return;
      const msg = err?.message || String(err);
      // Provide user-friendly messages
      let displayMsg = msg;
      if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
        displayMsg = 'Camera permission denied. Please allow camera access in browser settings.';
      } else if (msg.includes('NotFoundError') || msg.includes('Requested device not found')) {
        displayMsg = 'No camera found on this device.';
      } else if (msg.includes('NotReadableError') || msg.includes('Could not start')) {
        displayMsg = 'Camera is in use by another app. Close other apps using the camera and try again.';
      }
      setError(displayMsg);
      onError?.(displayMsg);
    } finally {
      startingRef.current = false;
    }
  }, [containerId, onScan, onError, stopScanner]);

  useEffect(() => {
    mountedRef.current = true;

    if (isActive) {
      setCameraReady(false);
      setError('');
      startScanner();
    } else {
      stopScanner();
      setCameraReady(false);
    }

    return () => {
      mountedRef.current = false;
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div style={{ width: '100%' }}>
      <div
        id={containerId}
        style={{
          width: '100%',
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: '#000',
          minHeight: 200,
        }}
      />

      {!cameraReady && !error && (
        <div style={{
          marginTop: 8,
          padding: '10px 14px',
          backgroundColor: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: 8,
          fontSize: 13,
          color: '#2563EB',
          textAlign: 'center',
        }}>
          Starting camera...
        </div>
      )}

      {error && (
        <div style={{
          marginTop: 8,
          padding: '10px 14px',
          backgroundColor: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: 8,
          fontSize: 13,
          color: '#DC2626',
        }}>
          {error}
          <div style={{ marginTop: 8 }}>
            <button
              onClick={() => { setError(''); setCameraReady(false); startScanner(); }}
              style={{
                background: '#DC2626', color: '#fff', border: 'none',
                borderRadius: 6, padding: '6px 16px', fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Retry Camera
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
