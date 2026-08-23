import { useState } from 'react';
import { useIntl } from 'react-intl';

import { startAdvancedSearch, resetAdvancedSearch } from '../../../hooks';
import {
  ActiveFilterChips,
  SearchActionButtons,
  SearchForm
} from './SearchElements';
import { getStoredRowsPerPage } from '../../common/EntityTable';
import SearchInput from '../../common/SearchInput';
import { ADVANCED_SEARCH_TYPES } from '../../../conf/config';

const MassifsSearch = () => {
  const { formatMessage } = useIntl();
  const [query, setQuery] = useState('');

  const startAdvancedsearch = overrideQuery =>
    startAdvancedSearch({
      entity: ADVANCED_SEARCH_TYPES.MASSIFS,
      query: overrideQuery !== undefined ? overrideQuery : query,
      size: getStoredRowsPerPage()
    });

  const handleClearAll = () => {
    setQuery('');
    resetAdvancedSearch();
    startAdvancedsearch('');
  };

  return (
    <SearchForm onSubmit={() => startAdvancedsearch()}>
      <SearchInput
        onChange={e => setQuery(e)}
        value={query}
        placeholder={formatMessage({ id: 'Massif name' })}
      />

      <ActiveFilterChips
        query={query}
        queryLabel="Massif name"
        onClearQuery={() => setQuery('')}
        onClearAll={query !== '' ? handleClearAll : undefined}
      />
      <SearchActionButtons />
    </SearchForm>
  );
};

export default MassifsSearch;
