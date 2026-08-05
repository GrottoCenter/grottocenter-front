import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Button } from '@mui/material';

import StandardDialog from './StandardDialog';

const DiscardChangesDialog = ({ open, onKeepEditing, onDiscard }) => {
  const { formatMessage } = useIntl();

  return (
    <StandardDialog
      open={open}
      onClose={onKeepEditing}
      title={formatMessage({ id: 'Discard changes?' })}
      actions={
        <>
          <Button variant="outlined" onClick={onKeepEditing}>
            {formatMessage({ id: 'Keep editing' })}
          </Button>
          <Button variant="contained" color="error" onClick={onDiscard}>
            {formatMessage({ id: 'Discard' })}
          </Button>
        </>
      }>
      {formatMessage({
        id: 'You have unsaved changes. Are you sure you want to discard them?'
      })}
    </StandardDialog>
  );
};

DiscardChangesDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onKeepEditing: PropTypes.func.isRequired,
  onDiscard: PropTypes.func.isRequired
};

export default DiscardChangesDialog;
