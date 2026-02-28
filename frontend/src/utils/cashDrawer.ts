import qz from 'qz-tray';

let qzConnected = false;

/**
 * Connect to QZ Tray (running on localhost).
 * Returns true if connected, false if QZ Tray is not available.
 */
async function connectQz(): Promise<boolean> {
  if (qzConnected && qz.websocket.isActive()) {
    return true;
  }

  try {
    // Skip certificate signing for local/self-signed usage
    qz.security.setCertificatePromise(() =>
      Promise.resolve('') // No signed cert needed for local use
    );
    qz.security.setSignatureAlgorithm('SHA512');
    qz.security.setSignaturePromise(() =>
      (hash: string) => Promise.resolve('') // No signature needed for local use
    );

    await qz.websocket.connect();
    qzConnected = true;
    return true;
  } catch (err: any) {
    // "Unable to connect" = QZ Tray not running, which is expected on machines without it
    if (err?.message?.includes('Unable to connect') || err?.message?.includes('WebSocket')) {
      console.warn('QZ Tray not running — cash drawer will not auto-open.');
    } else {
      console.warn('QZ Tray connection error:', err);
    }
    qzConnected = false;
    return false;
  }
}

/**
 * Open the cash drawer by sending an ESC/POS kick command through the printer.
 * Silently fails if QZ Tray is not installed/running — does not block the sale.
 */
export async function openCashDrawer(): Promise<void> {
  try {
    const connected = await connectQz();
    if (!connected) return;

    // Find the default printer (the thermal receipt printer)
    const printer = await qz.printers.getDefault();
    if (!printer) {
      console.warn('No default printer found for cash drawer kick.');
      return;
    }

    // ESC/POS cash drawer kick command: ESC p 0 25 250
    // Pin 2, ON time 50ms, OFF time 500ms
    const config = qz.configs.create(printer);
    const data = [
      { type: 'raw', format: 'hex', data: '1B700019FA' }
    ];

    await qz.print(config, data);
  } catch (err) {
    // Never block the sale — just log
    console.warn('Cash drawer kick failed:', err);
  }
}

/**
 * Check if QZ Tray is available (for UI indicators).
 */
export async function isQzAvailable(): Promise<boolean> {
  return connectQz();
}
