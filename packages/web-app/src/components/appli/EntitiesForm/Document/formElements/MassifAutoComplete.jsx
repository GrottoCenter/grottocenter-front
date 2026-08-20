import { useState } from 'react';
import PropTypes from 'prop-types';
import { InputAdornment } from '@mui/material';
import { massifIcon } from '../../../../../assets/icons';

import { useQuickSearch } from '../../../../../hooks';
import { entityOptionForSelector } from '../../../../../helpers/Entity';

import SearchBar from './SearchBar';
import DocumentFormAutoComplete from './DocumentFormAutoComplete';

const resultEndAdornment = (
  <InputAdornment position="end">
    <img src={massifIcon} alt="Massif icon" style={{ width: '40px' }} />
  </InputAdornment>
);

const MASSIF_ENTITIES = ['massifs'];

const getMassifToString = massif => `#${massif.id} - ${massif.name}`;

const MassifAutoComplete = ({
  contextValueName,
  helperContent,
  helperContentIfValueIsForced,
  labelText,
  required = false,
  searchLabelText
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const {
    data,
    error,
    isFetching: isLoading
  } = useQuickSearch({ query: searchQuery, entities: MASSIF_ENTITIES });
  const suggestions = data?.results ?? [];

  const fetchSearchResults = debouncedInput => setSearchQuery(debouncedInput);
  const resetSearchResults = () => setSearchQuery('');

  return (
    <DocumentFormAutoComplete
      autoCompleteSearch={
        <SearchBar
          fetchSearchResults={fetchSearchResults}
          getOptionLabel={getMassifToString}
          getValueName={getMassifToString}
          hasError={!!error}
          isLoading={isLoading}
          label={searchLabelText}
          renderOption={entityOptionForSelector}
          resetSearchResults={resetSearchResults}
          searchLabelText={searchLabelText}
          suggestions={suggestions}
          contextValueName={contextValueName}
          resourceSearchedType="massifs"
        />
      }
      contextValueName={contextValueName}
      getValueName={getMassifToString}
      hasError={false} // How to check for errors ?
      helperContent={helperContent}
      helperContentIfValueIsForced={helperContentIfValueIsForced}
      label={labelText}
      required={required}
      resultEndAdornment={resultEndAdornment}
    />
  );
};

MassifAutoComplete.propTypes = {
  contextValueName: PropTypes.string.isRequired,
  helperContent: PropTypes.node,
  helperContentIfValueIsForced: PropTypes.node,
  labelText: PropTypes.string.isRequired,
  required: PropTypes.bool,
  searchLabelText: PropTypes.string.isRequired
};

export default MassifAutoComplete;
