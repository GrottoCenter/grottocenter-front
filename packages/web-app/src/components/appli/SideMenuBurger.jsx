import React from 'react';
import PropTypes from 'prop-types';
import Avatar from '@mui/material/Avatar';
import BurgerIcon from '@mui/icons-material/Help';
import { Button } from '@mui/material';
import { styled } from '@mui/material/styles';

const BurgerAvatar = styled(Avatar)(({ theme, visible }) => ({
  position: 'relative',
  left: '20px',
  backgroundColor: visible
    ? theme.palette.textIconColor
    : `${theme.palette.accent1Color} !important`,

  '> svg': {
    fill: visible
      ? theme.palette.primaryTextColor
      : `${theme.palette.textIconColor} !important`
  }
}));

const BurgerLink = ({ visible, onclick }) => (
  <Button onClick={onclick}>
    <BurgerAvatar icon={<BurgerIcon />} visible={visible} />
  </Button>
);

BurgerLink.propTypes = {
  onclick: PropTypes.func.isRequired,
  visible: PropTypes.bool.isRequired
};

export default BurgerLink;
