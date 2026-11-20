import { useId } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, Button } from '@mui/material';
import StandardDialog from './StandardDialog';

const ConfirmationDialog = ({
  open,
  title,
  children,
  onClose,
  onConfirm,
  confirmLabel,
  cancelLabel,
  color = 'primary',
  isBusy = false,
  disabled = false
}) => {
  const { formatMessage } = useIntl();
  const descriptionId = useId();

  return (
    <StandardDialog
      open={open}
      maxWidth="xs"
      title={title}
      onClose={onClose}
      isBusy={isBusy}
      aria-describedby={children ? descriptionId : undefined}
      actions={
        <>
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={isBusy}
            autoFocus>
            {cancelLabel ?? formatMessage({ id: 'Cancel' })}
          </Button>
          <Button
            variant="contained"
            color={color}
            onClick={onConfirm}
            disabled={isBusy || disabled}
            loading={isBusy}>
            {confirmLabel}
          </Button>
        </>
      }>
      {children && <Box id={descriptionId}>{children}</Box>}
    </StandardDialog>
  );
};

ConfirmationDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.node.isRequired,
  children: PropTypes.node,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  confirmLabel: PropTypes.node.isRequired,
  cancelLabel: PropTypes.node,
  color: PropTypes.oneOf([
    'primary',
    'secondary',
    'error',
    'warning',
    'success'
  ]),
  isBusy: PropTypes.bool,
  disabled: PropTypes.bool
};

export default ConfirmationDialog;
