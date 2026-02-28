import qz from 'qz-tray';

let qzConnected = false;
let securityInitialized = false;

function initSecurity() {
  if (securityInitialized) return;
  qz.security.setCertificatePromise(() => Promise.resolve(''));
  qz.security.setSignatureAlgorithm('SHA512');
  qz.security.setSignaturePromise(() =>
    (hash: string) => Promise.resolve('')
  );
  securityInitialized = true;
}

/**
 * Connect to QZ Tray (running on localhost).
 * Returns true if connected, false if QZ Tray is not available.
 */
async function connectQz(): Promise<boolean> {
  if (qzConnected && qz.websocket.isActive()) {
    return true;
  }

  try {
    initSecurity();
    await qz.websocket.connect();
    qzConnected = true;
    return true;
  } catch (err: any) {
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

    const printer = await qz.printers.getDefault();
    if (!printer) {
      console.warn('No default printer found for cash drawer kick.');
      return;
    }

    // ESC/POS cash drawer kick command: ESC p 0 25 250
    const config = qz.configs.create(printer);
    const data = [
      { type: 'raw', format: 'hex', data: '1B700019FA' }
    ];

    await qz.print(config, data);
  } catch (err) {
    console.warn('Cash drawer kick failed:', err);
  }
}

/**
 * Check if QZ Tray + printer is available. Used for the status indicator.
 */
export async function checkPrinterStatus(): Promise<boolean> {
  try {
    const connected = await connectQz();
    if (!connected) return false;
    const printer = await qz.printers.getDefault();
    return !!printer;
  } catch {
    return false;
  }
}
