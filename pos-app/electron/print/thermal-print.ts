// ESC/POS commands for thermal printers
// These are raw byte sequences for direct thermal printer communication

export const ESC_POS = {
  // Initialize printer
  INIT: Buffer.from([0x1b, 0x40]),

  // Text alignment
  ALIGN_LEFT: Buffer.from([0x1b, 0x61, 0x00]),
  ALIGN_CENTER: Buffer.from([0x1b, 0x61, 0x01]),
  ALIGN_RIGHT: Buffer.from([0x1b, 0x61, 0x02]),

  // Text style
  BOLD_ON: Buffer.from([0x1b, 0x45, 0x01]),
  BOLD_OFF: Buffer.from([0x1b, 0x45, 0x00]),
  DOUBLE_HEIGHT_ON: Buffer.from([0x1b, 0x21, 0x10]),
  DOUBLE_WIDTH_ON: Buffer.from([0x1b, 0x21, 0x20]),
  DOUBLE_SIZE_ON: Buffer.from([0x1b, 0x21, 0x30]),
  NORMAL_SIZE: Buffer.from([0x1b, 0x21, 0x00]),

  // Line feed
  LINE_FEED: Buffer.from([0x0a]),
  DOUBLE_LINE_FEED: Buffer.from([0x0a, 0x0a]),

  // Cut paper
  CUT_PAPER: Buffer.from([0x1d, 0x56, 0x00]), // Full cut
  CUT_PAPER_PARTIAL: Buffer.from([0x1d, 0x56, 0x01]), // Partial cut

  // Cash drawer kick
  // Pin 2: ESC p 0 25 250
  CASH_DRAWER_KICK: Buffer.from([0x1b, 0x70, 0x00, 0x19, 0xfa]),
  // Pin 5: ESC p 1 25 250
  CASH_DRAWER_KICK_PIN5: Buffer.from([0x1b, 0x70, 0x01, 0x19, 0xfa]),

  // Separator line (48 chars for 80mm, 32 for 58mm)
  SEPARATOR_80MM: '------------------------------------------------',
  SEPARATOR_58MM: '--------------------------------',
  SEPARATOR_DASHED_80MM: '- - - - - - - - - - - - - - - - - - - - - - - - ',
  SEPARATOR_DASHED_58MM: '- - - - - - - - - - - - - - - - ',
};

export function buildCashDrawerCommand(): Buffer {
  return ESC_POS.CASH_DRAWER_KICK;
}

// Note: Raw ESC/POS printing requires direct serial/USB communication
// which is platform-specific. For now, we use Electron's HTML printing
// as the primary method. ESC/POS support can be added later using
// a library like node-thermal-printer or direct USB communication.
