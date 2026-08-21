import { Alert } from '@mui/material';
import { SnackbarContent } from 'notistack';
import PropTypes from 'prop-types';

// Custom notistack snackbar with standard MUI typography (body1 = 1rem).
// notistack passes the raw action to custom components, so function actions
// must be resolved with the snackbar id before being handed to MUI Alert.
// Only valid DOM props are forwarded to SnackbarContent: options such as
// `persist`, `anchorOrigin` and `autoHideDuration` belong to notistack and would
// otherwise leak onto SnackbarContent's underlying div.
const AppSnackbar = ({
  id,
  message,
  variant,
  action,
  icon,
  ref,
  className,
  style
}) => {
  const severity = variant === 'default' ? 'info' : variant;
  const resolvedAction = typeof action === 'function' ? action(id) : action;
  return (
    <SnackbarContent ref={ref} className={className} style={style}>
      <Alert
        severity={severity}
        action={resolvedAction}
        icon={icon}
        sx={{
          width: '100%',
          alignItems: 'center',
          typography: 'body1',
          // Alert's action slot is top-aligned and padded by default, which
          // reads as off-centre as soon as the message wraps to two lines.
          '& .MuiAlert-action': { alignItems: 'center', pt: 0 }
        }}>
        {message}
      </Alert>
    </SnackbarContent>
  );
};

AppSnackbar.displayName = 'AppSnackbar';
AppSnackbar.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  message: PropTypes.node,
  variant: PropTypes.string,
  action: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  icon: PropTypes.node,
  ref: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  className: PropTypes.string,
  style: PropTypes.shape({})
};

export default AppSnackbar;
