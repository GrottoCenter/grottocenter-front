import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Tooltip } from '@mui/material';
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
            <LockOutlinedIcon aria-label={lockLabel} fontSize="small" />
          </Tooltip>
        ) : undefined
      }
      title={formatMessage({
        id: 'Restricted access entrance'
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
