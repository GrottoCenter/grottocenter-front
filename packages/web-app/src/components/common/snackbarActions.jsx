import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

/**
 * Dismiss button for a snackbar. A `persist: true` snackbar has no other way to
 * disappear, so every persistent notification is expected to carry one.
 *
 * A component rather than a plain element so the label is resolved at render
 * time: the snackbars using this are persistent, and their action is captured
 * once when the message is enqueued. Formatting the label at that moment would
 * freeze it — in the raw message id when the app launches before /lang/*.json
 * has loaded, or in the previous language after a locale change. An aria-label
 * does need a string, so formatMessage is the right call here; what makes it
 * reactive is being read inside a component that re-renders with the context.
 */
const CloseSnackbarButton = ({ snackbarKey, onClose }) => {
  const { formatMessage } = useIntl();
  return (
    <IconButton
      size="small"
      color="inherit"
      aria-label={formatMessage({ id: 'Close' })}
      onClick={() => onClose(snackbarKey)}>
      <CloseIcon fontSize="small" />
    </IconButton>
  );
};

CloseSnackbarButton.propTypes = {
  snackbarKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  onClose: PropTypes.func.isRequired
};

/**
 * Builds the `key => node` function notistack expects for `action`.
 *
 * Kept at module scope on purpose: defining it inside a component would make
 * React see a new component type on every render
 * (react/no-unstable-nested-components).
 */
export const createCloseAction = onClose =>
  function CloseAction(key) {
    return <CloseSnackbarButton snackbarKey={key} onClose={onClose} />;
  };
