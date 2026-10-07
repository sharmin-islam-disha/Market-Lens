"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Already installed (running in standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setShow(false);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
    setShow(false);
  };

  if (installed || !show) return null;

  return (
    <div className="mx-4 mb-3 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl p-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-xs font-bold text-white">Install App</p>
        <button onClick={() => setShow(false)} className="text-white/60 hover:text-white">
          <X size={13} />
        </button>
      </div>
      <p className="text-[10px] text-white/70 mb-2.5 leading-relaxed">
        Add MarketLens to your home screen for quick access offline.
      </p>
      <button
        onClick={handleInstall}
        className="w-full flex items-center justify-center gap-1.5 py-2 bg-white text-[#ca1551] text-xs font-bold rounded-lg hover:bg-rose-50 transition-colors"
      >
        <Download size={12} /> Install App
      </button>
    </div>
  );
}
