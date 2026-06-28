import { useState, useEffect, useRef } from 'react';
import { fetchQuickSearchRaw } from '../actions/Quicksearch';
import {
  AUTOCOMPLETE_DEBOUNCE_DELAY,
  AUTOCOMPLETE_MIN_CHARACTERS
} from '../conf/config';
import { useDebounce } from './useDebounce';

const MAX_RESULTS = 10;

/**
 * Suggests existing entrances whose name matches the typed text, to help the
 * user spot a duplicate before creating one. Purely informational: it never
 * mutates form state.
 *
 * - Debounces input by 300 ms.
 * - Stays empty (and cancels any pending request) below 2 characters.
 * - Caps results at 10 (the quick-search endpoint returns up to 20).
 * - Swallows errors silently so the creation flow is never blocked.
 *
 * @param {string} name - The current name field value.
 * @param {boolean} [enabled=true] - Disable in edit mode.
 * @returns {{suggestions: Array, isLoading: boolean}}
 */
export const useNameDuplicateSuggestions = (name, enabled = true) => {
  const trimmed = (name ?? '').trim();
  const debouncedQuery = useDebounce(trimmed, AUTOCOMPLETE_DEBOUNCE_DELAY);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  // Incremented on every change; lets us drop stale/out-of-order responses.
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!enabled || debouncedQuery.length < AUTOCOMPLETE_MIN_CHARACTERS) {
      requestIdRef.current += 1; // Cancel any in-flight response.
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    setIsLoading(true);

    fetchQuickSearchRaw({
      query: debouncedQuery,
      entities: ['entrances'],
      filter: {}
    })
      .then(data => {
        if (requestId !== requestIdRef.current) return; // Stale.
        setSuggestions((data?.results ?? []).slice(0, MAX_RESULTS));
        setIsLoading(false);
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return; // Stale.
        setSuggestions([]);
        setIsLoading(false);
      });
  }, [debouncedQuery, enabled]);

  return { suggestions, isLoading };
};

export default useNameDuplicateSuggestions;
