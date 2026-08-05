import { useState } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Box, Button } from '@mui/material';

import {
  fetchAdvancedSearchResults,
  resetAdvancedSearchResults
} from '../../../../actions/Advancedsearch';
import { ADVANCED_SEARCH_TYPES } from '../../../../conf/config';
import OrganizationsSearch from '../../AdvancedSearch/OrganizationsSearch';
import SearchResults from '../../AdvancedSearch/SearchResults';

const SearchOrganizationForm = ({ onSubmit }) => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const [selectedOrganizations, setSelectedOrganizations] = useState([]);

  const startAdvancedSearch = (formValues, resourceType) => {
    dispatch(fetchAdvancedSearchResults(formValues, resourceType));
  };

  const resetAdvancedSearch = () => {
    dispatch(resetAdvancedSearchResults());
  };

  const resetForm = () => {
    resetAdvancedSearch();
    setSelectedOrganizations([]);
  };

  const handleSelection = (ids, results) => {
    setSelectedOrganizations(results.filter(r => ids.includes(r.id)));
  };

  const handleOnSubmit = () => {
    onSubmit(selectedOrganizations);
    resetForm();
  };

  return (
    <Box>
      <OrganizationsSearch
        startAdvancedsearch={startAdvancedSearch}
        resourceType={ADVANCED_SEARCH_TYPES.ORGANIZATIONS}
        resetResults={resetAdvancedSearch}
      />
      <SearchResults
        onSelected={handleSelection}
        hideExport
        compact
        entityType={ADVANCED_SEARCH_TYPES.ORGANIZATIONS}
      />
      <Box sx={{ mt: 1, mb: 2, textAlign: 'center' }}>
        <Button
          disabled={selectedOrganizations.length === 0}
          color="primary"
          variant="contained"
          type="submit"
          onClick={handleOnSubmit}>
          {formatMessage({ id: 'Join' })}
        </Button>
      </Box>
    </Box>
  );
};

SearchOrganizationForm.propTypes = {
  onSubmit: PropTypes.func.isRequired
};

export default SearchOrganizationForm;
