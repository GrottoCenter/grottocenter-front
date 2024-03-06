import React, { Component } from 'react';
import PropTypes from 'prop-types';
import withStyles from '@mui/styles/withStyles';
import SyncIcon from '@mui/icons-material/Sync';
import { styled } from '@mui/material/styles';

const GoalText = styled('span')`
  display: none !important; // lesshint importantRule: false
`;

const StyledSyncIcon = withStyles(
  theme => ({
    root: {
      fill: theme.palette.iconColor,
      transition: 'all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms !important',
      '&:hover': {
        fill: theme.palette.accent1Color
      },
      [theme.breakpoints.up('550')]: {
        width: '180px !important',
        height: '180px !important',
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
    const { updateTargetZone, entry } = this.props;
    updateTargetZone(entry.description);
  }

  handleMouseOut() {
    const { updateTargetZone, title } = this.props;
    updateTargetZone(title);
  }

  render() {
    const { className, textColor, entry } = this.props;
    return (
      // eslint-disable-next-line jsx-a11y/mouse-events-have-key-events
      <div
        className={className}
        onMouseOver={event => this.handleMouseOver(event)}
        onMouseOut={event => this.handleMouseOut(event)}>
        <span style={{ color: textColor }}>{entry.word}</span>
        <StyledSyncIcon />
        <GoalText>{entry.description}</GoalText>
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
