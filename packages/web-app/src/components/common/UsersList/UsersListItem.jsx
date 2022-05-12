import React from 'react';
import PropTypes from 'prop-types';
import { ListItem, ListItemText } from '@material-ui/core';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const StyledListItem = styled(ListItem)`
  flex-basis: 25%;
  min-width: 250px;
`;

const UsersListItem = ({ user }) => {
  return (
    <StyledListItem
      button
      component={React.forwardRef((props, ref) => (
        <Link {...props} to={`/ui/persons/${user.id}`} ref={ref} />
      ))}>
      <ListItemText
        primary={
          user.name && user.surname ? (
            <>
              {user.name} {user.surname}
            </>
          ) : (
            <>{user.nickname}</>
          )
        }
        primaryTypographyProps={{ style: { whiteSpace: 'normal' } }} // Multiple lines text
      />
    </StyledListItem>
  );
};

UsersListItem.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string,
    surname: PropTypes.string,
    nickname: PropTypes.string
  })
};
UsersListItem.defaultProps = {
  user: undefined
};

export default UsersListItem;
