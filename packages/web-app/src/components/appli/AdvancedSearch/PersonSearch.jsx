import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';

import {
  fetchAdvancedSearchResults,
  resetAdvancedSearchResults
} from '../../../actions/Advancedsearch';
import { SearchForm, SearchActionButtons } from './SearchElements';
import SearchInput from '../../common/SearchInput';
import { ADVANCED_SEARCH_TYPES } from '../../../conf/config';
import { getStoredRowsPerPage } from '../../common/EntityTable';

const PersonSearch = () => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const [query, setQuery] = useState('');

  const startAdvancedsearch = (overrideQuery) =>
    dispatch(
      fetchAdvancedSearchResults({
        entity: ADVANCED_SEARCH_TYPES.PERSONS,
        query: overrideQuery !== undefined ? overrideQuery : query,
        filter: { type: 'AUTHOR' },
        size: getStoredRowsPerPage()
      })
    );

  return (
    <SearchForm onSubmit={() => startAdvancedsearch()}>
      <SearchInput
        onChange={e => setQuery(e)}
        value={query}
        placeholder={formatMessage({ id: 'Search for a person...' })}
      />

      <SearchActionButtons
        showReset={query !== ''}
        onReset={() => {
          setQuery('');
          dispatch(resetAdvancedSearchResults());
          startAdvancedsearch('');
        }}
      />
    </SearchForm>
  );
};

export default PersonSearch;
