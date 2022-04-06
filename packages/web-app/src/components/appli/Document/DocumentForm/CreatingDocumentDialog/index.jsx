import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle
} from '@material-ui/core';

import Alert from '../../../../common/Alert';

const CreatingDocumentDialog = ({ isLoading }) => {
  const { formatMessage } = useIntl();
  return (
    <Dialog aria-labelledby="doc-submission-modal" open={isLoading}>
      <DialogTitle id="doc-submission-modal-title">
        {formatMessage({ id: 'Creating document...' })}
        &nbsp;
        <CircularProgress size={20} />
      </DialogTitle>
      <DialogContent>
        <Box>
          <Alert
            severity="warning"
            title={formatMessage({
              id: "Don't leave this page while the document is being created."
            })}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

CreatingDocumentDialog.propTypes = {
  isLoading: PropTypes.bool.isRequired
};

export default CreatingDocumentDialog;
