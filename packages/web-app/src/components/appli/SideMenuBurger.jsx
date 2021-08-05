import React from 'react';
import PropTypes from 'prop-types';
import Avatar from '@material-ui/core/Avatar';
import BurgerIcon from '@material-ui/icons/Help';
import { withTheme } from '@material-ui/core/styles';
import { Button } from '@material-ui/core';
import styled from 'styled-components';
import checkPermission from '../../helpers/Permissions';
import { VIEW_SIDEMENU } from '../../conf/Rights';

const BurgerAvatar = withTheme(styled(Avatar)`
  position: relative;
  left: 20px;
  background-color: ${props =>
    props.visible
      ? props.theme.palette.textIconColor
      : props.theme.palette.accent1Color} !important;

  > svg {
    fill: ${props =>
      props.visible
        ? props.theme.palette.primaryTextColor
        : props.theme.palette.textIconColor} !important;
  }
`);

const BurgerLink = ({ visible, onclick }) => (
  <Button onClick={onclick}>
    <BurgerAvatar icon={<BurgerIcon />} visible={visible} />
  </Button>
);

BurgerLink.propTypes = {
  onclick: PropTypes.func.isRequired,
  visible: PropTypes.bool.isRequired
};

const SideMenuBurger = styled(BurgerLink)``;

export default checkPermission(VIEW_SIDEMENU)(SideMenuBurger);
