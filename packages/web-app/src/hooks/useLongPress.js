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

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Cancel any pending timer if the consumer unmounts before it fires,
  // to avoid onLongPress being called against an unmounted component.
  useEffect(() => cancel, [cancel]);

  const onTouchStart = useCallback(
    e => {
      const touch = e.touches[0];
      startPosRef.current = { x: touch.clientX, y: touch.clientY };
      cancel();
      timerRef.current = setTimeout(() => {
        onLongPress({ x: touch.clientX, y: touch.clientY });
        timerRef.current = null;
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
