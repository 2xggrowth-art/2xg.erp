import { useEffect } from 'react';

export interface KeyboardShortcutActions {
  onCashPayment?: () => void;       // F1
  onHDFCPayment?: () => void;       // F2
  onICICIPayment?: () => void;      // F3
  onCreditSale?: () => void;        // F4
  onHoldCart?: () => void;          // F5
  onClearCart?: () => void;         // F6
  onExchangeItems?: () => void;    // F7
  onToggleView?: () => void;        // F8
  onCustomerSelect?: () => void;   // F9
  onFocusSearch?: () => void;      // F10
  onOpenCashDrawer?: () => void;   // F11
  onSplitPayment?: () => void;     // F12
  onEscape?: () => void;           // Escape - close any open modal
  onEnter?: () => void;            // Enter - confirm current action
  onCtrlF?: () => void;            // Ctrl+F - focus search bar (same as F10)
}

const F_KEY_MAP: Record<string, keyof KeyboardShortcutActions> = {
  F1: 'onCashPayment',
  F2: 'onHDFCPayment',
  F3: 'onICICIPayment',
  F4: 'onCreditSale',
  F5: 'onHoldCart',
  F6: 'onClearCart',
  F7: 'onExchangeItems',
  F8: 'onToggleView',
  F9: 'onCustomerSelect',
  F10: 'onFocusSearch',
  F11: 'onOpenCashDrawer',
  F12: 'onSplitPayment',
};

export const useKeyboardShortcuts = (
  actions: KeyboardShortcutActions,
  enabled: boolean = true
): void => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Normalize key — both e.key and e.code use the same 'F1'-'F12' format,
      // but e.key is more reliable across browsers. Fall back to e.code.
      const key = e.key || e.code;

      // Handle Ctrl+F — focus search bar
      if ((e.ctrlKey || e.metaKey) && (key === 'f' || key === 'F')) {
        e.preventDefault();
        actions.onCtrlF?.();
        return;
      }

      // Handle F-keys (F1-F12)
      const fKeyAction = F_KEY_MAP[key];
      if (fKeyAction) {
        e.preventDefault();
        actions[fKeyAction]?.();
        return;
      }

      // Handle Escape — only preventDefault if a handler is provided (modal is open)
      if (key === 'Escape') {
        if (actions.onEscape) {
          e.preventDefault();
          actions.onEscape();
        }
        return;
      }

      // Handle Enter — only preventDefault if a handler is provided (action to confirm)
      if (key === 'Enter') {
        if (actions.onEnter) {
          e.preventDefault();
          actions.onEnter();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [actions, enabled]);
};
