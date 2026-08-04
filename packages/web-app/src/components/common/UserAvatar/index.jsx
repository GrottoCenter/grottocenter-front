import React from 'react';
import { Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';

const COLORS = ['primary', 'secondary', 'error', 'warning', 'info', 'success'];

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

const StyledAvatar = styled(Avatar, {
  shouldForwardProp: prop => prop !== '$color'
})(({ theme, $color }) => ({
  width: 32,
  height: 32,
  cursor: 'pointer',
  backgroundColor: theme.palette[$color].main,
  color: theme.palette.common.white,
  fontSize: '0.9375rem',
  fontWeight: 500
}));

const UserAvatar = ({ username, color = 'secondary', sx, ...props }) => {
  const initials = getInitials(username);

  return (
    <StyledAvatar {...props} $color={color} sx={sx}>
      {initials}
    </StyledAvatar>
  );
};

UserAvatar.propTypes = {
  username: PropTypes.string,
  color: PropTypes.oneOf(COLORS),
  sx: PropTypes.object
};

export default UserAvatar;
