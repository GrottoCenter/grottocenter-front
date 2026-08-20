import { useState } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Box, Button } from '@mui/material';
import { styled } from '@mui/material/styles';

import OfflineDisabled from '@/components/common/OfflineDisabled';
import { useOnlineStatus, resetAdvancedSearch } from '@/hooks';
import DocumentSearch from '../AdvancedSearch/DocumentSearch';
import SearchResults from '../AdvancedSearch/SearchResults';
import Alert from '../../common/Alert';

const SpacedButton = styled(Button)`
  ${({ theme }) => `
  margin: 0 ${theme.spacing(0.5)};`}
`;

const SearchDocumentForm = ({ closeForm, onSubmit }) => {
  const { formatMessage } = useIntl();
  const isOnline = useOnlineStatus();
  const [selectedDocuments, setSelectedDocuments] = useState([]);

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
      <Box my={3}>
        {closeForm && (
          <SpacedButton onClick={closeForm}>
            {formatMessage({ id: 'Cancel' })}
          </SpacedButton>
        )}
        <SpacedButton variant="outlined" onClick={resetForm}>
          {formatMessage({ id: 'Reset' })}
        </SpacedButton>
        {/* The parent turns this into a linkDocumentToEntrance write and closes
            the panel straight away without reading the failure — so offline
            this used to look like it had worked. See SearchOrganizationForm. */}
        <OfflineDisabled>
          <SpacedButton
            disabled={selectedDocuments.length === 0 || !isOnline}
            color="primary"
            type="submit"
            onClick={handleOnSubmit}>
            {associateMessage}
          </SpacedButton>
        </OfflineDisabled>
      </Box>
    </Box>
  );
};

SearchDocumentForm.propTypes = {
  closeForm: PropTypes.func,
  onSubmit: PropTypes.func.isRequired
};

export default SearchDocumentForm;
