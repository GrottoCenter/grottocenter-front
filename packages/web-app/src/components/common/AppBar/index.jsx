import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { AppBar as MuiAppBar, Box, Toolbar, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { alpha, styled } from '@mui/material/styles';
import GCLogo from '../GCLogo';

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

// Mobile only: on desktop the brand lives permanently in the side rail's
// header, which is why it no longer appears here at all. Below `sm` the
// wordmark is dropped and only the logo is kept, for room.
const BrandLogo = styled(GCLogo)(({ theme }) => ({
  marginRight: theme.spacing(1),
  cursor: 'pointer',
  [theme.breakpoints.down('sm')]: {
    '& .MuiTypography-root': { display: 'none' }
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
        <Toolbar variant="dense">
          <NavigationGroup>
            {/* A chevron, not a burger: on desktop the menu never goes away,
                the button only folds it into its rail. No `edge="start"` here —
                its negative margin would push the ring against the very edge of
                the bar. */}
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
                <MenuIcon sx={{ fontSize: 32 }} />
              </IconButton>
            )}
            {/* Desktop has the brand in the rail header; repeating it here would
                be the second Grottocenter logo on screen. */}
            {!isDesktop && <BrandLogo size={34} showWordmark />}
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
