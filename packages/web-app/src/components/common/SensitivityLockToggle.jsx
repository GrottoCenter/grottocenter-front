import PropTypes from 'prop-types';
import { IconButton, Tooltip } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import { useIntl } from 'react-intl';

/**
 * Admin-only padlock button freezing the sensitivity of an entrance or a massif.
 * Rendering is left to the caller: mount it only for administrators.
 */
const SensitivityLockToggle = ({ isLocked, onChange, disabled = false }) => {
  const { formatMessage } = useIntl();
  const label = formatMessage({
    id: isLocked ? 'Unlock sensitivity' : 'Lock sensitivity'
  });

  return (
    <Tooltip title={label}>
      {/* A disabled IconButton fires no events, so the tooltip needs a wrapper
          element to keep listening for them. */}
      <span>
        {/* Warning colour, not primary, while locked: a closed padlock is a
            state with consequences for other contributors, so it has to read
            as one. */}
        <IconButton
          aria-label={label}
          aria-pressed={isLocked}
          color={isLocked ? 'warning' : 'default'}
          disabled={disabled}
          onClick={() => onChange(!isLocked)}>
          {isLocked ? <LockOutlinedIcon /> : <LockOpenOutlinedIcon />}
        </IconButton>
      </span>
    </Tooltip>
  );
};

SensitivityLockToggle.propTypes = {
  isLocked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default SensitivityLockToggle;
