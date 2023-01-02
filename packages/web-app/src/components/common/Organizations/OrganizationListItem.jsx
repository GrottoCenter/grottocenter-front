import React from 'react';
import { ListItem, ListItemText } from '@mui/material';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import idNameType from '../../../types/idName.type';

const StyledListItem = styled(ListItem)`
  flex-basis: 25%;
  min-width: 250px;
`;

const OrganizationListItem = ({ orga }) => (
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

OrganizationListItem.propTypes = {
  orga: idNameType
};
OrganizationListItem.defaultProps = {
  orga: undefined
};

export default OrganizationListItem;
