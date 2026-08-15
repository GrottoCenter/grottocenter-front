import PropTypes from 'prop-types';
import { Box, FormControlLabel, Switch, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useIntl } from 'react-intl';
import Alert from './Alert';
import SensitivityLockToggle from './SensitivityLockToggle';

/**
 * Sensitivity controls for an entrance or a massif: the restriction switch, the
 * admin padlock, and the explanation of what toggling them entails.
 *
 * Both entities carry the same rules, so they get the same panel — the caller
 * only supplies the wording and the permission-dependent flags. The explanation
 * sits above the controls on purpose: it is what the user needs *before*
 * flipping the switch, not after.
 */
const SensitivitySection = ({
  title,
  explanation,
  switchLabel,
  isSensitive,
  onSensitiveChange,
  isSensitiveDisabled = false,
  showLock = false,
  isLocked = false,
  onLockChange = undefined,
  isLockDisabled = false,
  alert = null,
  children = null
}) => {
  const { formatMessage } = useIntl();

  // Orange only once the panel actually carries consequences — a permanently
  // orange box would just be noise on the majority of entrances that are
  // neither restricted nor locked.
  const isConsequential = isSensitive || isLocked;

  return (
    <Box
      sx={{
        mt: 2,
        mb: 2,
        p: 1.5,
        border: 1,
        borderRadius: 1,
        borderColor: isConsequential ? 'warning.main' : 'divider',
        // The theme leaves `warning` at the MUI defaults, which have no tonal
        // 50 step, so tint the main colour rather than reach for a missing key.
        backgroundColor: theme =>
          isConsequential
            ? alpha(theme.palette.warning.main, 0.08)
            : 'transparent'
      }}>
      <Typography variant="h5" component="h3" gutterBottom>
        {formatMessage({ id: title })}
      </Typography>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        {explanation}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FormControlLabel
          control={
            <Switch
              checked={isSensitive}
              onChange={e => onSensitiveChange(e.target.checked)}
              disabled={isSensitiveDisabled}
            />
          }
          label={formatMessage({ id: switchLabel })}
        />
        {showLock && (
          <SensitivityLockToggle
            isLocked={isLocked}
            onChange={onLockChange}
            disabled={isLockDisabled}
          />
        )}
        {children}
      </Box>
      {alert && <Alert severity={alert.severity} content={alert.content} />}
    </Box>
  );
};

SensitivitySection.propTypes = {
  title: PropTypes.string.isRequired,
  explanation: PropTypes.node.isRequired,
  switchLabel: PropTypes.string.isRequired,
  isSensitive: PropTypes.bool.isRequired,
  onSensitiveChange: PropTypes.func.isRequired,
  isSensitiveDisabled: PropTypes.bool,
  showLock: PropTypes.bool,
  isLocked: PropTypes.bool,
  onLockChange: PropTypes.func,
  isLockDisabled: PropTypes.bool,
  alert: PropTypes.shape({
    severity: PropTypes.oneOf(['error', 'success', 'info', 'warning']),
    content: PropTypes.node
  }),
  children: PropTypes.node
};

export default SensitivitySection;
