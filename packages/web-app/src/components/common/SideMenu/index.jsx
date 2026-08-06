import { memo, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  Divider,
  Drawer,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Launch, MenuBook } from '@mui/icons-material';
import LanguageIcon from '@mui/icons-material/Translate';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import PropTypes from 'prop-types';
import { isIOS } from 'react-device-detect';
import { useDispatch, useSelector } from 'react-redux';
import { styled, alpha } from '@mui/material/styles';
import { useIntl } from 'react-intl';
import AppLink from '../AppLink';
import GCLogo from '../GCLogo';
import {
  closeMobileSideMenu,
  openMobileSideMenu
} from '../../../actions/SideMenu';
import {
  useAuthNavigate,
  useIsDesktopLayout,
  useOnlineStatus
} from '../../../hooks';
import OfflineDisabled from '../OfflineDisabled';
import MenuLinks, {
  menuItemSx,
  menuItemIconSx,
  MENU_ICON_SIZE
} from './MenuLinks';
import Translate from '../Translate';
import LanguageSelector from '../LanguageSelector';
import QuickSearch from '../../appli/QuickSearch';
import { userguideLinks } from '../../../conf/externalLinks';

// Height pinned to appBarHeight, NOT theme.mixins.toolbar: the mixin is 56px but
// 64px above 600px, while the AppBar is locked to appBarHeight by the MuiToolbar
// override. The two sit side by side in the top-left corner, so a mismatch shows
// up as the header hanging 8px below the AppBar's bottom edge.
//
// Expanded, the logo is left-aligned on the icon column below it rather than
// centred: Content's 8px inset plus the items' own 8px (see menuItemSx) puts
// that column at 16px. Centring the logo used to land near the same spot only
// by accident of the wordmark's width — it stopped matching the moment the item
// inset changed, and would break again on any font or wording change.
// Collapsed there is a single icon per row, so centring is the alignment.
const Header = styled('div', {
  shouldForwardProp: prop => prop !== '$isExpanded'
})(({ theme, $isExpanded }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: $isExpanded ? 'flex-start' : 'center',
  padding: $isExpanded
    ? theme.spacing(0.25, 1, 0.25, 2)
    : theme.spacing(0.25, 1),
  height: theme.appBarHeight,
  backgroundColor: alpha(theme.palette.primary.main, 0.06),
  flexShrink: 0,
  boxShadow: `0 1px 0 ${theme.palette.divider}`
}));

// The header has room to breathe, so the wordmark sits 16px off the logo here —
// twice GCLogo's default, which is tuned for the cramped mobile AppBar. Keep it:
// the group is centred, so a narrower gap also shifts it right.
const HeaderLogo = styled(GCLogo)(({ theme }) => ({
  gap: theme.spacing(2),
  color: theme.palette.primary.dark,
  transition: theme.transitions.create('opacity'),
  '&:hover': { opacity: 0.7 }
}));

// The menu's only scroll container — both drawer papers are pinned to
// `overflow: hidden` to keep it that way, overriding MUI's `overflow-y: auto`.
// Scrolling here rather than on the paper is what keeps the header pinned, and
// a single scroller is what keeps the mobile swipe reliable: SwipeableDrawer
// arbitrates each gesture by walking the ancestors for scrollable ones, and a
// second candidate is one more way for a drag to go to the wrong element.
const Content = styled('div')`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 8px 8px;
  touch-action: pan-y;
`;

const Footer = styled('div')`
  margin-top: auto;
`;

const ContributeButton = styled(Button, {
  shouldForwardProp: prop => prop !== '$isExpanded'
})(({ theme, $isExpanded }) => ({
  ...($isExpanded
    ? {
        margin: theme.spacing(1, 0.5),
        width: `calc(100% - ${theme.spacing(1)})`
      }
    : {
        // Exactly the box menuItemSx gives the nav rows — same width, same zero
        // inset — so the "+" lands on the same vertical axis as the icons above
        // it instead of on an axis of its own.
        margin: theme.spacing(1, 0),
        width: '100%',
        minWidth: 0,
        padding: theme.spacing(0.75, 0)
      })
}));

// The whole menu body, shared by both drawers.
//
// Memoised because opening the mobile overlay is a Redux update: without it,
// the body (a MUI Autocomplete, nine Tooltips, eight ripple-bearing rows) would
// re-render synchronously in the commit that sets `open`, delaying the first
// frame of the slide. Keep both props shallow-stable or the bailout is lost.
const SideMenuContent = memo(({ isExpanded, onNavigate }) => {
  const { locale } = useSelector(state => state.intl);
  const theme = useTheme();
  const { formatMessage } = useIntl();
  const isTopbarCompact = useMediaQuery(theme.breakpoints.down('sm'));
  const isOnline = useOnlineStatus();

  const navigateToContribute = useAuthNavigate('/ui/entity/add', {
    onBeforeNavigate: onNavigate
  });

  const handleContributeClick = () => navigateToContribute();

  const userguideUrl =
    userguideLinks[locale] !== undefined
      ? userguideLinks[locale]
      : userguideLinks['*'];

  const contributeLabel = formatMessage({ id: 'Contribute' });
  const userguideLabel = formatMessage({ id: 'User guide' });

  return (
    <>
      <Header $isExpanded={isExpanded}>
        {/* Collapsed, the logo sits in the icon column and should carry the
            same weight as the icons under it, not dominate them. */}
        <HeaderLogo
          size={isExpanded ? 40 : 28}
          showWordmark={isExpanded}
          onClick={onNavigate}
        />
      </Header>
      <Content>
        {isTopbarCompact && (
          <>
            <Box sx={{ py: 0.5 }}>
              <QuickSearch onClose={onNavigate} />
            </Box>
            <Divider />
          </>
        )}
        <MenuLinks toggle={onNavigate} isExpanded={isExpanded} />
        <Divider />
        {/* Every entity-creation form ends in an API write, so the whole
            contribution flow is a dead end offline — block it at the door
            rather than at the submit button. fullWidth so the wrapper doesn't
            shrink the button to its label. */}
        <OfflineDisabled fullWidth>
          {/* Only one tooltip at a time: OfflineDisabled already puts one on
              this button when the network is down, and stacking a second would
              fire both on the same hover. */}
          <Tooltip
            title={contributeLabel}
            placement="right"
            disableHoverListener={isExpanded || !isOnline}
            disableFocusListener={isExpanded || !isOnline}
            disableTouchListener={isExpanded || !isOnline}>
            <ContributeButton
              $isExpanded={isExpanded}
              variant="outlined"
              color="secondary"
              disabled={!isOnline}
              aria-label={contributeLabel}
              // Collapsed, the icon is the whole button, so it goes in as a
              // child at the nav icons' size — `startIcon` would render it at
              // MUI's 20px and drop it out of their weight, on top of adding a
              // right margin that pushes it off-centre.
              startIcon={isExpanded ? <AddCircleIcon /> : undefined}
              onClick={handleContributeClick}>
              {isExpanded ? (
                <Translate>Contribute</Translate>
              ) : (
                <AddCircleIcon sx={{ fontSize: MENU_ICON_SIZE }} />
              )}
            </ContributeButton>
          </Tooltip>
        </OfflineDisabled>
        <Footer>
          <Divider />
          <List>
            <Tooltip
              title={userguideLabel}
              placement="right"
              disableHoverListener={isExpanded}
              disableFocusListener={isExpanded}
              disableTouchListener={isExpanded}>
              {/* Same sx as the nav rows above, so this item stays in their
                  column in both states. */}
              <ListItemButton
                sx={menuItemSx(isExpanded)}
                aria-label={userguideLabel}
                component={AppLink}
                href={userguideUrl}>
                <ListItemIcon sx={menuItemIconSx(isExpanded)}>
                  <MenuBook color="primary" sx={{ fontSize: MENU_ICON_SIZE }} />
                </ListItemIcon>
                {isExpanded && (
                  <>
                    <ListItemText>
                      <Translate>User guide</Translate>
                    </ListItemText>
                    <Launch fontSize="small" color="action" />
                  </>
                )}
              </ListItemButton>
            </Tooltip>
            {/* Mobile only, so always in the expanded geometry — but it still
                has to use the shared insets or it sits 8px right of the nav
                rows above it. */}
            {isTopbarCompact && (
              <ListItem sx={menuItemSx(true)}>
                <ListItemIcon sx={menuItemIconSx(true)}>
                  <LanguageIcon
                    color="primary"
                    sx={{ fontSize: MENU_ICON_SIZE }}
                  />
                </ListItemIcon>
                <LanguageSelector hideIcon />
              </ListItem>
            )}
          </List>
        </Footer>
      </Content>
    </>
  );
});

SideMenuContent.displayName = 'SideMenuContent';

SideMenuContent.propTypes = {
  isExpanded: PropTypes.bool.isRequired,
  // Closes the overlay after a navigation. Undefined on desktop, where the rail
  // stays put and nothing needs dismissing.
  onNavigate: PropTypes.func
};

// Desktop rail. `permanent`, not `persistent`: the navigation never leaves the
// screen, it only trades labels for icons. Width lives here rather than in the
// theme because it is animated between two values.
const MiniDrawer = styled(Drawer, {
  shouldForwardProp: prop => prop !== '$isExpanded'
})(({ theme, $isExpanded }) => {
  const width = $isExpanded
    ? theme.sideMenuWidth
    : theme.sideMenuCollapsedWidth;
  const transition = theme.transitions.create('width', {
    easing: $isExpanded
      ? theme.transitions.easing.easeOut
      : theme.transitions.easing.sharp,
    duration: $isExpanded
      ? theme.transitions.duration.enteringScreen
      : theme.transitions.duration.leavingScreen
  });
  return {
    width,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    transition,
    // MUI's own paper already provides position/top/height and the column
    // flexbox — only the width and its animation are ours.
    '& .MuiDrawer-paper': {
      width,
      // `overflow`, not `overflowX`: the X axis is about the labels, which are
      // still in the DOM while collapsed and must not be able to widen the
      // paper. The Y axis is about who scrolls — see `Content`.
      overflow: 'hidden',
      transition
    }
  };
});

const SideMenu = () => {
  const dispatch = useDispatch();
  const isDesktop = useIsDesktopLayout();
  // Two primitive selections rather than one slice object: each drawer only
  // cares about its own flag, so neither re-renders for the other's.
  const isExpanded = useSelector(state => state.sideMenu.isExpanded);
  const isMobileOpen = useSelector(state => state.sideMenu.isMobileOpen);

  const handleClose = useCallback(
    () => dispatch(closeMobileSideMenu()),
    [dispatch]
  );
  const handleOpen = useCallback(
    () => dispatch(openMobileSideMenu()),
    [dispatch]
  );
  const theme = useTheme();

  // Stable identity so the two blocking renders SwipeableDrawer forces per
  // gesture (`flushSync` on the first touchmove and on touchend) don't make
  // emotion re-serialise these `sx` objects.
  //
  // `slotProps`, not the legacy PaperProps/SwipeAreaProps — MUI resolves them
  // as `slotProps.paper ?? PaperProps`, so mixing the two silently drops one.
  const slotProps = useMemo(
    () => ({
      paper: {
        // `Content` is the only scroller — see the note there.
        sx: { width: theme.sideMenuWidth, overflow: 'hidden' }
      },
      // SwipeableDrawer sizes the exit to continue at the drag velocity, so the
      // curve has to decelerate from it; Slide's default `sharp` restarts from
      // a standstill and lags behind the fling. `enter` restates Slide's own
      // default: a missing key falls through to `transitions.create`'s
      // easeInOut, not to Slide's.
      transition: {
        easing: {
          enter: theme.transitions.easing.easeOut,
          exit: theme.transitions.easing.easeOut
        }
      },
      // Below the AppBar, so the edge-swipe strip can't swallow taps on it.
      swipeArea: { sx: { top: theme.appBarHeight } }
    }),
    [theme]
  );

  if (isDesktop) {
    return (
      <MiniDrawer variant="permanent" anchor="left" $isExpanded={isExpanded}>
        <SideMenuContent isExpanded={isExpanded} />
      </MiniDrawer>
    );
  }

  return (
    <SwipeableDrawer
      variant="temporary"
      anchor="left"
      open={isMobileOpen}
      onClose={handleClose}
      onOpen={handleOpen}
      slotProps={slotProps}
      // Snappier than the default (0.52): drawer commits to open after 30% dragged.
      hysteresis={0.3}
      // More responsive than the default (450 px/s): a short fast fling is enough.
      minFlingVelocity={300}
      // The edge peek fights iOS's native swipe-to-go-back.
      //
      // Do NOT pair it with `disableBackdropTransition` as MUI's demo does:
      // that flag is an FPS escape hatch for low-end devices, and it is what
      // drives the scrim from the drag offset. With it on, the page goes fully
      // black while the panel is still a few pixels in.
      disableDiscovery={isIOS}>
      {/* No `ModalProps={{ keepMounted: true }}`: SwipeableDrawer already
          forces it for `variant="temporary"`. */}
      {/* Always expanded: the overlay covers the page, there is nothing to
          reclaim by hiding the labels. */}
      <SideMenuContent isExpanded onNavigate={handleClose} />
    </SwipeableDrawer>
  );
};

export default SideMenu;
