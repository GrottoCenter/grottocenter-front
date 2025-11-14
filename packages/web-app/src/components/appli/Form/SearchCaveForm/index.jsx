import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Box, Button } from '@mui/material';
import { styled } from '@mui/material/styles';

import {
  fetchAdvancedsearchResults,
  resetAdvancedSearchResults
} from '../../../../actions/Advancedsearch';
import { ADVANCED_SEARCH_TYPES } from '../../../../conf/config';
import EntrancesSearch from '../../AdvancedSearch/EntrancesSearch';
import SearchResults from '../../AdvancedSearch/SearchResults';

const SpacedButton = styled(Button)`
  ${({ theme }) => `
  margin: 0 ${theme.spacing(1)};`}
`;

const SearchCaveForm = ({ onSubmit }) => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const [selectedEntrances, setSelectedEntrances] = useState([]);

  const startAdvancedsearch = (formValues, resourceType) => {
    dispatch(fetchAdvancedsearchResults(formValues, resourceType));
  };

  const resetAdvancedSearch = () => {
    dispatch(resetAdvancedSearchResults());
  };

  const resetForm = () => {
    resetAdvancedSearch();
    setSelectedEntrances([]);
  };

  const handleRowClick = entranceResult => {
    if (!selectedEntrances.includes(entranceResult)) {
      setSelectedEntrances(previous => [...previous, entranceResult]);
    } else {
      setSelectedEntrances(previous =>
        previous.filter(e => e !== entranceResult)
      );
    }
  };

  const handleOnSubmit = () => {
    onSubmit(selectedEntrances);
    resetForm();
  };

  return (
    <Box textAlign="center">
      <EntrancesSearch
        startAdvancedsearch={startAdvancedsearch}
        resourceType={ADVANCED_SEARCH_TYPES.ENTRANCES}
        resetResults={resetAdvancedSearch}
      />

      <SearchResults
        onRowClick={handleRowClick}
        selectedIds={selectedEntrances.map(e => String(e.id))}
        hideExport
      />

      <Box my={4}>
        <SpacedButton
          disabled={selectedEntrances.length === 0}
          color="primary"
          type="submit"
          onClick={handleOnSubmit}>
          {formatMessage({ id: 'Associate' })}
        </SpacedButton>
        <SpacedButton variant="outlined" onClick={resetForm}>
          {formatMessage({ id: 'Reset' })}
        </SpacedButton>
      </Box>
    </Box>
  );
};

SearchCaveForm.propTypes = {
  onSubmit: PropTypes.func.isRequired
};

export default SearchCaveForm;
