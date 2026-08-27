import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, Tooltip } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Alert from '../../common/Alert';

const SensitiveCaveWarning = ({ isLocked = false }) => {
  const { formatMessage } = useIntl();
  const lockLabel = formatMessage({
    id: 'The sensitivity of this entrance is locked by an administrator.'
  });

  return (
    <Alert
      disableMargins
      severity="warning"
      action={
        isLocked ? (
          <Tooltip title={lockLabel}>
            {/* MUI marks a bare SvgIcon aria-hidden, and an svg takes no
                focus: both the accessible name and the tab stop have to live
                on the wrapper, or the tooltip stays pointer-only. */}
            <Box
              component="span"
              role="img"
              tabIndex={0}
              aria-label={lockLabel}
              sx={{ display: 'inline-flex', alignItems: 'center' }}>
              <LockOutlinedIcon fontSize="small" />
            </Box>
          </Tooltip>
        ) : undefined
      }
      title={formatMessage({
        id: 'Sensitive entrance'
      })}
      content={formatMessage({
        id: 'This entrance requires special protection measures. We do not communicate its precise location on Grottocenter.'
      })}
    />
  );
};

SensitiveCaveWarning.propTypes = {
  isLocked: PropTypes.bool
};

export default SensitiveCaveWarning;
