"use client";

import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setIsInstallable(false);
    });
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return { isInstallable, isInstalled, install };
}

// ── Sidebar card variant (used inside app layout) ──────────────
export default function InstallPrompt() {
  const { isInstallable, isInstalled, install } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || !isInstallable || dismissed) return null;

  return (
    <div className="mx-4 mb-3 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl p-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-xs font-bold text-white">Install App</p>
        <button onClick={() => setDismissed(true)} className="text-white/60 hover:text-white">
          <X size={13} />
        </button>
      </div>
      <p className="text-[10px] text-white/70 mb-2.5 leading-relaxed">
        Add MarketLens to your home screen for quick offline access.
      </p>
      <button
        onClick={install}
        className="w-full flex items-center justify-center gap-1.5 py-2 bg-white text-[#ca1551] text-xs font-bold rounded-lg hover:bg-rose-50 transition-colors"
      >
        <Download size={12} /> Install App
      </button>
    </div>
  );
}

// ── Navbar button variant (used on landing page) ───────────────
export function InstallButton({ className }: { className?: string }) {
  const { isInstallable, isInstalled, install } = useInstallPrompt();

  if (isInstalled || !isInstallable) return null;

  return (
    <button
      onClick={install}
      className={className ?? "flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-[#ca1551] transition-colors px-4 py-2"}
    >
      <Smartphone size={15} />
      Install App
    </button>
  );
}

// ── Hero CTA variant (larger, prominent) ──────────────────────
export function InstallHeroCTA() {
  const { isInstallable, isInstalled, install } = useInstallPrompt();

  if (isInstalled || !isInstallable) return null;

  return (
    <button
      onClick={install}
      className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#ca1551]/30 bg-rose-50 hover:bg-rose-100 text-[#ca1551] font-bold rounded-xl transition-colors text-sm"
    >
      <Smartphone size={16} />
      Install App — Free
    </button>
  );
}
