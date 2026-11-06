import PropTypes from 'prop-types';
import { Typography } from '@mui/material';

const FieldHelperText = ({ children, id }) => (
  <Typography id={id} variant="caption" sx={{ color: 'text.secondary' }}>
    {children}
  </Typography>
);

FieldHelperText.propTypes = {
  children: PropTypes.node.isRequired,
  id: PropTypes.string
};

export default FieldHelperText;
