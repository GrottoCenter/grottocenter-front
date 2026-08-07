import { useEffect } from 'react';

// Hold a screen wake lock while `active`. Field navigation is the whole point of
// the map's location tracking, and the screen locking is precisely what silently
// kills the geolocation watch — on top of making the map unreadable while
// walking towards an entrance.
//
// Best-effort by design: the API is missing on some browsers and the request can
// be refused (low battery, no user activation). The browser also releases the
// lock on its own whenever the page is hidden, so we re-acquire on every return
// to the foreground instead of assuming the first request holds for good.
const useWakeLock = active => {
  useEffect(() => {
    if (!active || !navigator.wakeLock) return undefined;

    let sentinel = null;
    let released = false;

    const acquire = async () => {
      if (released || sentinel || document.visibilityState !== 'visible') {
        return;
      }
      try {
        const lock = await navigator.wakeLock.request('screen');
        // The effect may have been cleaned up while the request was pending.
        if (released) {
          lock.release();
          return;
        }
        sentinel = lock;
        // Re-arm the guard above once the browser drops the lock by itself.
        lock.addEventListener('release', () => {
          sentinel = null;
        });
      } catch (_e) {
        // Unsupported or refused — tracking still works, just not the screen.
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') acquire();
    };

    acquire();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      released = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (sentinel) sentinel.release();
      sentinel = null;
    };
  }, [active]);
};

export default useWakeLock;
