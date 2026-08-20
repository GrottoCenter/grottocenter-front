import { AUTOCOMPLETE_DEBOUNCE_DELAY } from '../conf/config';
import { useDebounce } from './useDebounce';
import { useQuickSearch } from './queries/useQuickSearch';

const MAX_RESULTS = 10;
const ENTITIES = ['entrances'];

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
  const query = useQuickSearch({
    query: debouncedQuery,
    entities: ENTITIES,
    enabled
  });
  return {
    suggestions: (query.data?.results ?? []).slice(0, MAX_RESULTS),
    isLoading: query.isFetching
  };
};

export default useNameDuplicateSuggestions;
