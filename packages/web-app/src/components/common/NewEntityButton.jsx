import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { usePermissions } from '../../hooks';
import { displayLoginDialog } from '../../actions/Login';

const NewEntityButton = ({ to }) => {
  const { formatMessage } = useIntl();
  const { isAuth } = usePermissions();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleClick = () => {
    if (isAuth) {
      navigate(to);
    } else {
      dispatch(displayLoginDialog());
    }
  };

  return (
    <Button
      color="secondary"
      variant="outlined"
      startIcon={<AddCircleIcon />}
      onClick={handleClick}>
      {formatMessage({ id: 'New' })}
    </Button>
  );
};

NewEntityButton.propTypes = {
  to: PropTypes.string.isRequired
};

export default NewEntityButton;
