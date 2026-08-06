import { useDispatch, useSelector } from 'react-redux';
import { AppBar as MuiAppBar, Box, Toolbar, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { styled } from '@mui/material/styles';
import { isMobileOnly } from 'react-device-detect';
import AppLink from '../AppLink';

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
import MessagesIcon from './MessagesIcon';
import OfflineIndicator from './OfflineIndicator';
import QuickSearch from '../../appli/QuickSearch';

import UserMenu from './User';

const StyledMuiAppBar = styled(MuiAppBar, {
  shouldForwardProp: prop => prop !== '$isSideMenuOpen'
})(({ theme, $isSideMenuOpen }) => ({
  flexGrow: 1,
  // The bar overlays the full-screen map, which handles pinch itself. Without
  // this, a pinch that lands on the bar zooms the whole page instead — and the
  // bar is then the only spot left to pinch back out, since the map swallows
  // the gesture everywhere else. `pan-y` drops pinch- and double-tap-zoom while
  // keeping drag-to-scroll on the header.
  touchAction: 'pan-y',
  ...(!isMobileOnly && {
    transition: theme.transitions.create(['margin', 'width'], {
      easing: $isSideMenuOpen
        ? theme.transitions.easing.easeOut
        : theme.transitions.easing.sharp,
      duration: $isSideMenuOpen
        ? theme.transitions.duration.enteringScreen
        : theme.transitions.duration.leavingScreen
    }),
    ...($isSideMenuOpen && {
      width: `calc(100% - ${theme.sideMenuWidth}px)`,
      marginLeft: `${theme.sideMenuWidth}px`
    })
  })
}));

const NavigationGroup = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  marginRight: theme.spacing(1),
  [theme.breakpoints.down('sm')]: {
    marginRight: theme.spacing(0.5)
  }
}));

const Spacer = styled('div')({
  flexGrow: 1
});

const ToolsGroup = styled('div')(({ theme }) => ({
  height: 56,
  display: 'flex',
  flexGrow: 1,
  gap: 12,
  alignItems: 'center',
  padding: theme.spacing(1),
  [theme.breakpoints.down('sm')]: {
    display: 'none'
  }
}));

const LogoImage = styled('img')(({ theme }) => ({
  height: 34,
  marginRight: theme.spacing(1),
  [theme.breakpoints.down('sm')]: {
    height: 32
  }
}));

export const AppTitle = styled('span')(({ theme }) => ({
  ...theme.typography.h4
}));

const GrottoTxt = styled(AppTitle)(({ theme }) => ({
  [theme.breakpoints.down('sm')]: { display: 'none' }
}));

export const StyledLink = styled(AppLink)`
  color: inherit;
  text-decoration: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
`;

const ActionsGroup = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  marginLeft: theme.spacing(1),
  [theme.breakpoints.down('sm')]: {
    gap: theme.spacing(0),
    marginLeft: theme.spacing(0.5)
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
      <StyledMuiAppBar $isSideMenuOpen={isSideMenuOpen}>
        <Toolbar variant="dense">
          <NavigationGroup>
            <IconButton
              color="inherit"
              aria-label="toggle drawer"
              edge="start"
              onClick={() => dispatch(toggleSideMenu())}
              size="large">
              <MenuIcon sx={{ fontSize: 32 }} />
            </IconButton>
            {(!isSideMenuOpen || isMobileOnly) && (
              <StyledLink to="/">
                <LogoImage
                  id="grottocenter-logo"
                  src={logoGC}
                  alt="Grottocenter"
                />
                <GrottoTxt>Grottocenter</GrottoTxt>
              </StyledLink>
            )}
          </NavigationGroup>
          <Spacer sx={{ display: { xs: 'block', sm: 'none' } }} />
          <ToolsGroup>
            <Box sx={{ flexGrow: 1 }}>
              <QuickSearch />
            </Box>
            <Box sx={{ flexShrink: 0 }}>
              <LanguageSelector />
            </Box>
          </ToolsGroup>
          <ActionsGroup>
            <OfflineIndicator />
            <NotificationMenu />
            <MessagesIcon />
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
