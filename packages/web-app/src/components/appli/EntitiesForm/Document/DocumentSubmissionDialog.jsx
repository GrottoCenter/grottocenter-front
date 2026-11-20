import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, CircularProgress } from '@mui/material';
import StandardDialog from '@/components/common/StandardDialog';

import Alert from '../../../common/Alert';

const DocumentSubmissionDialog = ({ isLoading, isNewDocument }) => {
  const { formatMessage } = useIntl();
  return (
    <StandardDialog
      open={isLoading}
      isBusy
      title={
        <>
          {formatMessage({
            id: isNewDocument ? 'Creating document...' : 'Updating document...'
          })}
          &nbsp;
          <CircularProgress size={20} aria-hidden="true" />
        </>
      }>
      <Box>
        <Alert
          severity="warning"
          title={formatMessage({
            id: isNewDocument
              ? "Don't leave this page while the document is being created."
              : "Don't leave this page while the document is being updated."
          })}
        />
      </Box>
    </StandardDialog>
  );
};

DocumentSubmissionDialog.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  isNewDocument: PropTypes.bool.isRequired
};

export default DocumentSubmissionDialog;
