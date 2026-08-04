import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Box, Button } from '@mui/material';

import {
  fetchAdvancedSearchResults,
  resetAdvancedSearchResults
} from '../../../../actions/Advancedsearch';
import { ADVANCED_SEARCH_TYPES } from '../../../../conf/config';
import EntrancesSearch from '../../AdvancedSearch/EntrancesSearch';
import SearchResults from '../../AdvancedSearch/SearchResults';

const SearchCaveForm = ({ onSubmit, submitLabel = null }) => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const [selectedEntrances, setSelectedEntrances] = useState([]);

  const startAdvancedsearch = (formValues, resourceType) => {
    dispatch(fetchAdvancedSearchResults(formValues, resourceType));
  };

  const resetAdvancedSearch = () => {
    dispatch(resetAdvancedSearchResults());
  };

  const resetForm = () => {
    resetAdvancedSearch();
    setSelectedEntrances([]);
  };

  const handleSelection = (ids, results) => {
    const selectedResults = results.filter(r => ids.includes(r.id));
    setSelectedEntrances(selectedResults);
  };

  const handleOnSubmit = () => {
    onSubmit(selectedEntrances);
    resetForm();
  };

  return (
    <Box>
      <EntrancesSearch
        startAdvancedsearch={startAdvancedsearch}
        resourceType={ADVANCED_SEARCH_TYPES.ENTRANCES}
        resetResults={resetAdvancedSearch}
      />
      <SearchResults
        onSelected={handleSelection}
        hideExport
        compact
        entityType={ADVANCED_SEARCH_TYPES.ENTRANCES}
      />
      <Box sx={{ mt: 1, mb: 2, textAlign: 'center' }}>
        <Button
          disabled={selectedEntrances.length === 0}
          color="primary"
          variant="contained"
          type="submit"
          onClick={handleOnSubmit}>
          {submitLabel ?? formatMessage({ id: 'Associate' })}
        </Button>
      </Box>
    </Box>
  );
};

SearchCaveForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  submitLabel: PropTypes.string
};

export default SearchCaveForm;
