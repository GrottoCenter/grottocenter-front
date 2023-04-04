import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  AppBar as MuiAppBar,
  Toolbar,
  IconButton,
  Typography,
  ThemeProvider,
  Fade
} from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import styled from 'styled-components';

import { createTheme } from '@material-ui/core/styles';
import LanguageSelector from '../LanguageSelector';
import UserMenu from './User';
import { logoGC } from '../../../conf/config';
import NotificationMenu from '../../appli/NotificationMenu';

const StyledMuiAppBar = styled(MuiAppBar)`
  flex-grow: 1;
`;

const LanguageWrapper = styled.div`
  height: 56px;
  padding: ${props => props.theme.spacing(2)}px;
  ${props => props.theme.breakpoints.down('xs')} {
    display: none;
  }
`;

const SearchWrapper = styled.div`
  padding: ${props => props.theme.spacing(2)}px;
  ${props => props.theme.breakpoints.down('xs')} {
    display: none;
  }
`;

const TitleWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: baseline;
`;

const LogoWrapper = styled.div`
  display: flex;
  align-items: baseline;
`;

const LogoImage = styled.img(
  ({ theme }) => `
  padding-right: ${theme.spacing(2)}px;
  height: 30px;
  ${theme.breakpoints.down('xs')} {
    height: 25px;
  }
`
);

const GrottoTxt = styled.div(
  ({ theme }) => `
  ${theme.breakpoints.down('xs')} {
    display: none;
  }
`
);

const RightWrapper = styled.div`
  margin-left: auto;
  display: flex;
`;
export const StyledLink = styled(Link)`
  color: inherit;
  text-decoration: inherit;
  cursor: pointer;
  display: flex;
`;

const AppBar = ({
  authTokenExpirationDate,
  AutoCompleteSearch,
  isAuth,
  onLoginClick,
  onLogoutClick,
  toggleMenu,
  userNickname,
  isSideMenuOpen
}) => (
  <>
    <StyledMuiAppBar>
      <Toolbar variant="dense">
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={toggleMenu}>
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
        <RightWrapper>
          {!!AutoCompleteSearch && (
            <>
              <SearchWrapper>
                <AutoCompleteSearch />
              </SearchWrapper>
              <Fade in={!isSideMenuOpen}>
                <LanguageWrapper>
                  <ThemeProvider
                    theme={theme =>
                      createTheme({
                        ...theme,
                        palette: {
                          ...theme.palette,
                          type: 'dark'
                        }
                      })
                    }>
                    <LanguageSelector />
                  </ThemeProvider>
                </LanguageWrapper>
              </Fade>
            </>
          )}
        </RightWrapper>
        <NotificationMenu />
        <UserMenu
          authTokenExpirationDate={authTokenExpirationDate}
          isAuth={isAuth}
          onLoginClick={onLoginClick}
          onLogoutClick={onLogoutClick}
          userNickname={userNickname}
        />
      </Toolbar>
    </StyledMuiAppBar>
    <Toolbar variant="dense" />
  </>
);

AppBar.propTypes = {
  authTokenExpirationDate: PropTypes.instanceOf(Date).isRequired,
  AutoCompleteSearch: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.element,
    PropTypes.func
  ]),
  toggleMenu: PropTypes.func.isRequired,
  isAuth: PropTypes.bool.isRequired,
  onLoginClick: PropTypes.func.isRequired,
  onLogoutClick: PropTypes.func.isRequired,
  userNickname: PropTypes.string,
  isSideMenuOpen: PropTypes.bool.isRequired
};

export default AppBar;
