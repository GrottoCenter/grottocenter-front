import React, { useCallback, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { isNil, length } from 'ramda';
import { InputAdornment } from '@material-ui/core';
import LanguageIcon from '@material-ui/icons/Language';

import {
  fetchQuicksearchResult,
  resetQuicksearch
} from '../../../../actions/Quicksearch';
import { useDebounce } from '../../../../hooks';
import { entityOptionForSelector } from '../../../../helpers/Entity';

import AutoCompleteSearch from '../../../common/AutoCompleteSearch';
import FormAutoComplete from '../../../common/Form/FormAutoComplete';

// ===================================

const LanguageAutoComplete = ({
  hasError,
  helperContent,
  helperContentIfValueIsForced,
  labelText,
  onSelection,
  required = false,
  searchLabelText,
  value
}) => {
  const dispatch = useDispatch();
  const {
    error: searchError,
    isLoading,
    results: suggestions
  } = useSelector(state => state.quicksearch);
  const [inputValue, setInputValue] = useState('');
  const debouncedInput = useDebounce(inputValue);

  const { formatMessage } = useIntl();

  const getLanguageToString = useCallback(
    language => {
      if (language && language.refName) {
        return formatMessage({ id: language.refName });
      }
      return '';
    },
    [formatMessage]
  );

  const fetchSearchResults = useCallback(
    input => {
      const criterias = {
        query: input.trim(),
        complete: false,
        resourceType: 'languages'
      };
      dispatch(fetchQuicksearchResult(criterias));
    },
    [dispatch]
  );

  const handleOnSelection = language => {
    onSelection(language);
    setInputValue('');
  };

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

  return (
    <FormAutoComplete
      autoCompleteSearch={
        <AutoCompleteSearch
          fetchSearchResults={fetchSearchResults}
          getOptionLabel={getLanguageToString}
          getOptionSelected={(option, val) =>
            option.id === val.id && option.refName === val.refName
          }
          getValueName={getLanguageToString}
          hasError={!isNil(searchError)}
          isLoading={isLoading}
          label={searchLabelText}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSelection={handleOnSelection}
          renderOption={entityOptionForSelector}
          resetSearchResults={resetSearchResults}
          searchLabelText={searchLabelText}
          suggestions={suggestions}
          resourceSearchedType="languages"
        />
      }
      getValueName={getLanguageToString}
      hasError={hasError}
      helperContent={helperContent}
      helperContentIfValueIsForced={helperContentIfValueIsForced}
      label={labelText}
      required={required}
      resultEndAdornment={
        <InputAdornment position="end">
          <LanguageIcon color="primary" />
        </InputAdornment>
      }
      value={value}
    />
  );
};

LanguageAutoComplete.propTypes = {
  hasError: PropTypes.bool,
  helperContent: PropTypes.node,
  helperContentIfValueIsForced: PropTypes.node,
  labelText: PropTypes.string.isRequired,
  onSelection: PropTypes.func.isRequired,
  required: PropTypes.bool,
  searchLabelText: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired
};

export default LanguageAutoComplete;
