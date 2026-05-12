import React, { useCallback } from 'react';
import {
  Box,
  Button,
  Divider,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Launch, MenuBook } from '@mui/icons-material';
import LanguageIcon from '@mui/icons-material/Translate';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import PropTypes from 'prop-types';
import { isMobile, isIOS } from 'react-device-detect';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { styled, alpha } from '@mui/material/styles';
import { displayLoginDialog } from '../../../actions/Login';
import { openSideMenu, closeSideMenu } from '../../../actions/SideMenu';
import { usePermissions } from '../../../hooks';
import { AppTitle } from '../AppBar';
import MenuLinks from './MenuLinks';
import Translate from '../Translate';
import LanguageSelector from '../LanguageSelector';
import QuickSearch from '../../appli/QuickSearch';
import { logoGC } from '../../../conf/config';
import { userguideLinks } from '../../../conf/externalLinks';

const Header = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(0, 2),
  ...theme.mixins.toolbar,
  backgroundColor: alpha(theme.palette.primary.main, 0.06),
  flexShrink: 0,
  boxShadow: `0 1px 0 ${theme.palette.divider}`
}));

const HeaderLink = styled(Link)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(3),
  color: theme.palette.primary.dark,
  textDecoration: 'none',
  transition: theme.transitions.create('opacity'),
  '&:hover': { opacity: 0.7 }
}));

const LogoImage = styled('img')(({ theme }) => ({
  height: Math.round(theme.sideMenuWidth * 0.17), // ~40px for 240px sidebar
  flexShrink: 0
}));

const AppName = styled(AppTitle)(({ theme }) => ({
  color: theme.palette.primary.dark
}));

const Content = styled('div')`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow-y: auto;
  padding: 0 8px 8px;
  font-size: 0.95rem;
  touch-action: pan-y;
`;

const Footer = styled('div')`
  margin-top: auto;
`;

const ContributeButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(2, 1),
  width: `calc(100% - ${theme.spacing(2)})`
}));

const SideMenu = ({ isOpen }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuth } = usePermissions();
  const handleClose = useCallback(() => dispatch(closeSideMenu()), [dispatch]);
  const handleOpen = useCallback(() => dispatch(openSideMenu()), [dispatch]);
  const { locale } = useSelector(state => state.intl);
  const theme = useTheme();
  const isTopbarCompact = useMediaQuery(theme.breakpoints.down('sm'));

  const handleContributeClick = () => {
    if (isMobile) handleClose();
    if (isAuth) {
      navigate('/ui/entity/add');
    } else {
      dispatch(displayLoginDialog());
    }
  };

  const userguideUrl =
    userguideLinks[locale] !== undefined
      ? userguideLinks[locale]
      : userguideLinks['*'];

  return (
    <SwipeableDrawer
      variant={isMobile ? 'temporary' : 'persistent'}
      anchor="left"
      open={isOpen}
      onClose={handleClose}
      onOpen={handleOpen}
      // keepMounted prevents React from unmounting the drawer content when closed
      // (variant="temporary" unmounts by default). Without it, the first swipe
      // triggers a full React mount during the gesture, causing jank.
      ModalProps={{ keepMounted: isMobile }}
      // Snappier than the default (0.52): drawer commits to open after 30% dragged.
      hysteresis={0.3}
      // More responsive than the default (450 px/s): a short fast fling is enough.
      minFlingVelocity={300}
      // Standard MUI iOS/Android pattern:
      // - disableBackdropTransition: skip the backdrop fade on Android to save GPU.
      // - disableDiscovery: disable the edge peek on iOS only, where it conflicts
      //   with the native "swipe to go back" system gesture.
      disableBackdropTransition={!isIOS}
      disableDiscovery={isIOS}
      SwipeAreaProps={{ style: { top: theme.appBarHeight } }}>
      <Header>
        <HeaderLink to="/" onClick={isMobile ? handleClose : undefined}>
          <LogoImage src={logoGC} alt="Grottocenter" />
          <AppName>Grottocenter</AppName>
        </HeaderLink>
      </Header>
      <Content>
        {isTopbarCompact && (
          <>
            <Box sx={{ py: 1 }}>
              <QuickSearch onClose={handleClose} />
            </Box>
            <Divider />
          </>
        )}
        <MenuLinks toggle={isMobile ? handleClose : undefined} />
        <Divider />
        <ContributeButton
          variant="outlined"
          color="secondary"
          startIcon={<AddCircleIcon />}
          onClick={handleContributeClick}>
          <Translate>Contribute</Translate>
        </ContributeButton>
        <Footer>
          <Divider />
          <List>
            <ListItemButton
              sx={{ py: '5px' }}
              component="a"
              href={userguideUrl}
              target="_blank"
              rel="noreferrer">
              <ListItemIcon sx={{ minWidth: 42 }}>
                <MenuBook color="primary" sx={{ fontSize: 28 }} />
              </ListItemIcon>
              <ListItemText>
                <Translate>User guide</Translate>
              </ListItemText>
              <Launch fontSize="small" color="action" />
            </ListItemButton>
            {isTopbarCompact && (
              <ListItem sx={{ py: '5px' }}>
                <ListItemIcon sx={{ minWidth: 42 }}>
                  <LanguageIcon color="primary" sx={{ fontSize: 28 }} />
                </ListItemIcon>
                <LanguageSelector hideIcon />
              </ListItem>
            )}
          </List>
        </Footer>
      </Content>
    </SwipeableDrawer>
  );
};

SideMenu.propTypes = {
  isOpen: PropTypes.bool.isRequired
};

export default SideMenu;
