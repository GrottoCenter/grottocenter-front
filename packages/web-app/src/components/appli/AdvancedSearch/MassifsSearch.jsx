import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';

import {
  fetchAdvancedSearchResults,
  resetAdvancedSearchResults
} from '../../../actions/Advancedsearch';
import { SearchForm, SearchActionButtons } from './SearchElements';
import { getStoredRowsPerPage } from '../../common/EntityTable/EntityTable';
import SearchInput from '../../common/SearchInput';
import { ADVANCED_SEARCH_TYPES } from '../../../conf/config';

const MassifsSearch = () => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const [query, setQuery] = useState('');

  const startAdvancedsearch = (overrideQuery) =>
    dispatch(
      fetchAdvancedSearchResults({
        entity: ADVANCED_SEARCH_TYPES.MASSIFS,
        query: overrideQuery !== undefined ? overrideQuery : query,
        size: getStoredRowsPerPage()
      })
    );

  return (
    <SearchForm onSubmit={() => startAdvancedsearch()}>
      <SearchInput
        onChange={e => setQuery(e)}
        value={query}
        placeholder={formatMessage({ id: 'Massif name' })}
      />

      <SearchActionButtons
        onReset={() => {
          setQuery('');
          dispatch(resetAdvancedSearchResults());
          startAdvancedsearch('');
        }}
      />
    </SearchForm>
  );
};

export default MassifsSearch;
