import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

/**
 * Builds the `action` a notistack snackbar needs to be dismissible.
 *
 * A `persist: true` snackbar has no other way to disappear, so every persistent
 * notification in the app is expected to pass one of these.
 *
 * Returns a `key => node` function because that is what notistack hands to the
 * snackbar component. Kept out of any component body on purpose: defining it
 * inline would make React see a new component type on every render
 * (react/no-unstable-nested-components).
 */
export const createCloseAction = (onClose, label) =>
  function CloseAction(key) {
    return (
      <IconButton
        size="small"
        color="inherit"
        aria-label={label}
        onClick={() => onClose(key)}>
        <CloseIcon fontSize="small" />
      </IconButton>
    );
  };
