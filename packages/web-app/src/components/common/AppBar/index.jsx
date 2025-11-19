import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  AppBar as MuiAppBar,
  Toolbar,
  IconButton,
  Typography,
  Fade
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { styled } from '@mui/material/styles';

import {
  displayLoginDialog,
  hideLoginDialog,
  postLogout
} from '../../../actions/Login';
import { toggleSideMenu } from '../../../actions/SideMenu';
import { usePermissions } from '../../../hooks';
import { logoGC } from '../../../conf/config';

import LanguageSelector from '../LanguageSelector';
import NotificationMenu from '../../appli/NotificationMenu';
import QuickSearch from '../../appli/QuickSearch';

import UserMenu from './User';

const StyledMuiAppBar = styled(MuiAppBar)`
  flex-grow: 1;
`;

const FadeWrapper = styled('div')`
  margin-left: auto;
  height: 56px;
  padding: ${props => props.theme.spacing(2)};
  ${props => props.theme.breakpoints.down('sm')} {
    display: none;
  }
  display: flex;
  gap: 12px;
`;

const TitleWrapper = styled('div')`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: baseline;
`;

const LogoWrapper = styled('div')`
  display: flex;
  align-items: baseline;
`;

const LogoImage = styled('img')(
  ({ theme }) => `
  padding-right: ${theme.spacing(2)};
  height: 30px;
  ${theme.breakpoints.down('sm')} {
    height: 25px;
  }
`
);

const GrottoTxt = styled('div')(
  ({ theme }) => `
  ${theme.breakpoints.down('sm')} {
    display: none;
  }
`
);

export const StyledLink = styled(Link)`
  color: inherit;
  text-decoration: inherit;
  cursor: pointer;
  display: flex;
`;

const AppBar = () => {
  const dispatch = useDispatch();
  const permissions = usePermissions();
  const authState = useSelector(state => state.login);
  const isSideMenuOpen = useSelector(state => state.sideMenu.open);

  const onLoginClick = () =>
    authState.isLoginDialogDisplayed
      ? dispatch(hideLoginDialog())
      : dispatch(displayLoginDialog());

  const authTokenExpirationDate = new Date(
    (authState?.authTokenDecoded?.exp ?? 0) * 1000
  );

  return (
    <>
      <StyledMuiAppBar>
        <Toolbar variant="dense">
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={() => dispatch(toggleSideMenu())}
            size="large">
            <MenuIcon />
          </IconButton>
          <TitleWrapper>
            <LogoWrapper>
              <Typography variant="h4">
                <StyledLink to="">
                  <LogoImage
                    id="grottocenter-logo"
                    src={logoGC}
                    alt="Grottocenter"
                  />
                  <GrottoTxt>Grottocenter</GrottoTxt>
                </StyledLink>
              </Typography>
            </LogoWrapper>
          </TitleWrapper>
          <Fade in={!isSideMenuOpen}>
            <FadeWrapper>
              <QuickSearch hasFixWidth={false} />
              <LanguageSelector />
            </FadeWrapper>
          </Fade>
          <NotificationMenu />
          <UserMenu
            authTokenExpirationDate={authTokenExpirationDate}
            isAuth={permissions.isAuth}
            onLoginClick={onLoginClick}
            onLogoutClick={() => dispatch(postLogout())}
            userNickname={authState?.authTokenDecoded?.nickname ?? null}
          />
        </Toolbar>
      </StyledMuiAppBar>
      <Toolbar variant="dense" />
    </>
  );
};

export default AppBar;
