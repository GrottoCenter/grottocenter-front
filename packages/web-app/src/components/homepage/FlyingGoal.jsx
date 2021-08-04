/* eslint-disable react/destructuring-assignment */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core';
import SyncIcon from '@material-ui/icons/Sync';
import styled from 'styled-components';

const GoalText = styled.span`
  display: none !important; // lesshint importantRule: false
`;

const StyledSyncIcon = withStyles(
  theme => ({
    root: {
      fill: theme.palette.iconColor,
      transition: 'all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms',
      '&:hover': {
        fill: theme.palette.accent1Color
      },
      [theme.breakpoints.up('550')]: {
        width: '180px',
        height: '180px',
        top: '-57px',
        left: '-26px',
        position: 'absolute',
        opacity: '0.2',
        '&:hover': {
          transform: 'rotate(-135deg) scale(1.2, 1.2)',
          opacity: '0.6'
        }
      }
    }
  }),
  { withTheme: true }
)(SyncIcon);

class Goal extends Component {
  handleMouseOver() {
    this.props.updateTargetZone(this.props.entry.description);
  }

  handleMouseOut() {
    this.props.updateTargetZone(this.props.title);
  }

  render() {
    return (
      // eslint-disable-next-line jsx-a11y/mouse-events-have-key-events
      <div
        className={this.props.className}
        onMouseOver={event => this.handleMouseOver(event)}
        onMouseOut={event => this.handleMouseOut(event)}>
        <span style={{ color: this.props.textColor }}>
          {this.props.entry.word}
        </span>
        <StyledSyncIcon />
        <GoalText>{this.props.entry.description}</GoalText>
      </div>
    );
  }
}

Goal.propTypes = {
  className: PropTypes.string.isRequired,
  title: PropTypes.element.isRequired,
  entry: PropTypes.shape({
    word: PropTypes.oneOfType([PropTypes.string, PropTypes.shape({})]),
    description: PropTypes.oneOfType([PropTypes.string, PropTypes.shape({})])
  }).isRequired,
  textColor: PropTypes.string.isRequired,
  updateTargetZone: PropTypes.func.isRequired
};

export default Goal;
