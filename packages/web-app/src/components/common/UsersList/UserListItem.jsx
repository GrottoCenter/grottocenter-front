import React from 'react';
import PropTypes from 'prop-types';
import { ListItem, ListItemText } from '@mui/material';
import { Link } from 'react-router-dom';
import { styled } from '@mui/material/styles';

const StyledListItem = styled(ListItem)`
  flex-basis: 25%;
  min-width: 250px;
`;

const UserListItem = ({ user }) => (
  <StyledListItem
    button
    component={React.forwardRef((props, ref) => (
      <Link {...props} to={`/ui/persons/${user.id}`} ref={ref} />
    ))}>
    <ListItemText primary={user.nickname} />
  </StyledListItem>
);

UserListItem.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    nickname: PropTypes.string.isRequired
  })
};

export default UserListItem;
