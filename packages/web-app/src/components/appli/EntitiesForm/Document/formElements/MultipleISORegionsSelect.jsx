import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import Translate from '../../../../common/Translate';
import MultipleSelectComponent from './MultipleSelect';
import {
  loadRegionsSearch,
  resetRegionsSearch
} from '../../../../../actions/Region';

const MultipleISORegionsSelect = ({
  computeHasError,
  contextValueName,
  helperText,
  labelName,
  required = false
}) => {
  const dispatch = useDispatch();
  const {
    error,
    isFetching,
    results: searchResults
  } = useSelector(state => state.region);

  const loadSearchResults = inputValue => {
    dispatch(loadRegionsSearch(inputValue));
  };
  const resetSearchResults = () => {
    dispatch(resetRegionsSearch());
  };

  return (
    <MultipleSelectComponent
      computeHasError={computeHasError}
      contextValueName={contextValueName}
      getOptionSelected={(optionToTest, valueToTest) =>
        optionToTest.iso === valueToTest.iso
      }
      getOptionLabel={e => `${e.name} (${e.iso})`}
      helperText={helperText}
      isLoading={isFetching}
      labelName={labelName}
      loadSearchResults={loadSearchResults}
      nbCharactersNeededToLaunchSearch={1}
      noOptionsText={
        <Translate>No region matches you search criteria</Translate>
      }
      required={required}
      resetSearchResults={resetSearchResults}
      searchError={error?.message ?? null}
      searchResults={searchResults}
    />
  );
};

MultipleISORegionsSelect.propTypes = {
  computeHasError: PropTypes.func.isRequired,
  contextValueName: PropTypes.string.isRequired,
  helperText: PropTypes.string.isRequired,
  labelName: PropTypes.string.isRequired,
  required: PropTypes.bool
};

export default MultipleISORegionsSelect;
