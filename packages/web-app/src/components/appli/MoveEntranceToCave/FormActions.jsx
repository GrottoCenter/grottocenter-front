import PropTypes from 'prop-types';
import { Box, Button, CircularProgress, Tooltip } from '@mui/material';
import { useIntl } from 'react-intl';

// Shared action bar for the move page: a secondary "Cancel" and a primary
// confirm action (attach / detach). Right-aligned on desktop (primary rightmost),
// stacked full-width on mobile with the primary on top.
const FormActions = ({
  confirmLabel,
  onConfirm,
  onCancel,
  loading = false,
  disabled = false,
  confirmTooltip = ''
}) => {
  const { formatMessage } = useIntl();

  const confirmButton = (
    <Button
      variant="contained"
      color="primary"
      disabled={disabled || loading}
      onClick={onConfirm}
      startIcon={
        loading ? <CircularProgress size={18} color="inherit" /> : null
      }
      sx={{ width: { xs: '100%', sm: 'auto' } }}>
      {confirmLabel}
    </Button>
  );

  return (
    <Box
      mt={3}
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column-reverse', sm: 'row' },
        justifyContent: { sm: 'flex-end' },
        gap: 1
      }}>
      <Button
        variant="outlined"
        onClick={onCancel}
        disabled={loading}
        sx={{ width: { xs: '100%', sm: 'auto' } }}>
        {formatMessage({ id: 'Cancel' })}
      </Button>
      {confirmTooltip ? (
        <Tooltip title={confirmTooltip}>
          <Box component="span" sx={{ width: { xs: '100%', sm: 'auto' } }}>
            {confirmButton}
          </Box>
        </Tooltip>
      ) : (
        confirmButton
      )}
    </Box>
  );
};

FormActions.propTypes = {
  confirmLabel: PropTypes.node.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  confirmTooltip: PropTypes.node
};

export default FormActions;
