import PropTypes from 'prop-types';
import SecurityIcon from '@mui/icons-material/Security';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import LocalPoliceIcon from '@mui/icons-material/LocalPolice';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';

const ROLE_ICONS = {
  Administrator: SecurityIcon,
  Moderator: VerifiedUserIcon,
  Leader: LocalPoliceIcon,
  User: PersonIcon,
  Visitor: VisibilityIcon,
  Anonymous: PersonOffIcon
};

const RoleIcon = ({ roleName, className, fontSize = 'small' }) => {
  const Icon = ROLE_ICONS[roleName] ?? BadgeOutlinedIcon;
  return (
    <Icon
      className={className}
      fontSize={fontSize}
      data-testid={`role-icon-${roleName}`}
    />
  );
};

RoleIcon.propTypes = {
  roleName: PropTypes.string.isRequired,
  className: PropTypes.string,
  fontSize: PropTypes.oneOf(['inherit', 'small', 'medium', 'large'])
};

export default RoleIcon;
