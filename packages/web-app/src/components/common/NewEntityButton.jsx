import PropTypes from 'prop-types';
import { Button } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { useIntl } from 'react-intl';
import { useAuthNavigate, useOnlineStatus } from '../../hooks';
import OfflineDisabled from './OfflineDisabled';

const NewEntityButton = ({ to, icon = <AddCircleIcon /> }) => {
  const { formatMessage } = useIntl();
  const handleClick = useAuthNavigate(to);
  const isOnline = useOnlineStatus();

  return (
    <OfflineDisabled>
      <Button
        color="secondary"
        variant="outlined"
        startIcon={icon}
        disabled={!isOnline}
        onClick={handleClick}>
        {formatMessage({ id: 'New' })}
      </Button>
    </OfflineDisabled>
  );
};

NewEntityButton.propTypes = {
  to: PropTypes.string.isRequired,
  icon: PropTypes.node
};

export default NewEntityButton;
