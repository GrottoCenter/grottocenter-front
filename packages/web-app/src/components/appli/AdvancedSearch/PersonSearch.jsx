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
  SearchFieldset
} from './SearchElements';
import SearchInput from '../../common/SearchInput';
import { ADVANCED_SEARCH_TYPES } from '../../../conf/config';
import { getStoredRowsPerPage } from '../../common/EntityTable';

const DEFAULT_PERSON_TYPE = 'CAVER';

const TYPE_OPTIONS = [
  { value: null, labelId: 'All' },
  { value: 'CAVER', labelId: 'Cavers' },
  { value: 'AUTHOR', labelId: 'Authors' }
];

const PersonSearch = () => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const [query, setQuery] = useState('');
  const [personType, setPersonType] = useState(DEFAULT_PERSON_TYPE);

  const startAdvancedsearch = (overrideQuery, overrideType) => {
    const type = overrideType !== undefined ? overrideType : personType;
    dispatch(
      fetchAdvancedSearchResults({
        entity: ADVANCED_SEARCH_TYPES.PERSONS,
        query: overrideQuery !== undefined ? overrideQuery : query,
        filter: type ? { type } : {},
        size: getStoredRowsPerPage()
      })
    );
  };

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
      <SearchFieldset title="Type">
        <Box sx={{ display: 'flex' }}>
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
      <SearchActionButtons
        showReset={query !== '' || personType !== DEFAULT_PERSON_TYPE}
        onReset={() => {
          setQuery('');
          setPersonType(DEFAULT_PERSON_TYPE);
          dispatch(resetAdvancedSearchResults());
          startAdvancedsearch('', DEFAULT_PERSON_TYPE);
        }}
      />
    </SearchForm>
  );
};

export default PersonSearch;
