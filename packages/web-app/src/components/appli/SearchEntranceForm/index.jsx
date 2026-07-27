import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Box, Button } from '@mui/material';
import { styled } from '@mui/material/styles';

import { resetAdvancedSearchResults } from '../../../actions/Advancedsearch';
import EntrancesSearch from '../AdvancedSearch/EntrancesSearch';
import SearchResults from '../AdvancedSearch/SearchResults';
import Alert from '../../common/Alert';

const SpacedButton = styled(Button)`
  ${({ theme }) => `
  margin: 0 ${theme.spacing(0.5)};`}
`;

const SearchEntranceForm = ({ closeForm, onSubmit }) => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const [selectedEntrances, setSelectedEntrances] = useState([]);

  const resetForm = () => {
    dispatch(resetAdvancedSearchResults());
    setSelectedEntrances([]);
  };

  const handleOnSubmit = () => {
    onSubmit(selectedEntrances);
    resetForm();
  };

  let associateMessage;
  if (selectedEntrances.length === 1) {
    associateMessage = formatMessage({ id: 'Associate 1 entrance' });
  } else {
    associateMessage = formatMessage(
      { id: 'Associate {nb} entrances' },
      { nb: selectedEntrances.length }
    );
  }

  return (
    <Box textAlign="center">
      <EntrancesSearch />
      <br />
      <SearchResults
        entityType="entrances"
        hideExport
        onSelected={(ids, results) => {
          const resultIds = results.map(e => e.id);
          setSelectedEntrances([
            ...selectedEntrances.filter(e => !resultIds.includes(e.id)),
            ...results.filter(e => ids.includes(e.id))
          ]);
        }}
      />
      {selectedEntrances.length === 0 && (
        <Alert
          severity="info"
          content={formatMessage({
            id: 'Select entrance(s) by clicking on the result table above.'
          })}
        />
      )}
      <Box my={3}>
        {closeForm && (
          <SpacedButton onClick={closeForm}>
            {formatMessage({ id: 'Cancel' })}
          </SpacedButton>
        )}
        <SpacedButton variant="outlined" onClick={resetForm}>
          {formatMessage({ id: 'Reset' })}
        </SpacedButton>
        <SpacedButton
          disabled={selectedEntrances.length === 0}
          color="primary"
          type="submit"
          onClick={handleOnSubmit}>
          {associateMessage}
        </SpacedButton>
      </Box>
    </Box>
  );
};

SearchEntranceForm.propTypes = {
  closeForm: PropTypes.func,
  onSubmit: PropTypes.func.isRequired
};

export default SearchEntranceForm;
