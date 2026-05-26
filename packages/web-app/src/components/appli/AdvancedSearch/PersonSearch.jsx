import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { Box, Chip } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

import {
  fetchAdvancedSearchResults,
  resetAdvancedSearchResults
} from '../../../actions/Advancedsearch';
import {
  SearchForm,
  SearchActionButtons,
  SearchFilterAccordion,
  SearchFieldset,
  countActiveFilters
} from './SearchElements';
import SearchInput from '../../common/SearchInput';
import { ADVANCED_SEARCH_TYPES } from '../../../conf/config';
import { getStoredRowsPerPage } from '../../common/EntityTable';

const TYPE_OPTIONS = [
  { value: null, labelId: 'All' },
  { value: 'CAVER', labelId: 'Cavers' },
  { value: 'AUTHOR', labelId: 'Authors' }
];

const PersonSearch = () => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const [query, setQuery] = useState('');
  const [personType, setPersonType] = useState(null);
  const [advancedExpanded, setAdvancedExpanded] = useState(false);

  const startAdvancedsearch = (overrideQuery, overrideType) =>
    dispatch(
      fetchAdvancedSearchResults({
        entity: ADVANCED_SEARCH_TYPES.PERSONS,
        query: overrideQuery !== undefined ? overrideQuery : query,
        filter:
          (overrideType !== undefined ? overrideType : personType)
            ? { type: overrideType !== undefined ? overrideType : personType }
            : {},
        size: getStoredRowsPerPage()
      })
    );

  const handleTypeChange = value => {
    setPersonType(value);
    startAdvancedsearch(undefined, value);
  };

  return (
    <SearchForm onSubmit={() => startAdvancedsearch()}>
      <SearchInput
        onChange={e => setQuery(e)}
        value={query}
        placeholder={formatMessage({ id: 'Search for a person...' })}
      />

      <SearchFilterAccordion
        filterCount={countActiveFilters({ personType }, ['personType'])}
        expanded={advancedExpanded}
        onExpandedChange={setAdvancedExpanded}>
        <SearchFieldset title="Type">
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            {TYPE_OPTIONS.map(opt => (
              <Chip
                key={String(opt.value)}
                label={formatMessage({ id: opt.labelId })}
                size="small"
                clickable
                color={personType === opt.value ? 'primary' : 'default'}
                variant={personType === opt.value ? 'filled' : 'outlined'}
                icon={personType === opt.value ? <CheckIcon /> : undefined}
                onClick={() => handleTypeChange(opt.value)}
              />
            ))}
          </Box>
        </SearchFieldset>
      </SearchFilterAccordion>

      <SearchActionButtons
        showReset={query !== '' || personType !== null}
        onReset={() => {
          setQuery('');
          setPersonType(null);
          setAdvancedExpanded(false);
          dispatch(resetAdvancedSearchResults());
          startAdvancedsearch('', null);
        }}
      />
    </SearchForm>
  );
};

export default PersonSearch;
