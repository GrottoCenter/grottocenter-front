import React, { Component } from 'react';
import PropTypes from 'prop-types';
import CircularProgress from '@mui/material/CircularProgress';
import SyncKOIcon from '@mui/icons-material/SyncProblem';
import IconButton from '@mui/material/IconButton';
import withStyles from '@mui/styles/withStyles';
import { loadDynamicNumber } from '../../actions/DynamicNumber';
import { DYNAMIC_NUMBER_RELOAD_INTERVAL } from '../../conf/config';

const StyledIconButton = withStyles(
  theme => ({
    root: {
      fill: theme.palette.accent1Color
    }
  }),
  { withTheme: true }
)(IconButton);

const StyledSyncKOIcon = withStyles(
  theme => ({
    root: {
      '&:hover': {
        fill: theme.palette.accent1Color
      },
      fill: theme.palette.primary3Color,
      height: '48px',
      width: '48px'
    }
  }),
  { withTheme: true }
)(SyncKOIcon);

class DynamicNumber extends Component {
  constructor(props) {
    super(props);
    this.reloadNumber = this.reloadNumber.bind(this);
    this.reloadNumber()();
  }

  componentDidMount() {
    this.interval = setInterval(
      this.reloadNumber(),
      DYNAMIC_NUMBER_RELOAD_INTERVAL
    );
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  reloadNumber() {
    const { dispatch, numberType } = this.props;
    return () => dispatch(loadDynamicNumber(numberType));
  }

  render() {
    const { className, number, isFetching } = this.props;
    if (isFetching) {
      return <CircularProgress />;
    }
    if (!number) {
      return (
        <StyledIconButton tooltip="Synchronisation error">
          <StyledSyncKOIcon />
        </StyledIconButton>
      );
    }
    return <span className={className}>{number}</span>;
  }
}

DynamicNumber.propTypes = {
  isFetching: PropTypes.bool,
  number: PropTypes.number,
  numberType: PropTypes.string,
  className: PropTypes.string,
  dispatch: PropTypes.func.isRequired
};

export default DynamicNumber;
