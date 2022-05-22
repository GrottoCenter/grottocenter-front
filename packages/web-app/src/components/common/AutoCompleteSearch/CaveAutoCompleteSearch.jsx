import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { isNil, length } from 'ramda';
import { FormControl, InputAdornment, InputLabel } from '@material-ui/core';

import {
  StyledInput,
  StyledFormControl,
  InputWrapper
} from '../Form/FormAutoComplete';
import AutoCompleteSearch from '.';
import { entityOptionForSelector } from '../../../helpers/Entity';
import {
  fetchQuicksearchResult,
  resetQuicksearch
} from '../../../actions/Quicksearch';
import { useDebounce } from '../../../hooks';

const getCaveToString = cave => {
  return cave?.name || '';
};

const resultEndAdornment = (
  <InputAdornment position="end">
    <img
      src="/images/iconsV3/cave_system.svg"
      alt="Document icon"
      style={{ width: '40px' }}
    />
  </InputAdornment>
);

const CaveAutoCompleteSearch = ({
  onSelection,
  value,
  required = false,
  disabled = false
}) => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const [inputValue, setInputValue] = useState('');
  const debouncedInput = useDebounce(inputValue);
  const { isLoading, results: suggestions, error } = useSelector(
    state => state.quicksearch
  );

  const fetchSearchResults = useCallback(
    query => {
      const criterias = {
        query: query.trim(),
        complete: false,
        resourceType: 'caves'
      };
      dispatch(fetchQuicksearchResult(criterias));
    },
    [dispatch]
  );

  const resetSearchResults = useCallback(() => {
    dispatch(resetQuicksearch());
  }, [dispatch]);

  useEffect(() => {
    if (length(debouncedInput) > 2) {
      fetchSearchResults(debouncedInput);
    } else {
      resetSearchResults();
    }
  }, [debouncedInput, fetchSearchResults, resetSearchResults]);

  const handleSelection = selection => {
    if (selection) {
      onSelection(selection);
    }
    setInputValue('');
  };
  return (
    <FormControl variant="filled" required={required} error={!!error} fullWidth>
      <InputLabel>{formatMessage({ id: 'Cave' })}</InputLabel>
      <StyledInput
        value={getCaveToString(value)}
        disabled
        endAdornment={resultEndAdornment}
      />
      <StyledFormControl variant="filled" error={!!error}>
        <InputWrapper>
          <AutoCompleteSearch
            onInputChange={setInputValue}
            disabled={disabled}
            onSelection={handleSelection}
            getOptionLabel={getCaveToString}
            hasError={!isNil(error)}
            isLoading={isLoading}
            label={formatMessage({ id: 'Search for a cave' })}
            renderOption={entityOptionForSelector}
            inputValue={inputValue}
            suggestions={suggestions}
          />
        </InputWrapper>
      </StyledFormControl>
    </FormControl>
  );
};

CaveAutoCompleteSearch.propTypes = {
  disabled: PropTypes.bool,
  onSelection: PropTypes.func.isRequired,
  required: PropTypes.bool,
  value: PropTypes.shape({
    name: PropTypes.string
  })
};
export default CaveAutoCompleteSearch;
