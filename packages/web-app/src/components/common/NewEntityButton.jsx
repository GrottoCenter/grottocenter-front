import PropTypes from 'prop-types';
import { Button } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { useIntl } from 'react-intl';
import { useAuthNavigate } from '../../hooks';

const NewEntityButton = ({ to, icon = <AddCircleIcon /> }) => {
  const { formatMessage } = useIntl();
  const handleClick = useAuthNavigate(to);

  return (
    <Button
      color="secondary"
      variant="outlined"
      startIcon={icon}
      onClick={handleClick}>
      {formatMessage({ id: 'New' })}
    </Button>
  );
};

NewEntityButton.propTypes = {
  to: PropTypes.string.isRequired,
  icon: PropTypes.node
};

export default NewEntityButton;
