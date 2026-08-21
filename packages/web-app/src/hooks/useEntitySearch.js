import { useState } from 'react';
import { AUTOCOMPLETE_DEBOUNCE_DELAY } from '../conf/config';
import { useDebounce } from './useDebounce';
import { useQuickSearch } from './queries/useQuickSearch';

/**
 * Encapsulates the debounced quick-search behind an autocomplete field: owns
 * the input value, debounces it, gates on a minimum length, calls the search
 * endpoint. Presentation (single vs multiple, option rendering, inline
 * creation…) stays with each caller.
 *
 * React Query cancels stale/out-of-order responses natively via its queryKey,
 * so the request-id ref dance from the pre-migration implementation is gone.
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
  { enabled = true, minChars, filter, skipQuery } = {}
) => {
  const [inputValue, setInputValue] = useState('');
  const debouncedQuery = useDebounce(
    inputValue.trim(),
    AUTOCOMPLETE_DEBOUNCE_DELAY
  );
  const effectiveQuery = debouncedQuery === skipQuery ? '' : debouncedQuery;

  const query = useQuickSearch({
    query: effectiveQuery,
    entities,
    filter,
    enabled,
    minChars
  });

  return {
    inputValue,
    setInputValue,
    results: query.data?.results ?? [],
    isLoading: query.isFetching,
    hasError: !!query.error
  };
};

export default useEntitySearch;
