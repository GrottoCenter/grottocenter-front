import { useCallback, useEffect, useRef, useState } from 'react';

// Hard rate limit (ms) between two heading updates, plus the minimum angular
// change (degrees) required to emit a new value. The sensor fires at ~60Hz;
// each emitted value triggers a full map rotation redraw, so we cap the rate
// AND drop sub-threshold jitter to keep the map responsive.
const THROTTLE_MS = 120;
const MIN_DELTA_DEG = 2;
// If no valid heading is received within this delay after starting, we consider
// the device has no usable compass (e.g. a desktop that exposes the API but has
// no sensor) and surface an 'unavailable' error instead of silently doing nothing.
const NO_DATA_TIMEOUT_MS = 2500;

// The compass only makes sense on a device with an orientation sensor: a phone
// or tablet. Desktops expose DeviceOrientationEvent but never fire it, so we
// gate on a touch / coarse pointer. DevTools device emulation sets these too,
// so the button stays visible (and testable via the Sensors panel) there.
const detectSupport = () => {
  if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) {
    return false;
  }
  return (
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
    (typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: coarse)').matches)
  );
};

// iOS 13+ gates the Device Orientation API behind an explicit user-gesture
// permission prompt exposed as DeviceOrientationEvent.requestPermission().
const needsPermissionRequest = () =>
  typeof DeviceOrientationEvent !== 'undefined' &&
  typeof DeviceOrientationEvent.requestPermission === 'function';

// Derive a compass heading (0 = North, clockwise) from a device orientation event.
// iOS exposes the ready-to-use webkitCompassHeading; elsewhere we rely on the
// absolute alpha angle (alpha increases counter-clockwise, hence 360 - alpha).
const getHeadingFromEvent = event => {
  if (typeof event.webkitCompassHeading === 'number') {
    return event.webkitCompassHeading;
  }
  if (event.absolute && typeof event.alpha === 'number') {
    return 360 - event.alpha;
  }
  return null;
};

const useDeviceOrientation = () => {
  const [isSupported] = useState(detectSupport);
  const [heading, setHeading] = useState(null);
  // null | 'denied' | 'unavailable'
  const [error, setError] = useState(null);

  const lastEmitRef = useRef(0);
  const lastHeadingRef = useRef(null);
  const noDataTimerRef = useRef(null);

  const clearNoDataTimer = useCallback(() => {
    if (noDataTimerRef.current) {
      clearTimeout(noDataTimerRef.current);
      noDataTimerRef.current = null;
    }
  }, []);

  const handleOrientation = useCallback(
    event => {
      const nextHeading = getHeadingFromEvent(event);
      if (nextHeading === null) return;

      // First real reading: the device has a working compass.
      clearNoDataTimer();

      // Hard rate cap first: never emit more than once per THROTTLE_MS,
      // whatever the sensor frequency.
      const now = Date.now();
      if (now - lastEmitRef.current < THROTTLE_MS) return;

      // Then drop sub-threshold jitter to avoid needless redraws.
      const previous = lastHeadingRef.current;
      const delta =
        previous === null
          ? MIN_DELTA_DEG
          : Math.abs(((nextHeading - previous + 540) % 360) - 180);
      if (delta < MIN_DELTA_DEG) return;

      lastEmitRef.current = now;
      lastHeadingRef.current = nextHeading;
      setHeading(Math.round(nextHeading));
    },
    [clearNoDataTimer]
  );

  const removeListeners = useCallback(() => {
    window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
    window.removeEventListener('deviceorientation', handleOrientation, true);
  }, [handleOrientation]);

  const stop = useCallback(() => {
    clearNoDataTimer();
    removeListeners();
    setError(null);
    setHeading(null);
    lastHeadingRef.current = null;
  }, [clearNoDataTimer, removeListeners]);

  const start = useCallback(async () => {
    if (!isSupported) return false;
    setError(null);
    if (needsPermissionRequest()) {
      try {
        const result = await DeviceOrientationEvent.requestPermission();
        if (result !== 'granted') {
          setError('denied');
          return false;
        }
      } catch (e) {
        setError('denied');
        return false;
      }
    }
    window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    window.addEventListener('deviceorientation', handleOrientation, true);
    // Surface a clear error if no reading ever comes (device without a sensor).
    clearNoDataTimer();
    noDataTimerRef.current = setTimeout(() => {
      removeListeners();
      setError('unavailable');
    }, NO_DATA_TIMEOUT_MS);
    return true;
  }, [isSupported, handleOrientation, clearNoDataTimer, removeListeners]);

  // Safety net: always detach listeners / timers when the consumer unmounts.
  useEffect(
    () => () => {
      clearNoDataTimer();
      removeListeners();
    },
    [clearNoDataTimer, removeListeners]
  );

  return { heading, isSupported, error, start, stop };
};

export default useDeviceOrientation;
