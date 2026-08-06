import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { AppBar as MuiAppBar, Box, Toolbar, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { alpha, styled } from '@mui/material/styles';

import {
  displayLoginDialog,
  hideLoginDialog,
  postLogout
} from '../../../actions/Login';
import {
  openMobileSideMenu,
  setSideMenuExpanded
} from '../../../actions/SideMenu';
import {
  useIsDesktopLayout,
  usePermissions,
  useSideMenuOffset
} from '../../../hooks';

import LanguageSelector from '../LanguageSelector';
import NotificationMenu from '../../appli/NotificationMenu';
import MessagesIcon from './MessagesIcon';
import OfflineIndicator from './OfflineIndicator';
import QuickSearch from '../../appli/QuickSearch';
import { MobileSearchTrigger, MobileSearchView } from './MobileSearch';
import { APP_BAR_ICON_SIZE } from './constants';

import UserMenu from './User';

const StyledMuiAppBar = styled(MuiAppBar, {
  shouldForwardProp: prop => prop !== '$offset' && prop !== '$transition'
})(({ $offset, $transition }) => ({
  flexGrow: 1,
  // The bar overlays the full-screen map, which handles pinch itself. Without
  // this, a pinch that lands on the bar zooms the whole page instead — and the
  // bar is then the only spot left to pinch back out, since the map swallows
  // the gesture everywhere else. `pan-y` drops pinch- and double-tap-zoom while
  // keeping drag-to-scroll on the header.
  touchAction: 'pan-y',
  transition: $transition,
  // Must stay in lockstep with MainWrapper's margin (both come from
  // useSideMenuOffset) or the bar and the content below it disagree on where
  // the menu ends.
  width: `calc(100% - ${$offset}px)`,
  marginLeft: `${$offset}px`
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

// Holds the middle of the compact bar, where the desktop chrome puts its tools.
// Nothing lives there below `md`: the brand moved to the side menu and the
// search is an icon among the actions.
const Spacer = styled('div')({
  flexGrow: 1
});

// Desktop only — rendered conditionally rather than hidden by a media query, so
// the bar has a single source of truth for which chrome it is showing.
const ToolsGroup = styled('div')(({ theme }) => ({
  height: 56,
  display: 'flex',
  flexGrow: 1,
  gap: 12,
  alignItems: 'center',
  padding: theme.spacing(1)
}));

// A bare chevron is a thin glyph surrounded by air: on the brown bar it reads
// as decoration rather than as a control. The ring is what makes it look
// pressable at a glance — the same treatment the reference designs give their
// rail toggle. The burger needs none of this: it is already a solid mark.
const RailToggleButton = styled(IconButton)(({ theme }) => ({
  border: `1px solid ${alpha(theme.palette.primary.contrastText, 0.5)}`,
  '&:hover': {
    borderColor: theme.palette.primary.contrastText,
    backgroundColor: alpha(theme.palette.primary.contrastText, 0.14)
  }
}));

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
  const { formatMessage } = useIntl();
  const permissions = usePermissions();
  const authState = useSelector(state => state.login);
  const isExpanded = useSelector(state => state.sideMenu.isExpanded);
  const isDesktop = useIsDesktopLayout();
  const { width: sideMenuOffset, transition } = useSideMenuOffset();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);

  // Search mode only exists in the compact bar. Growing past `md` while it is
  // open would otherwise strand the bar with no navigation and no way back,
  // since the toolbar that owns the exit is the one being replaced.
  useEffect(() => {
    if (isDesktop) setIsSearchOpen(false);
  }, [isDesktop]);

  // Desktop collapses the rail in place; mobile reveals the overlay.
  const menuButtonLabel = (() => {
    if (!isDesktop) return formatMessage({ id: 'open drawer' });
    return formatMessage({ id: isExpanded ? 'Collapse menu' : 'Expand menu' });
  })();

  const handleMenuButtonClick = () =>
    dispatch(
      isDesktop ? setSideMenuExpanded(!isExpanded) : openMobileSideMenu()
    );

  const onLoginClick = () =>
    authState.isLoginDialogDisplayed
      ? dispatch(hideLoginDialog())
      : dispatch(displayLoginDialog());

  const authTokenExpirationDate = new Date(
    (authState?.authTokenDecoded?.exp ?? 0) * 1000
  );

  return (
    <>
      <StyledMuiAppBar $offset={sideMenuOffset} $transition={transition}>
        {/* `relative` so search mode can cover the bar instead of replacing its
            content — see MobileSearch. */}
        <Toolbar variant="dense" sx={{ position: 'relative' }}>
          <NavigationGroup>
            {/* A chevron, not a burger: on desktop the menu never goes away,
                    the button only folds it into its rail. No `edge="start"`
                    here — its negative margin would push the ring against the
                    very edge of the bar. */}
            {isDesktop ? (
              <RailToggleButton
                color="inherit"
                aria-label={menuButtonLabel}
                aria-expanded={isExpanded}
                onClick={handleMenuButtonClick}>
                {isExpanded ? <ChevronLeftIcon /> : <ChevronRightIcon />}
              </RailToggleButton>
            ) : (
              <IconButton
                color="inherit"
                aria-label={menuButtonLabel}
                edge="start"
                onClick={handleMenuButtonClick}
                size="large">
                <MenuIcon sx={{ fontSize: APP_BAR_ICON_SIZE }} />
              </IconButton>
            )}
            {/* Next to the burger rather than among the actions on the
                    right: search is navigation, not an account-side action. */}
            {!isDesktop && <MobileSearchTrigger onClick={openSearch} />}
          </NavigationGroup>
          {/* The bar carries no brand at all: it lives in the side menu, in
                  the rail header on desktop and in the drawer header below it. */}
          {isDesktop ? (
            <ToolsGroup>
              <Box sx={{ flexGrow: 1 }}>
                <QuickSearch />
              </Box>
              <Box sx={{ flexShrink: 0 }}>
                <LanguageSelector />
              </Box>
            </ToolsGroup>
          ) : (
            <Spacer />
          )}
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
          {isSearchOpen && <MobileSearchView onClose={closeSearch} />}
        </Toolbar>
      </StyledMuiAppBar>
      <Toolbar variant="dense" />
    </>
  );
};

export default AppBar;
