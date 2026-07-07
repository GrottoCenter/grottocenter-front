import { useState, useEffect, useRef } from 'react';
import { fetchQuickSearchRaw } from '../actions/Quicksearch';
import {
  AUTOCOMPLETE_DEBOUNCE_DELAY,
  AUTOCOMPLETE_MIN_CHARACTERS
} from '../conf/config';
import { useDebounce } from './useDebounce';

/**
 * Encapsulates the debounced quick-search behind an autocomplete field: owns
 * the input value, debounces it, gates on a minimum length, calls the search
 * endpoint and drops stale/out-of-order responses. Presentation (single vs
 * multiple, option rendering, inline creation…) stays with each caller.
 *
 * @param {string[]} entities - Quicksearch entity collections, e.g. ['caves'].
 * @param {object} [opts]
 * @param {boolean} [opts.enabled=true] - When false, no request is made.
 * @param {number}  [opts.minChars] - Min characters before searching.
 * @param {object}  [opts.filter] - Extra quicksearch filter.
 * @param {string}  [opts.skipQuery] - When the (trimmed) input equals this, no
 *   request is made. Used to avoid re-searching the exact label of an already
 *   selected option (e.g. a single-select field that keeps showing its pick).
 * @returns {{
 *   inputValue: string,
 *   setInputValue: (v: string) => void,
 *   results: Array,
 *   isLoading: boolean,
 *   hasError: boolean
 * }}
 */
export const useEntitySearch = (
  entities,
  { enabled = true, minChars = AUTOCOMPLETE_MIN_CHARACTERS, filter, skipQuery } = {}
) => {
  const [inputValue, setInputValue] = useState('');
  const debouncedQuery = useDebounce(
    inputValue.trim(),
    AUTOCOMPLETE_DEBOUNCE_DELAY
  );
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  // Incremented on every change; lets us drop stale/out-of-order responses.
  const requestIdRef = useRef(0);

  // Serialise object/array params into stable *dependency keys* so passing
  // inline literals (a new reference each render) doesn't retrigger the effect
  // on every render. The effect uses the real `entities`/`filter` from its
  // closure (always in sync with the keys, since the keys derive from them);
  // the keys are only there to decide when to re-run.
  const entitiesKey = JSON.stringify(entities);
  const filterKey = filter ? JSON.stringify(filter) : '';

  useEffect(() => {
    if (!enabled || debouncedQuery.length < minChars || debouncedQuery === skipQuery) {
      requestIdRef.current += 1; // Cancel any in-flight response.
      setResults([]);
      setIsLoading(false);
      setHasError(false);
      return undefined;
    }

    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    setIsLoading(true);
    setHasError(false);

    fetchQuickSearchRaw({
      query: debouncedQuery,
      entities,
      filter: filter ?? {}
    })
      .then(data => {
        if (requestId !== requestIdRef.current) return; // Stale.
        setResults(data?.results ?? []);
        setIsLoading(false);
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return; // Stale.
        setResults([]);
        setHasError(true);
        setIsLoading(false);
      });

    // On unmount (or before the next run) bump the id so the in-flight response
    // is treated as stale and never calls setState on an unmounted component.
    return () => {
      requestIdRef.current += 1;
    };
    // entities/filter are intentionally tracked through their serialised keys
    // (entitiesKey/filterKey) rather than by reference, so inline literals don't
    // retrigger the effect every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, enabled, minChars, entitiesKey, filterKey, skipQuery]);

  return { inputValue, setInputValue, results, isLoading, hasError };
};

export default useEntitySearch;
