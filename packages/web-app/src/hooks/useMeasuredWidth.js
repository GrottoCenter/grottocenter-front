import { useCallback, useRef, useState } from 'react';

/**
 * Tracks an element's content width via ResizeObserver.
 *
 * Returns `[ref, width]`: attach `ref` to the element to measure, and `width`
 * follows its size (0 while unmounted). Callback ref, so it works with
 * conditionally rendered elements — it re-observes on mount and resets on
 * unmount without a separate effect. Sibling of [useMeasuredHeight].
 *
 * Main use: fitting a canvas to its container. A canvas has no intrinsic
 * layout size — its bitmap dimensions must be set in JS — so anything drawn
 * "to the width of the box" has to read that width back from the DOM, and
 * redraw when it changes (orientation flip, sidebar collapse, window resize).
 *
 *   const [boxRef, boxWidth] = useMeasuredWidth();
 *   <Box ref={boxRef}><canvas ref={canvasRef} /></Box>
 */
export const useMeasuredWidth = () => {
  const [width, setWidth] = useState(0);
  const observerRef = useRef(null);

  const ref = useCallback(node => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (node) {
      observerRef.current = new ResizeObserver(([entry]) => {
        setWidth(entry.contentRect.width);
      });
      observerRef.current.observe(node);
    } else {
      setWidth(0);
    }
  }, []);

  return [ref, width];
};
