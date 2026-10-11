import { useCallback, useEffect, useRef, useState } from 'react';

const TARGET_ACCURACY_METERS = 3;
const ACQUISITION_TIMEOUT_MS = 60000;

// Placement needs a bounded acquisition that keeps the best fix, unlike
// useGeolocation's ongoing navigation watch, which follows every new position.
// Start directly from the button's gesture so temporary permissions work too.
const usePreciseGeolocation = () => {
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState(null);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const sessionRef = useRef(null);

  const clearSession = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    sessionRef.current = null;
    clearTimeout(session.timerId);
    if (session.watchId !== null) {
      session.geolocation.clearWatch(session.watchId);
    }
  }, []);

  const cancel = useCallback(() => {
    clearSession();
    setIsLocating(false);
  }, [clearSession]);

  useEffect(() => clearSession, [clearSession]);

  const locate = useCallback(
    onPosition => {
      clearSession();
      setError(null);
      setHasTimedOut(false);
      const { geolocation } = navigator;
      if (!geolocation) {
        setError(2);
        setIsLocating(false);
        return;
      }

      setIsLocating(true);
      const session = {
        geolocation,
        watchId: null,
        timerId: null,
        bestAccuracy: null,
        lastError: 3
      };
      sessionRef.current = session;
      session.timerId = setTimeout(() => {
        if (sessionRef.current !== session) return;
        setHasTimedOut(true);
        if (session.bestAccuracy === null) setError(session.lastError);
        cancel();
      }, ACQUISITION_TIMEOUT_MS);

      session.watchId = geolocation.watchPosition(
        position => {
          if (sessionRef.current !== session) return;
          const { accuracy } = position.coords;
          if (!Number.isFinite(accuracy) || accuracy < 0) return;
          if (
            session.bestAccuracy !== null &&
            accuracy >= session.bestAccuracy
          ) {
            return;
          }
          session.bestAccuracy = accuracy;
          onPosition(position);
          if (accuracy <= TARGET_ACCURACY_METERS) cancel();
        },
        positionError => {
          if (sessionRef.current !== session) return;
          session.lastError = positionError.code;
          // A watch can recover from unavailable/timeout errors. Only a denied
          // permission is terminal; otherwise keep trying until the deadline.
          if (positionError.code === 1) {
            setError(1);
            cancel();
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: ACQUISITION_TIMEOUT_MS
        }
      );
      // Native callbacks are asynchronous, but synchronous implementations
      // must not leak a watch if the first callback already ended the session.
      if (sessionRef.current !== session) {
        geolocation.clearWatch(session.watchId);
      }
    },
    [clearSession, cancel]
  );

  return { locate, cancel, isLocating, error, hasTimedOut };
};

export default usePreciseGeolocation;
