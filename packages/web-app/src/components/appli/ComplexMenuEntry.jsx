import React, { Component } from 'react';
import PropTypes from 'prop-types';
import MenuItem from '@material-ui/core/MenuItem';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import { withTheme } from '@material-ui/core/styles';
import styled from 'styled-components';
import { BrowserRouter } from 'react-router-dom';

const FirstLevelMenuItem = withTheme(styled(MenuItem)`
  background-color: ${props => props.theme.palette.primary1Color} !important;
  color: ${props => props.theme.palette.primary3Color} !important;
  transition: all 2s cubic-bezier(0.23, 1, 0.32, 1) 0ms !important;

  & > div > div {
    padding-left: 40px !important;

    & > svg {
      fill: ${props => props.theme.palette.primary3Color} !important;
      left: -4px !important;
    }
  }
`);

class ComplexMenuEntry extends Component {
  constructor(props) {
    super(props);
    const { identifier, open, target, register } = props;
    register(identifier, open, target);
  }

  render() {
    const {
      children,
      icon: defaultIcon,
      identifier,
      open,
      target,
      text,
      toggle,
      toggleSideMenu
    } = this.props;
    const display = open ? 'inherit' : 'none';

    let icon = open ? <ExpandLessIcon /> : <ExpandMoreIcon />;
    if (!children) {
      icon = defaultIcon;
    }

    let callOnClick = () => toggle(identifier);
    if (target) {
      callOnClick = () => {
        BrowserRouter.push(target);
        toggleSideMenu();
      };
    }

    return (
      <div>
        <FirstLevelMenuItem onClick={callOnClick} leftIcon={icon}>
          {text}
        </FirstLevelMenuItem>
        <div
          style={{
            display
          }}>
          {children}
        </div>
      </div>
    );
  }
}

ComplexMenuEntry.propTypes = {
  identifier: PropTypes.string.isRequired,
  text: PropTypes.node.isRequired,
  open: PropTypes.bool.isRequired,
  icon: PropTypes.node,
  children: PropTypes.node,
  register: PropTypes.func.isRequired,
  toggle: PropTypes.func.isRequired,
  target: PropTypes.string,
  toggleSideMenu: PropTypes.func.isRequired
};

export default ComplexMenuEntry;
