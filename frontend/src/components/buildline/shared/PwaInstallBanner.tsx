import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Check if user previously dismissed
    const wasDismissed = sessionStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) setDismissed(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already installed, dismissed, or no prompt available
  if (isStandalone || dismissed || !deferredPrompt) return null;

  return (
    <div className="mx-4 mt-3 mb-1 bg-blue-600 text-white rounded-xl p-4 flex items-center gap-3 shadow-lg animate-in">
      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
        <Download className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">Install 2XG Buildline</p>
        <p className="text-xs text-blue-100">Add to home screen for quick access</p>
      </div>
      <button
        onClick={handleInstall}
        className="px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-semibold flex-shrink-0 active:scale-95 transition-transform"
      >
        Install
      </button>
      <button
        onClick={handleDismiss}
        className="p-1 text-blue-200 hover:text-white flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
