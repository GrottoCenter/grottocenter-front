import React from 'react';
import { isNil } from 'ramda';
import { ListItemIcon, ListItemText } from '@material-ui/core';
import PropTypes from 'prop-types';

import Translate from '../Translate';
import { StyledLink, StyledListItem } from './styles';

const Item = ({
  ItemIcon,
  label,
  nested = false,
  onClick = () => {},
  children
}) => (
  <StyledListItem button $nested={nested} onClick={onClick}>
    <ListItemIcon>
      <ItemIcon />
    </ListItemIcon>
    <ListItemText>
      <Translate>{label}</Translate>
    </ListItemText>
    {!isNil(children) && children}
  </StyledListItem>
);

export const LinkedItem = ({ href = '', ...itemProps }) => (
  <StyledLink to={href}>
    <Item {...itemProps} />
  </StyledLink>
);

Item.propTypes = {
  ItemIcon: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  nested: PropTypes.bool,
  children: PropTypes.node
};

LinkedItem.propTypes = {
  href: PropTypes.string,
  ...Item.propTypes
};

export default LinkedItem;
