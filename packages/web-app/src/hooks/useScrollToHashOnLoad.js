import { useLayoutEffect } from 'react';

/**
 * After async content loads and shifts the page layout, re-snaps the viewport
 * to the current URL hash anchor (if any).
 *
 * Uses useLayoutEffect so the scroll correction fires synchronously after the
 * DOM commit and before the next paint — preventing any visible flash of the
 * wrong scroll position.
 *
 * @param {*} data - The async data whose arrival causes a layout shift.
 *                   Re-runs whenever this value changes.
 */
export const useScrollToHashOnLoad = data => {
  useLayoutEffect(() => {
    if (!data) return;
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    document.getElementById(hash)?.scrollIntoView({
      behavior: 'instant',
      block: 'start'
    });
  }, [data]);
};
