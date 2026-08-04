import PropTypes from 'prop-types';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';

const BoolIcon = ({ value, fontSize = 'small', sx }) =>
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

export default BoolIcon;
