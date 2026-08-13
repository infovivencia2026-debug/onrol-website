import React, { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

interface OfflineBannerProps {
  isOffline: boolean;
}

export default function OfflineBanner({ isOffline }: OfflineBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isOffline) {
      setDismissed(false);
    }
  }, [isOffline]);

  if (!isOffline || dismissed) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-amber-600 text-white text-sm py-2 px-4 flex items-center justify-between"
      style={{
        animation: "slideUp 0.2s ease-out",
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 flex-shrink-0" />
        <span>You're offline — changes will sync when reconnected</span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="ml-4 flex-shrink-0 text-white hover:text-amber-100 transition-colors leading-none text-lg font-medium w-6 h-6 flex items-center justify-center"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
