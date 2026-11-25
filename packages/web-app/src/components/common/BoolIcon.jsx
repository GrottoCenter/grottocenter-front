import PropTypes from 'prop-types';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CancelIcon from '@mui/icons-material/Cancel';
import { sxPropType } from '@/types/mui.type';

const BoolIcon = ({ value, fontSize = 'small', sx, titleAccess }) =>
  value ? (
    <CheckCircleOutlinedIcon
      fontSize={fontSize}
      color="success"
      sx={sx}
      titleAccess={titleAccess}
    />
  ) : (
    <CancelIcon
      fontSize={fontSize}
      color="disabled"
      sx={sx}
      titleAccess={titleAccess}
    />
  );

BoolIcon.propTypes = {
  value: PropTypes.bool.isRequired,
  fontSize: PropTypes.string,
  sx: sxPropType,
  titleAccess: PropTypes.string
};

export default BoolIcon;
