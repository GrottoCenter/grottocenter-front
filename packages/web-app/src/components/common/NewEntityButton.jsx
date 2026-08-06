import PropTypes from 'prop-types';
import { Button, Tooltip } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { useIntl } from 'react-intl';
import { useAuthNavigate, useOnlineStatus } from '../../hooks';
import OfflineDisabled from './OfflineDisabled';

/**
 * The one-shot counterpart to SectionCreateButton: it navigates to a creation
 * page instead of toggling a panel open. Same offline rule — the page it leads
 * to only ends in an API write — but with nothing to close, so it is simply
 * disabled whenever there is no connection.
 *
 * The tooltip is blanked while disabled because a disabled <button> emits no
 * hover: MUI warns about it, and OfflineDisabled's tooltip is what shows.
 */
const NewEntityButton = ({
  to,
  icon = <AddCircleIcon />,
  size = 'medium',
  tooltip = null
}) => {
  const { formatMessage } = useIntl();
  const handleClick = useAuthNavigate(to);
  const isOnline = useOnlineStatus();

  const button = (
    <Button
      color="secondary"
      variant="outlined"
      size={size}
      startIcon={icon}
      disabled={!isOnline}
      onClick={handleClick}>
      {formatMessage({ id: 'New' })}
    </Button>
  );

  return (
    <OfflineDisabled>
      {tooltip ? (
        <Tooltip title={isOnline ? tooltip : ''}>{button}</Tooltip>
      ) : (
        button
      )}
    </OfflineDisabled>
  );
};

NewEntityButton.propTypes = {
  to: PropTypes.string.isRequired,
  icon: PropTypes.node,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  // Already translated. Omitted where the label alone is explicit enough.
  tooltip: PropTypes.string
};

export default NewEntityButton;
