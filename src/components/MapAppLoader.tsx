"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { DiagnosticErrorBoundary } from './DiagnosticErrorBoundary';

// MapApp uses MapLibre GL (needs `window`) and browser-only APIs
// (geolocation, localStorage), so it's loaded client-only via next/dynamic.
//
// IMPORTANT: we gate this behind a `mounted` flag (set in an effect) instead
// of relying solely on next/dynamic's `loading` fallback. With `ssr: false`,
// Next renders nothing for this slot on the server, but a `loading`
// fallback would appear on the client immediately — before hydration
// finishes — which React flags as a hydration mismatch ("Expected server
// HTML to contain a matching <div> in <div>"). Rendering the exact same
// loading UI on both the server and the client's first paint (via
// `mounted`) keeps the two in sync; the dynamic import only mounts for
// real after hydration has already completed, so there's nothing left to
// mismatch.
const MapApp = dynamic(() => import('./MapApp'), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

function LoadingScreen() {
  return (
    <div className="flex h-dvh w-full items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3 text-gray-500">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-accent rounded-full animate-spin" />
        <p className="text-sm font-medium">Loading the accessibility map…</p>
      </div>
    </div>
  );
}

export function MapAppLoader() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Intentional: this is the standard, unavoidable way to detect
    // "hydration has completed" so we can safely swap from the
    // SSR-matching loading screen to the client-only map. There's no way
    // to know this without an effect, since that's precisely what "runs
    // after commit" means.
    setMounted(true);
  }, []);

  if (!mounted) {
    return <LoadingScreen />;
  }

  return (
    <DiagnosticErrorBoundary>
      <MapApp />
    </DiagnosticErrorBoundary>
  );
}
