import React from 'react';
import { Divider, Drawer, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { styled } from '@mui/material/styles';
import Translate from '../Translate';
import MenuLinks from './MenuLinks';
import Footer from './Footer';
import LanguageSelector from '../LanguageSelector';
import { usePermissions } from '../../../hooks';
import QuickSearch from '../../appli/QuickSearch';

const Wrapper = styled('div')`
  display: flex;
  flex-direction: row;
`;

const UserContainer = styled('div')`
  display: flex;
  flex-direction: column;
  align-self: center;
`;

const UserInformation = ({ isAuth = false }) => (
  <UserContainer>
    {isAuth ? (
      <Wrapper>
        <Typography variant="caption">
          <Translate>You are connected</Translate>
        </Typography>
      </Wrapper>
    ) : (
      <>
        <Typography variant="caption" fontWeight="fontWeightBold">
          <Translate>You are not logged in.</Translate>
        </Typography>
        <Typography variant="caption">
          <Translate>Log in to activate the editor mode.</Translate>
        </Typography>
      </>
    )}
  </UserContainer>
);

UserInformation.propTypes = {
  isAuth: PropTypes.bool
};

const SideMenu = ({ isOpen, toggle }) => {
  const permissions = usePermissions();
  const dispatch = useDispatch();
  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={isOpen}
      onClose={() => dispatch(toggle())}>
      <UserInformation isAuth={permissions.isAuth} />
      <QuickSearch />
      <Divider />
      <MenuLinks isAuth={permissions.isAuth} toggle={() => isMobile ? dispatch(toggle()) : true} />
      <Footer />
      <LanguageSelector />
    </Drawer>
  );
};

SideMenu.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggle: PropTypes.func.isRequired
};

export default SideMenu;
