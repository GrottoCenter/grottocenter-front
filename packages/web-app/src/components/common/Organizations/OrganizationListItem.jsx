import React from 'react';
import PropTypes from 'prop-types';
import { ListItem, ListItemText } from '@material-ui/core';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const StyledListItem = styled(ListItem)`
  flex-basis: 25%;
  min-width: 250px;
`;

const OrganizationListItem = ({ orga }) => {
  return (
    <StyledListItem
      button
      component={React.forwardRef((props, ref) => (
        <Link {...props} to={`/ui/organizations/${orga.id}`} ref={ref} />
      ))}>
      <ListItemText
        primary={orga.name}
        primaryTypographyProps={{ style: { whiteSpace: 'normal' } }} // Multiple lines text
      />
    </StyledListItem>
  );
};

OrganizationListItem.propTypes = {
  orga: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired
  })
};
OrganizationListItem.defaultProps = {
  orga: undefined
};

export default OrganizationListItem;
