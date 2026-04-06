import { useState } from 'react';

const useSearchFilter = initialFilterState => {
  const [filterState, setFilterState] = useState(initialFilterState);
  const updateFilter = (key, value) =>
    setFilterState(prev => ({ ...prev, [key]: value }));
  const handleRemoveFilter = key => updateFilter(key, initialFilterState[key] ?? '');
  const resetFilter = () => setFilterState(initialFilterState);
  return { filterState, updateFilter, handleRemoveFilter, resetFilter };
};

export default useSearchFilter;
