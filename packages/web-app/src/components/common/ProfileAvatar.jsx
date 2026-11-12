import PropTypes from 'prop-types';
import { Avatar } from '@mui/material';
import OrganizationIcon from './OrganizationIcon';
import UserAvatar from './UserAvatar';

const ProfileAvatar = ({
  avatarUrl = null,
  name = '',
  isOrganization = false,
  organizationType = null,
  size = 64
}) => {
  if (isOrganization)
    return (
      <Avatar
        src={avatarUrl || undefined}
        alt={name}
        variant="rounded"
        sx={{ width: size, height: size, bgcolor: 'background.paper' }}>
        <OrganizationIcon organizationType={organizationType} size={size} />
      </Avatar>
    );
  return (
    <UserAvatar
      username={name}
      src={avatarUrl || undefined}
      alt={name}
      size={size}
    />
  );
};

ProfileAvatar.propTypes = {
  avatarUrl: PropTypes.string,
  name: PropTypes.string,
  isOrganization: PropTypes.bool,
  organizationType: PropTypes.string,
  size: PropTypes.number
};

export default ProfileAvatar;
