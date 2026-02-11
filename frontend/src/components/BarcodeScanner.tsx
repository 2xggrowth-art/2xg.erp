import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  isActive: boolean;
  onError?: (err: string) => void;
}

const FORMATS = [
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
      // ignore
    }
    try {
      scanner.clear();
    } catch {
      // ignore
    }
  }, []);

  // Try to enable continuous autofocus on the active video track
  const enableAutofocus = useCallback(() => {
    try {
      const videoEl = document.querySelector(`#${containerId} video`) as HTMLVideoElement | null;
      if (!videoEl?.srcObject) return;
      const stream = videoEl.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      if (!track) return;
      const capabilities = track.getCapabilities?.();
      if (capabilities && 'focusMode' in capabilities) {
        const focusModes = (capabilities as any).focusMode as string[];
        if (focusModes?.includes('continuous')) {
          track.applyConstraints({ advanced: [{ focusMode: 'continuous' } as any] });
        }
      }
    } catch {
      // Not all browsers support this — ignore
    }
  }, [containerId]);

  const startScanner = useCallback(async () => {
    if (startingRef.current) return;
    startingRef.current = true;

    try {
      await stopScanner();
      if (!mountedRef.current) return;

      await new Promise(r => setTimeout(r, 300));
      if (!mountedRef.current) return;

      const el = document.getElementById(containerId);
      if (!el) return;

      // Don't use native BarcodeDetector — ZXing is more reliable for 1D barcodes
      const scanner = new Html5Qrcode(containerId, {
        formatsToSupport: FORMATS,
        useBarCodeDetectorIfSupported: false,
      });
      scannerRef.current = scanner;

      // Responsive scan box — wide for 1D barcodes
      const qrboxFunction = (vw: number, vh: number) => ({
        width: Math.floor(vw * 0.9),
        height: Math.floor(Math.min(vw, vh) * 0.3),
      });

      const config: any = {
        fps: 20,
        qrbox: qrboxFunction,
        disableFlip: true,
        // Request high resolution + autofocus for barcode scanning
        videoConstraints: {
          facingMode: 'environment',
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          advanced: [{ focusMode: 'continuous' }] as any,
        },
      };

      const onSuccess = (decodedText: string) => {
        const now = Date.now();
        if (decodedText === lastScanRef.current && now - lastScanTimeRef.current < 2000) return;
        lastScanRef.current = decodedText;
        lastScanTimeRef.current = now;
        if (navigator.vibrate) navigator.vibrate(100);
        onScan(decodedText);
      };

      const onFailure = () => {
        // No barcode in frame — ignore
      };

      // Strategy: try facingMode environment directly (most reliable on mobile)
      // Skip getCameras() — it's unreliable on mobile and adds latency
      const attempts = [
        { facingMode: { exact: 'environment' } },
        { facingMode: 'environment' },
        { facingMode: 'user' },
      ];

      let started = false;
      for (const cameraConfig of attempts) {
        if (!mountedRef.current) return;
        try {
          // Need a fresh scanner instance for each attempt after the first
          if (started === false && scannerRef.current === scanner) {
            await scanner.start(cameraConfig as any, config, onSuccess, onFailure);
          } else {
            // Create fresh instance
            scannerRef.current = null;
            try { scanner.clear(); } catch { /* ignore */ }
            const fresh = new Html5Qrcode(containerId, {
              formatsToSupport: FORMATS,
              useBarCodeDetectorIfSupported: false,
            });
            scannerRef.current = fresh;
            await fresh.start(cameraConfig as any, config, onSuccess, onFailure);
          }
          started = true;
          break;
        } catch {
          // Try next camera config
        }
      }

      if (!started) {
        throw new Error('Could not start any camera. Please check camera permissions.');
      }

      if (mountedRef.current) {
        setCameraReady(true);
        setError('');
        // Enable autofocus after camera is running
        setTimeout(enableAutofocus, 500);
      }
    } catch (err: any) {
      if (!mountedRef.current) return;
      const msg = err?.message || String(err);
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
  }, [containerId, onScan, onError, stopScanner, enableAutofocus]);

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
          minHeight: 250,
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

      {cameraReady && (
        <div style={{
          marginTop: 8,
          padding: '8px 14px',
          backgroundColor: '#F0FDF4',
          border: '1px solid #BBF7D0',
          borderRadius: 8,
          fontSize: 12,
          color: '#15803D',
          textAlign: 'center',
        }}>
          Point camera at barcode — hold steady and close
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
