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

const StyledMuiAppBar = styled(MuiAppBar)({
  flexGrow: 1
});

const NavigationGroup = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginRight: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    marginRight: theme.spacing(1)
  }
}));

const Spacer = styled('div')({
  flexGrow: 1
});

const ToolsGroup = styled('div')(({ theme }) => ({
  height: 56,
  display: 'flex',
  gap: 12,
  alignItems: 'center',
  padding: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    display: 'none'
  }
}));

const LogoImage = styled('img')(({ theme }) => ({
  height: 34,
  marginRight: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    height: 32
  }
}));

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

const ActionsGroup = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  marginLeft: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    marginLeft: theme.spacing(1)
  }
}));

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
          <NavigationGroup>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={() => dispatch(toggleSideMenu())}
              size="large">
              <MenuIcon sx={{ fontSize: 32 }} />
            </IconButton>
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
          </NavigationGroup>
          <Spacer />
          <Fade in={!isSideMenuOpen}>
            <ToolsGroup>
              <QuickSearch hasFixWidth={false} />
              <LanguageSelector />
            </ToolsGroup>
          </Fade>
          <ActionsGroup>
            <NotificationMenu />
            <UserMenu
              authTokenExpirationDate={authTokenExpirationDate}
              isAuth={permissions.isAuth}
              onLoginClick={onLoginClick}
              onLogoutClick={() => dispatch(postLogout())}
              userNickname={authState?.authTokenDecoded?.nickname ?? null}
            />
          </ActionsGroup>
        </Toolbar>
      </StyledMuiAppBar>
      <Toolbar variant="dense" />
    </>
  );
};

export default AppBar;
