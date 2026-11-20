import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import ConfirmationDialog from './ConfirmationDialog';

const DiscardChangesDialog = ({ open, onKeepEditing, onDiscard }) => {
  const { formatMessage } = useIntl();

  return (
    <ConfirmationDialog
      open={open}
      onClose={onKeepEditing}
      title={formatMessage({ id: 'Discard changes?' })}
      onConfirm={onDiscard}
      cancelLabel={formatMessage({ id: 'Keep editing' })}
      confirmLabel={formatMessage({ id: 'Discard' })}
      color="error">
      {formatMessage({
        id: 'You have unsaved changes. Are you sure you want to discard them?'
      })}
    </ConfirmationDialog>
  );
};

DiscardChangesDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onKeepEditing: PropTypes.func.isRequired,
  onDiscard: PropTypes.func.isRequired
};

export default DiscardChangesDialog;
