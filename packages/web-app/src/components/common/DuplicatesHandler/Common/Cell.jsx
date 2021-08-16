import React from 'react';
import { Fab, Grid, InputAdornment } from '@material-ui/core';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import PropTypes from 'prop-types';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import StringInput from '../../Form/StringInput';
import { MarginLeftDiv, MarginRightDiv } from './WrapperUtilities';

export const RightCell = ({
  value,
  label,
  updateState,
  render,
  disableButton,
  showAdornment
}) => {
  return (
    <Grid container direction="row" justify="flex-end" alignItems="center">
      <MarginRightDiv>
        <Fab
          onClick={() => updateState(value)}
          color="primary"
          size="small"
          disabled={disableButton(value)}>
          <ArrowBackIosIcon />
        </Fab>
      </MarginRightDiv>
      <StringInput
        value={render(value)}
        valueName={label}
        disabled
        fullWidth={false}
        endAdornment={
          showAdornment ? (
            <InputAdornment position="end">
              <ErrorOutlineIcon color="secondary" />
            </InputAdornment>
          ) : (
            <></>
          )
        }
      />
    </Grid>
  );
};

export const MiddleCell = ({ value, label, updateState, render, disabled }) => {
  return (
    <StringInput
      value={render(value)}
      valueName={label}
      onValueChange={updateState}
      disabled={disabled}
      fullWidth
    />
  );
};

export const LeftCell = ({
  value,
  label,
  updateState,
  render,
  disableButton,
  showAdornment
}) => {
  return (
    <Grid container direction="row" justify="flex-start" alignItems="center">
      <StringInput
        value={render(value)}
        valueName={label}
        disabled
        fullWidth={false}
        startAdornment={
          showAdornment ? (
            <InputAdornment position="start">
              <ErrorOutlineIcon color="secondary" />
            </InputAdornment>
          ) : (
            <></>
          )
        }
      />
      <MarginLeftDiv>
        <Fab
          onClick={() => updateState(value)}
          color="primary"
          size="small"
          disabled={disableButton(value)}>
          <ArrowForwardIosIcon />
        </Fab>
      </MarginLeftDiv>
    </Grid>
  );
};

RightCell.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  render: PropTypes.func,
  updateState: PropTypes.func.isRequired,
  disableButton: PropTypes.bool,
  showAdornment: PropTypes.bool.isRequired
};
LeftCell.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  render: PropTypes.func,
  updateState: PropTypes.func.isRequired,
  disableButton: PropTypes.bool,
  showAdornment: PropTypes.bool.isRequired
};
MiddleCell.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  render: PropTypes.func,
  updateState: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};
