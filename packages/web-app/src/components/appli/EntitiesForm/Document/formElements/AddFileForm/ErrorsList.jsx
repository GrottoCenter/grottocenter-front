import PropTypes from 'prop-types';
import { List, ListItemText } from '@mui/material';

const ErrorsList = ({ errors }) => {
  if (errors.length === 0) return null;

  return (
    <List>
      {[...new Set(errors)].map(error => (
        <ListItemText
          key={error}
          slotProps={{
            primary: { color: 'error' }
          }}>
          {error}
        </ListItemText>
      ))}
    </List>
  );
};

ErrorsList.propTypes = {
  errors: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default ErrorsList;
