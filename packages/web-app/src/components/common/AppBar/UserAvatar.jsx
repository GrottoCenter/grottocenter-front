import React from 'react';
import { Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';

// Generate initials from username
const getInitials = username => {
  if (!username) return '?';

  const cleaned = username.trim().toUpperCase();

  // If username contains space, take first letter of first and last word
  const words = cleaned.split(/\s+/);
  if (words.length >= 2) {
    return `${words[0][0]}${words[words.length - 1][0]}`;
  }

  // Otherwise, take first two letters
  return cleaned.substring(0, 2);
};

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: 32,
  height: 32,
  cursor: 'pointer',
  backgroundColor: theme.palette.secondary.main,
  color: '#fff',
  fontSize: '1.5rem',
  fontWeight: 500
}));

const UserAvatar = ({ username, sx, ...props }) => {
  const initials = getInitials(username);

  return (
    <StyledAvatar {...props} sx={sx}>
      {initials}
    </StyledAvatar>
  );
};

UserAvatar.propTypes = {
  username: PropTypes.string,
  sx: PropTypes.object
};

export default UserAvatar;
