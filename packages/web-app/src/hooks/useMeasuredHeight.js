import { useCallback, useRef, useState } from 'react';

/**
 * Tracks an element's content height via ResizeObserver.
 *
 * Returns `[ref, height]`: attach `ref` to the element to measure, and `height`
 * follows its size (0 while unmounted). Uses a callback ref so it works with
 * conditionally rendered elements — it re-observes on mount and resets on
 * unmount without a separate effect.
 *
 * Main use: stacking sticky elements. CSS `position: sticky` has no way to pin
 * one element just below another; the second sticky's `top` must be the first's
 * height. Measure it here instead of hardcoding an offset that would break with
 * locale / font scaling / wrapping.
 *
 *   const [barRef, barHeight] = useMeasuredHeight();
 *   <Bar ref={barRef} sx={{ position: 'sticky', top: 0 }} />
 *   <Header sx={{ position: 'sticky', top: barHeight }} />
 */
export const useMeasuredHeight = () => {
  const [height, setHeight] = useState(0);
  const observerRef = useRef(null);

  const ref = useCallback(node => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (node) {
      observerRef.current = new ResizeObserver(([entry]) => {
        setHeight(entry.contentRect.height);
      });
      observerRef.current.observe(node);
    } else {
      setHeight(0);
    }
  }, []);

  return [ref, height];
};
