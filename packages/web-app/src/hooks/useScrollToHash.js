import { useEffect } from 'react';

/**
 * Scrolls to the element matching window.location.hash once the page content is ready.
 * Needed for SPAs where sections are rendered asynchronously after data fetch.
 * @param {boolean} isReady - true when the page data has loaded and sections are in the DOM
 */
export const useScrollToHash = isReady => {
  useEffect(() => {
    if (!isReady) return;
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, [isReady]);
};
