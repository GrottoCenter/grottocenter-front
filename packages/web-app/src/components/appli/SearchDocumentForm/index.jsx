import { lazy, Suspense, useState } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Box, Button, CircularProgress, useMediaQuery } from '@mui/material';
import { styled } from '@mui/material/styles';

import OfflineDisabled from '@/components/common/OfflineDisabled';
import StandardDialog from '@/components/common/StandardDialog';
import { useOnlineStatus, resetAdvancedSearch } from '@/hooks';
import DocumentSearch from '../AdvancedSearch/DocumentSearch';
import SearchResults from '../AdvancedSearch/SearchResults';
import Alert from '../../common/Alert';

const DocumentDetails = lazy(() => import('@/pages/DocumentDetails'));

const SpacedButton = styled(Button)`
  ${({ theme }) => `
  margin: 0 ${theme.spacing(0.5)};`}
`;

const SearchDocumentForm = ({ closeForm, onSubmit, onSuccess }) => {
  const { formatMessage } = useIntl();
  const isOnline = useOnlineStatus();
  const isNarrowViewport = useMediaQuery(theme => theme.breakpoints.down('sm'));
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewedDocumentId, setPreviewedDocumentId] = useState(null);

  const resetForm = () => {
    resetAdvancedSearch();
    setSelectedDocuments([]);
  };

  const handleOnSubmit = async () => {
    setIsSubmitting(true);
    let isSuccessful = true;
    try {
      await onSubmit(selectedDocuments);
    } catch (_error) {
      // Mutation errors are surfaced by the QueryClient's global notifier.
      isSuccessful = false;
    }
    setIsSubmitting(false);
    if (isSuccessful) {
      resetForm();
      if (onSuccess) onSuccess();
    }
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
    <>
      <Box textAlign="center">
        <DocumentSearch />
        <br />
        <SearchResults
          onRowClick={document => {
            setPreviewedDocumentId(document.id);
            return false;
          }}
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
              id: 'Select documents with the checkboxes. Preview any document before associating it.'
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
          <OfflineDisabled>
            <SpacedButton
              disabled={
                selectedDocuments.length === 0 || !isOnline || isSubmitting
              }
              color="primary"
              type="submit"
              onClick={handleOnSubmit}>
              {associateMessage}
            </SpacedButton>
          </OfflineDisabled>
        </Box>
      </Box>
      <StandardDialog
        maxWidth="lg"
        fullScreen={isNarrowViewport}
        dense={isNarrowViewport}
        fullWidth
        scrollable
        open={previewedDocumentId !== null}
        onClose={() => setPreviewedDocumentId(null)}
        title={formatMessage({ id: 'Detailed document view' })}>
        {previewedDocumentId !== null && (
          <Suspense fallback={<CircularProgress />}>
            <DocumentDetails id={previewedDocumentId} hideActions />
          </Suspense>
        )}
      </StandardDialog>
    </>
  );
};

SearchDocumentForm.propTypes = {
  closeForm: PropTypes.func,
  onSubmit: PropTypes.func.isRequired,
  onSuccess: PropTypes.func
};

export default SearchDocumentForm;
