import React, { useState } from 'react';
import { useDispatch } from 'react-redux';

import {
  fetchAdvancedSearchResults,
  resetAdvancedSearchResults
} from '../../../actions/Advancedsearch';
import {
  SearchForm,
  SearchFormContainer,
  SearchText,
  SearchActionButtons
} from './SearchElements';
import { ADVANCED_SEARCH_TYPES } from '../../../conf/config';

const MassifsSearch = () => {
  const dispatch = useDispatch();
  const [query, setQuery] = useState('');

  const startAdvancedsearch = () =>
    dispatch(
      fetchAdvancedSearchResults({
        entity: ADVANCED_SEARCH_TYPES.MASSIFS,
        query
      })
    );

  return (
    <SearchForm title="Massif search" onSubmit={() => startAdvancedsearch()}>
      <SearchFormContainer style={{ justifyContent: 'flex-start' }}>
        <SearchText label="Query" onChange={e => setQuery(e)} value={query} />
      </SearchFormContainer>

      <SearchActionButtons
        onReset={() => {
          dispatch(resetAdvancedSearchResults());
          setQuery('');
        }}
      />
    </SearchForm>
  );
};

export default MassifsSearch;
