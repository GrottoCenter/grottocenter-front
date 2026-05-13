import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle
} from '@mui/material';

import Alert from '../../../common/Alert';

const DocumentSubmissionDialog = ({ isLoading, isNewDocument }) => {
  const { formatMessage } = useIntl();
  return (
    <Dialog aria-labelledby="doc-submission-modal" open={isLoading}>
      <DialogTitle id="doc-submission-modal-title">
        {formatMessage({
          id: isNewDocument ? 'Creating document...' : 'Updating document...'
        })}
        &nbsp;
        <CircularProgress size={20} />
      </DialogTitle>
      <DialogContent>
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
      </DialogContent>
    </Dialog>
  );
};

DocumentSubmissionDialog.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  isNewDocument: PropTypes.bool.isRequired
};

export default DocumentSubmissionDialog;
