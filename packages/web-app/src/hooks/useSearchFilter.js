import { useState } from 'react';

const useSearchFilter = (initialFilterState, lockedKeys = []) => {
  const [filterState, setFilterState] = useState(initialFilterState);
  const updateFilter = (key, value) =>
    setFilterState(prev => ({ ...prev, [key]: value }));
  const handleRemoveFilter = key => updateFilter(key, initialFilterState[key] ?? '');
  const resetFilter = () =>
    setFilterState(prev =>
      Object.fromEntries(
        Object.entries(initialFilterState).map(([k, v]) =>
          lockedKeys.includes(k) ? [k, prev[k]] : [k, v]
        )
      )
    );
  return { filterState, updateFilter, handleRemoveFilter, resetFilter };
};

export default useSearchFilter;
