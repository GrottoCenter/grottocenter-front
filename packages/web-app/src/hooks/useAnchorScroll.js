import { useEffect } from 'react';

/**
 * Scrolls to the element matching anchorId on mount and on hash changes.
 * @param {string|undefined} anchorId
 */
export const useAnchorScroll = anchorId => {
  useEffect(() => {
    if (!anchorId) return undefined;
    const scrollIfMatch = () => {
      if (window.location.hash.slice(1) === anchorId)
        document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth' });
    };
    scrollIfMatch();
    window.addEventListener('hashchange', scrollIfMatch);
    return () => window.removeEventListener('hashchange', scrollIfMatch);
  }, [anchorId]);
};
