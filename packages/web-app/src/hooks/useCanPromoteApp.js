import { useState } from 'react';

// True when it makes sense to show a "download the app" CTA to this visitor —
// i.e. they are NOT already running the installed PWA / Android TWA. Same
// display-mode heuristic as src/index.jsx's ensurePersistentStorage gate, plus
// a referrer check for the Android TWA (`android-app://org.grottocenter.twa`).
export function useCanPromoteApp() {
  const [canPromote] = useState(() => {
    if (typeof window === 'undefined') return false;
    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    const isFromTWA = document.referrer.startsWith(
      'android-app://org.grottocenter.twa'
    );
    return !isStandalone && !isFromTWA;
  });
  return canPromote;
}
