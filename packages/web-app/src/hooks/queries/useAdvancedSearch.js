import { useEffect, useSyncExternalStore } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { advancedSearchUrl } from '../../conf/apiRoutes';
import { apiPost } from '../../api/client';
import { advancedSearchKeys } from '../../api/queryKeys';
import { STALE } from '../../conf/queryClient';

// Small pub/sub for the "currently displayed" search params. Forms submit
// params via startAdvancedSearch/refineAdvancedSearch; SearchResults reads
// them and re-fetches. Module-scope because only one advanced search is
// active app-wide at a time — matches the pre-migration global reducer
// state, so no context provider is needed at the tree root.
const INITIAL = { params: null, isNewQuery: false };
let state = INITIAL;
const listeners = new Set();
const emit = next => {
  state = next;
  listeners.forEach(l => l());
};
const subscribe = cb => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const getSnapshot = () => state;
const getServerSnapshot = () => INITIAL;

// Fresh form submission: bumps isNewQuery so DesktopEntityTable/MobileEntityList
// reset their page/sort/selection effect (matches the legacy behaviour that
// FETCH_ADVANCEDSEARCH with isNewQuery=true drove).
export const startAdvancedSearch = params => emit({ params, isNewQuery: true });

// Pagination / sort continuation on the same submitted search — keeps the
// table state stable.
export const refineAdvancedSearch = params =>
  emit({ params, isNewQuery: false });

// Clears the current search — called by form reset paths and mount cleanups.
export const resetAdvancedSearch = () => emit(INITIAL);

const useSearchState = () =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

/**
 * Shared query for the currently displayed advanced search. All forms feed
 * the same singleton — reading is decoupled from writing so the SearchResults
 * component can be mounted separately from the form.
 *
 * Volatile cache: results can be very large (thousands of rows) and stale
 * quickly on live data, so `gcTime` is kept short to release the memory as
 * soon as the last consumer unmounts.
 */
export const useAdvancedSearch = () => {
  const { params, isNewQuery } = useSearchState();
  const query = useQuery({
    queryKey: advancedSearchKeys.results(params),
    queryFn: () => apiPost(advancedSearchUrl, params),
    enabled: !!params?.entity,
    // Pagination and sorting change the query key. Keep the current page in
    // place while its continuation loads so EntityTable is not unmounted and
    // does not lose its local page state. A genuinely new search deliberately
    // starts from its loading state and resets the table controls instead.
    placeholderData: isNewQuery ? undefined : keepPreviousData,
    staleTime: STALE.VOLATILE,
    gcTime: 60 * 1000
  });

  // The legacy reducer returned isNewQuery to false on
  // FETCH_ADVANCEDSEARCH_SUCCESS so the next form submit could flip it back
  // to true and re-fire the DesktopEntityTable reset effect. Match that
  // here — clear the flag once a fetch has landed (or the query is not
  // currently fetching).
  useEffect(() => {
    if (isNewQuery && !query.isFetching) {
      emit({ ...state, isNewQuery: false });
    }
  }, [isNewQuery, query.isFetching]);

  return { ...query, isNewQuery, params };
};

export default useAdvancedSearch;
