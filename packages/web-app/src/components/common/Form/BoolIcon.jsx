import React from 'react';
import PropTypes from 'prop-types';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';

const BoolIcon = ({ value, fontSize, sx }) =>
  value ? (
    <CheckCircleOutlineIcon fontSize={fontSize} color="success" sx={sx} />
  ) : (
    <CancelIcon fontSize={fontSize} color="disabled" sx={sx} />
  );

BoolIcon.propTypes = {
  value: PropTypes.bool.isRequired,
  fontSize: PropTypes.string,
  sx: PropTypes.object
};

BoolIcon.defaultProps = {
  fontSize: 'small',
  sx: undefined
};

export default BoolIcon;
