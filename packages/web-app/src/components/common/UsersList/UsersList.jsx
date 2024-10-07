import React from 'react';
import PropTypes from 'prop-types';
import { List, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import Translate from '../Translate';
import UserListItem from './UserListItem';

const StyledList = styled(List)({
  display: 'flex',
  flexWrap: 'wrap',
  width: '100%'
});

const UsersList = ({
  users = [],
  title,
  emptyMessageComponent = <Translate>Empty list</Translate>
}) => (
  <>
    {title && (
      <Typography variant="h3" gutterBottom>
        {title}
      </Typography>
    )}
    {users && users.length > 0 ? (
      <StyledList>
        {users
          .sort((a, b) => a.nickname?.localeCompare(b.nickname))
          .map(user => (
            <UserListItem key={user.id} user={user} />
          ))}
      </StyledList>
    ) : (
      emptyMessageComponent
    )}
  </>
);

UsersList.propTypes = {
  users: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      nickname: PropTypes.string.isRequired
    })
  ),
  title: PropTypes.node,
  emptyMessageComponent: PropTypes.node
};

export default UsersList;
