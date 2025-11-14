import React from 'react';
import PropTypes from 'prop-types';
import { ListItem, ListItemText, IconButton, Tooltip } from '@mui/material';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { Link } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { useIntl } from 'react-intl';

const StyledListItem = styled(ListItem)`
  flex-basis: 25%;
  min-width: 250px;
`;

const UserListItem = ({ user, onRemove, showRemove }) => {
  const { formatMessage } = useIntl();

  if (showRemove) {
    return (
      <StyledListItem sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Link
          to={`/ui/persons/${user.id}`}
          style={{ textDecoration: 'none', color: 'inherit' }}>
          <ListItemText primary={user.nickname} />
        </Link>
        {onRemove && (
          <Tooltip title={formatMessage({ id: 'Remove from organization' })}>
            <IconButton
              size="small"
              onClick={() => onRemove(user.id)}
              color="error">
              <PersonRemoveIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </StyledListItem>
    );
  }

  return (
    <StyledListItem
      component={React.forwardRef((props, ref) => (
        <Link {...props} to={`/ui/persons/${user.id}`} ref={ref} />
      ))}>
      <ListItemText primary={user.nickname} />
    </StyledListItem>
  );
};

UserListItem.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    nickname: PropTypes.string.isRequired
  }),
  onRemove: PropTypes.func,
  showRemove: PropTypes.bool
};

export default UserListItem;
