import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { isEmpty, isNil } from 'ramda';
import { InputAdornment } from '@mui/material';
import AddCircle from '@mui/icons-material/AddCircle';
import { organizationIcon } from '../../../../../../assets/icons';

import SearchBar from '../SearchBar';
import DocumentFormAutoComplete from '../DocumentFormAutoComplete';
import { useBoolean, useQuickSearch } from '../../../../../../hooks';
import CreateNewOrganization from './CreateNewOrganization';

const resultEndAdornment = (
  <InputAdornment position="end">
    <img
      src={organizationIcon}
      alt="Organization icon"
      style={{ width: '40px' }}
    />
  </InputAdornment>
);

const getOrganizationToString = organization =>
  `#${organization.id} - ${organization.name}`;

const ORG_ENTITIES = ['organizations'];

const OrganizationAutoComplete = ({
  contextValueName,
  helperContent,
  helperContentIfValueIsForced,
  labelText,
  required = false,
  searchLabelText
}) => {
  const [defaultSearchValue, setDefaultSearchValue] = useState('');
  const [defaultNewOrganizationValue, setDefaultNewOrganizationValue] =
    useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { isTrue: actionEnabled, true: enableAction } = useBoolean();
  const { isOpen: isCreateOrganizationOpen, toggle: toggleCreateOrganization } =
    useBoolean();
  const {
    data,
    error,
    isFetching: isLoading
  } = useQuickSearch({ query: searchQuery, entities: ORG_ENTITIES });
  const suggestions = data?.results ?? [];

  const fetchSearchResults = debouncedInput => {
    setDefaultNewOrganizationValue(debouncedInput);
    setSearchQuery(debouncedInput);
  };

  const resetSearchResults = () => setSearchQuery('');

  useEffect(() => {
    if (isLoading && !isEmpty(defaultNewOrganizationValue)) {
      enableAction();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, defaultNewOrganizationValue]);

  const handleOpenSideAction = () => {
    setDefaultSearchValue('');
    toggleCreateOrganization();
  };

  return (
    <DocumentFormAutoComplete
      autoCompleteSearch={
        <SearchBar
          fetchSearchResults={fetchSearchResults}
          getOptionLabel={getOrganizationToString}
          getValueName={getOrganizationToString}
          hasError={!isNil(error)}
          isLoading={isLoading}
          label={searchLabelText}
          resetSearchResults={resetSearchResults}
          searchLabelText={searchLabelText}
          suggestions={suggestions}
          contextValueName={contextValueName}
          resourceSearchedType="grottos"
          inputValue={defaultSearchValue}
        />
      }
      contextValueName={contextValueName}
      getValueName={getOrganizationToString}
      hasError={false} // How to check for errors ?
      helperContent={helperContent}
      helperContentIfValueIsForced={helperContentIfValueIsForced}
      label={labelText}
      required={required}
      resultEndAdornment={resultEndAdornment}
      sideActionDisabled={!actionEnabled}
      sideActionIcon={<AddCircle fontSize="large" />}
      onSideAction={handleOpenSideAction}
      isSideActionOpen={isCreateOrganizationOpen}>
      <CreateNewOrganization
        contextValueName={contextValueName}
        enabled={isCreateOrganizationOpen}
        onCreateSuccess={toggleCreateOrganization}
        defaultValue={defaultNewOrganizationValue}
      />
    </DocumentFormAutoComplete>
  );
};

OrganizationAutoComplete.propTypes = {
  contextValueName: PropTypes.string.isRequired,
  helperContent: PropTypes.node,
  helperContentIfValueIsForced: PropTypes.node,
  labelText: PropTypes.string.isRequired,
  required: PropTypes.bool,
  searchLabelText: PropTypes.string.isRequired
};

export default OrganizationAutoComplete;
