import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Box, Button } from '@mui/material';
import { styled } from '@mui/material/styles';

import { resetAdvancedSearchResults } from '../../../actions/Advancedsearch';
import DocumentSearch from '../AdvancedSearch/DocumentSearch';
import SearchResults from '../AdvancedSearch/SearchResults';
import Alert from '../../common/Alert';

const SpacedButton = styled(Button)`
  ${({ theme }) => `
  margin: 0 ${theme.spacing(1)};`}
`;

const SearchDocumentForm = ({ closeForm, onSubmit }) => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const [selectedDocuments, setSelectedDocuments] = useState([]);

  const resetAdvancedSearch = () => {
    dispatch(resetAdvancedSearchResults());
  };

  const resetForm = () => {
    resetAdvancedSearch();
    setSelectedDocuments([]);
  };

  const handleOnSubmit = () => {
    onSubmit(selectedDocuments);
    resetForm();
  };

  let associateMessage = formatMessage({ id: 'Associate' });
  if (selectedDocuments.length === 1) {
    associateMessage = formatMessage({ id: 'Associate 1 document' });
  } else {
    associateMessage = formatMessage(
      {
        id: 'Associate {nb} documents',
        defaultMessage: 'Associate {nb} documents'
      },
      { nb: selectedDocuments.length }
    );
  }

  return (
    <Box textAlign="center">
      <DocumentSearch />
      <br />
      <SearchResults
        onSelected={(ids, results) => {
          const resultIds = results.map(e => e.id);
          setSelectedDocuments([
            ...selectedDocuments.filter(e => !resultIds.includes(e.id)),
            ...results.filter(e => ids.includes(e.id))
          ]);
        }}
      />

      {selectedDocuments.length === 0 && (
        <Alert
          severity="info"
          content={formatMessage({
            id: 'Select document(s) by clicking on the result table above.'
          })}
        />
      )}

      <Box my={4}>
        {closeForm && (
          <SpacedButton onClick={closeForm}>
            {formatMessage({ id: 'Cancel' })}
          </SpacedButton>
        )}
        <SpacedButton variant="outlined" onClick={resetForm}>
          {formatMessage({ id: 'Reset' })}
        </SpacedButton>
        <SpacedButton
          disabled={selectedDocuments.length === 0}
          color="primary"
          type="submit"
          onClick={handleOnSubmit}>
          {associateMessage}
        </SpacedButton>
      </Box>
    </Box>
  );
};

SearchDocumentForm.propTypes = {
  closeForm: PropTypes.func,
  onSubmit: PropTypes.func.isRequired
};

export default SearchDocumentForm;
