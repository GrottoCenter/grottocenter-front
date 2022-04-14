import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { isNil } from 'ramda';
import { InputAdornment } from '@material-ui/core';
import LanguageIcon from '@material-ui/icons/Language';

import {
  fetchQuicksearchResult,
  resetQuicksearch
} from '../../../../actions/Quicksearch';

import { entityOptionForSelector } from '../../../../helpers/Entity';

import SearchBar from '../../Document/DocumentForm/formElements/SearchBar';
import FormAutoComplete from '../FormAutoComplete';

// ===================================

const LanguageAutoCompleteWithProvider = ({
  contextValueName,
  helperContent,
  helperContentIfValueIsForced,
  labelText,
  required = false,
  searchLabelText
}) => {
  const dispatch = useDispatch();
  const { error, isLoading, results: suggestions } = useSelector(
    state => state.quicksearch
  );

  const { formatMessage } = useIntl();

  const getLanguageToString = useCallback(
    language => formatMessage({ id: language.refName }),
    [formatMessage]
  );

  const fetchSearchResults = debouncedInput => {
    const criterias = {
      query: debouncedInput.trim(),
      complete: false,
      resourceType: 'languages'
    };
    dispatch(fetchQuicksearchResult(criterias));
  };

  const resetSearchResults = () => {
    dispatch(resetQuicksearch());
  };

  return (
    <FormAutoComplete
      autoCompleteSearch={
        <SearchBar
          fetchSearchResults={fetchSearchResults}
          getOptionLabel={getLanguageToString}
          getValueName={getLanguageToString}
          hasError={!isNil(error)}
          isLoading={isLoading}
          label={searchLabelText}
          renderOption={entityOptionForSelector}
          resetSearchResults={resetSearchResults}
          searchLabelText={searchLabelText}
          suggestions={suggestions}
          contextValueName={contextValueName}
          resourceSearchedType="languages"
        />
      }
      contextValueName={contextValueName}
      getValueName={getLanguageToString}
      hasError={false} // How to check for errors ?
      helperContent={helperContent}
      helperContentIfValueIsForced={helperContentIfValueIsForced}
      label={labelText}
      required={required}
      resultEndAdornment={
        <InputAdornment position="end">
          <LanguageIcon color="primary" />
        </InputAdornment>
      }
    />
  );
};

LanguageAutoCompleteWithProvider.propTypes = {
  contextValueName: PropTypes.string.isRequired,
  helperContent: PropTypes.node,
  helperContentIfValueIsForced: PropTypes.node,
  labelText: PropTypes.string.isRequired,
  required: PropTypes.bool,
  searchLabelText: PropTypes.string.isRequired
};

export default LanguageAutoCompleteWithProvider;
