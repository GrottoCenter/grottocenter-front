import React from 'react';
import PropTypes from 'prop-types';
import { List, ListItemText } from '@mui/material';

const ErrorsList = ({ errors }) => (
  <List>
    {errors.map(error => (
      <ListItemText primaryTypographyProps={{ color: 'error' }}>
        {error}
      </ListItemText>
    ))}
  </List>
);

ErrorsList.propTypes = {
  errors: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default ErrorsList;
