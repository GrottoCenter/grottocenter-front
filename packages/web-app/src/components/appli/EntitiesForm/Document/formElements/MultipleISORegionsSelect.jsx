import { useState } from 'react';
import PropTypes from 'prop-types';
import Translate from '../../../../common/Translate';
import MultipleSelectComponent from './MultipleSelect';
import { useRegionsSearch } from '../../../../../hooks';

const MultipleISORegionsSelect = ({
  computeHasError,
  contextValueName,
  helperText,
  labelName,
  required = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const {
    data: searchResults = [],
    isFetching,
    error
  } = useRegionsSearch(searchQuery);

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
      loadSearchResults={setSearchQuery}
      nbCharactersNeededToLaunchSearch={1}
      noOptionsText={
        <Translate>No region matches you search criteria</Translate>
      }
      required={required}
      resetSearchResults={() => setSearchQuery('')}
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
