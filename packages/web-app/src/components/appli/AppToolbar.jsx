import React from 'react';
import PropTypes from 'prop-types';
import { Toolbar, Tooltip } from '@mui/material';
import withStyles from '@mui/styles/withStyles';
import withTheme from '@mui/styles/withTheme';
import HelpIcon from '@mui/icons-material/Help';

import styled from 'styled-components';

import HeaderTitle from './HeaderTitle';
import SideMenuBurgerConnector from '../../containers/SideMenuBurgerConnector';
import { sideMenuWidth } from '../../conf/config';
import Translate from '../common/Translate';

const StyledHelpIcon = withStyles(
  theme => ({
    root: {
      color: theme.palette.primary3Color,
      fontSize: '18px',
      marginLeft: '5px',
      verticalAlign: 'super'
    }
  }),
  { withTheme: true }
)(HelpIcon);

const StyledTooltip = withStyles(
  theme => ({
    tooltip: {
      backgroundColor: theme.palette.primary3Color,
      color: theme.palette.primaryTextColor,
      fontSize: '1.5rem'
    }
  }),
  { withTheme: true }
)(Tooltip);

const StyledToolbar = withStyles(
  theme => ({
    root: {
      width: '100%',
      padding: '0px',
      backgroundColor: theme.palette.primary2Color,
      height: '60px',
      display: 'inline-flex',
      justifyContent: 'space-between'
    }
  }),
  { withTheme: true }
)(Toolbar);

// Center in the parent div using absolute because the Grottocenter logo is taking some place on the left.
const StyledPageTitle = withTheme(styled.span`
  position: absolute;
  left: 50%;
  transform: translate(-50%, 0);
  @media (max-width: 500px) {
    position: initial;
  }
`);

const StyledPageTitleText = withTheme(styled.span`
  color: ${props => props.theme.palette.primary3Color};
  font-size: 4rem;
`);

const TitleGroup = withStyles(
  () => ({
    root: {
      width: sideMenuWidth,
      padding: '0px',
      alignItems: 'center',
      height: '60px'
    }
  }),
  { withTheme: true }
)(Toolbar);

const AppToolbar = props => {
  const { pageTitle, pageTitleTooltip } = props;
  const PageTitleComponent = pageTitle ? (
    <StyledPageTitle>
      <StyledPageTitleText>
        <Translate>{pageTitle}</Translate>
      </StyledPageTitleText>

      {pageTitleTooltip ? (
        <StyledTooltip
          title={<Translate>{pageTitleTooltip}</Translate>}
          placement="right">
          <StyledHelpIcon />
        </StyledTooltip>
      ) : (
        ''
      )}
    </StyledPageTitle>
  ) : (
    ''
  );

  return (
    <StyledToolbar>
      <TitleGroup>
        <HeaderTitle title="Grottocenter" subtitle="Achere - 2018" />
        <SideMenuBurgerConnector />
      </TitleGroup>
      {PageTitleComponent}
    </StyledToolbar>
  );
};

AppToolbar.propTypes = {
  pageTitle: PropTypes.string,
  pageTitleTooltip: PropTypes.string
};
AppToolbar.defaultProps = {
  pageTitle: undefined,
  pageTitleTooltip: undefined
};

export default AppToolbar;
