import { useRef, useCallback, useEffect } from 'react';

// Fires `onLongPress({ x, y })` after `delay` ms of continuous touch.
// The touch is cancelled if the finger moves more than `moveThreshold` px
// (a scroll gesture) or lifts before the timer fires (a normal tap).
export const useLongPress = (
  onLongPress,
  { delay = 500, moveThreshold = 10 } = {}
) => {
  const timerRef = useRef(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  // Cleared on unmount. Checked inside the timer callback because a timer
  // that already elapsed but whose callback is queued for the next tick is
  // not stopped by `clearTimeout` — so the ref, not the timer id, is what
  // actually prevents `onLongPress` from firing against a torn-down consumer.
  const isMountedRef = useRef(true);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      isMountedRef.current = false;
      cancel();
    },
    [cancel]
  );

  const onTouchStart = useCallback(
    e => {
      const touch = e.touches[0];
      startPosRef.current = { x: touch.clientX, y: touch.clientY };
      cancel();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (!isMountedRef.current) return;
        onLongPress({ x: touch.clientX, y: touch.clientY });
      }, delay);
    },
    [onLongPress, delay, cancel]
  );

  const onTouchMove = useCallback(
    e => {
      const touch = e.touches[0];
      const dx = touch.clientX - startPosRef.current.x;
      const dy = touch.clientY - startPosRef.current.y;
      if (Math.hypot(dx, dy) > moveThreshold) cancel();
    },
    [cancel, moveThreshold]
  );

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd: cancel,
    onTouchCancel: cancel
  };
};
