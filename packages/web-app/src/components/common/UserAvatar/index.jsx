import { Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { sxPropType } from '@/types/mui.type';

const COLORS = ['primary', 'secondary', 'error', 'warning', 'info', 'success'];

// Generate initials from username
const getInitials = username => {
  if (!username) return '?';

  const cleaned = username.trim().toUpperCase();
  if (!cleaned) return '?';

  // If username contains space, take first letter of first and last word
  const words = cleaned.split(/\s+/);
  if (words.length >= 2) {
    return `${words[0][0]}${words[words.length - 1][0]}`;
  }

  // Otherwise, take first two letters
  return cleaned.substring(0, 2);
};

const StyledAvatar = styled(Avatar, {
  shouldForwardProp: prop => prop !== '$color' && prop !== '$size'
})(({ theme, $color, $size }) => ({
  // Preserve the AppBar avatar's existing 15/32 initials-to-diameter ratio.
  // Both sizes use rem so the ratio also survives browser font-size changes.
  width: `${$size / 16}rem`,
  height: `${$size / 16}rem`,
  cursor: 'inherit',
  backgroundColor: theme.palette[$color].main,
  color: theme.palette.common.white,
  fontSize: `${($size / 32) * 0.9375}rem`,
  fontWeight: 500
}));

const UserAvatar = ({
  username,
  color = 'secondary',
  size = 32,
  sx,
  src,
  alt = ''
}) => {
  const initials = getInitials(username);

  return (
    <StyledAvatar
      data-testid="user-avatar"
      src={src}
      alt={alt}
      $color={color}
      $size={size}
      sx={sx}>
      {initials}
    </StyledAvatar>
  );
};

UserAvatar.propTypes = {
  username: PropTypes.string,
  src: PropTypes.string,
  alt: PropTypes.string,
  color: PropTypes.oneOf(COLORS),
  size: PropTypes.number,
  sx: sxPropType
};

export default UserAvatar;
