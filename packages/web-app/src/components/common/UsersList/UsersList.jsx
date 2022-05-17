import React from 'react';
import PropTypes from 'prop-types';
import { List, Typography } from '@material-ui/core';
import styled from 'styled-components';
import Translate from '../Translate';
import OrganizationListItem from './UserListItem';

const StyledList = styled(List)({
  display: 'flex',
  flexWrap: 'wrap',
  width: '100%'
});

const UsersList = props => {
  const { users, title, emptyMessageComponent } = props;

  return (
    <>
      {title && (
        <Typography variant="h3" gutterBottom>
          {title}
        </Typography>
      )}
      {users && users.length > 0 ? (
        <StyledList>
          {users
            .sort((a, b) => a.name.localeCompare(b.nickname))
            .map(user => (
              <OrganizationListItem key={user.id} user={user} />
            ))}
        </StyledList>
      ) : (
        emptyMessageComponent
      )}
    </>
  );
};

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

UsersList.defaultProps = {
  users: [],
  emptyMessageComponent: <Translate>Empty list</Translate>
};

export default UsersList;
