import { useCallback, useMemo } from 'react';

import {
  DEFAULT_ENTRANCE_FILTERS,
  DEFAULT_QUALITY_FILTERS,
  DEFAULT_MIN_INTEREST
} from '@/utils/entranceMapFilters';
import { interestToStars, starsToInterest } from '@/utils/interest';
import useLocalStorage from './useLocalStorage';

// Keep the existing storage keys so map preferences survive this refactor.
const useEntranceFilters = () => {
  const [sizes, setSizes] = useLocalStorage(
    'grottocenter_activeEntranceFilters',
    DEFAULT_ENTRANCE_FILTERS,
    { merge: true }
  );
  const [qualities, setQualities] = useLocalStorage(
    'grottocenter_activeQualityFilters',
    DEFAULT_QUALITY_FILTERS,
    { merge: true }
  );
  const [storedMinInterest, setMinInterest] = useLocalStorage(
    'grottocenter_minInterest',
    DEFAULT_MIN_INTEREST
  );
  const minInterest = starsToInterest(interestToStars(storedMinInterest));
  const filters = useMemo(
    () => ({ sizes, qualities, minInterest }),
    [sizes, qualities, minInterest]
  );
  const hasActiveFilters =
    Object.values(sizes).some(value => !value) ||
    Object.values(qualities).some(value => !value) ||
    minInterest !== DEFAULT_MIN_INTEREST;

  const toggleSize = useCallback(
    id => setSizes(previous => ({ ...previous, [id]: !previous[id] })),
    [setSizes]
  );
  const toggleQuality = useCallback(
    id => setQualities(previous => ({ ...previous, [id]: !previous[id] })),
    [setQualities]
  );
  const resetFilters = useCallback(() => {
    setSizes(DEFAULT_ENTRANCE_FILTERS);
    setQualities(DEFAULT_QUALITY_FILTERS);
    setMinInterest(DEFAULT_MIN_INTEREST);
  }, [setSizes, setQualities, setMinInterest]);

  return {
    filters,
    toggleSize,
    toggleQuality,
    setMinInterest,
    hasActiveFilters,
    resetFilters
  };
};

export default useEntranceFilters;
