import React from 'react';
import { Fab, Grid, InputAdornment, useTheme } from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import PropTypes from 'prop-types';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import StringInput from '../../Form/StringInput';
import { MarginLeftDiv, MarginRightDiv } from './WrapperUtilities';
import AdornementPlaceholder from './AdornementPlaceholder';

export const RightCell = ({
  value,
  label,
  updateState,
  render,
  disableButton,
  showAdornment,
  severity
}) => {
  const theme = useTheme();
  let iconColor;
  switch (severity) {
    case 'primary':
      iconColor = theme.palette.successColor;
      break;
    case 'secondary':
      iconColor = theme.palette.errorColor;
      break;
    default:
      iconColor = theme.palette.secondary.light;
  }
  return (
    <Grid
      container
      direction="row"
      justifyContent="flex-end"
      alignItems="center">
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
              <ErrorOutlineIcon style={{ color: iconColor }} />
            </InputAdornment>
          ) : (
            <AdornementPlaceholder />
          )
        }
      />
    </Grid>
  );
};

export const MiddleCell = ({ value, label, updateState, render, disabled }) => (
  <StringInput
    value={render(value)}
    valueName={label}
    onValueChange={updateState}
    disabled={disabled}
    fullWidth
  />
);

export const LeftCell = ({
  value,
  label,
  updateState,
  render,
  disableButton,
  showAdornment,
  severity
}) => {
  const theme = useTheme();
  let iconColor;
  switch (severity) {
    case 'primary':
      iconColor = theme.palette.successColor;
      break;
    case 'secondary':
      iconColor = theme.palette.errorColor;
      break;
    default:
      iconColor = theme.palette.secondary.light;
  }
  return (
    <Grid
      container
      direction="row"
      justifyContent="flex-start"
      alignItems="center">
      <StringInput
        value={render(value)}
        valueName={label}
        disabled
        fullWidth={false}
        startAdornment={
          showAdornment ? (
            <InputAdornment position="start">
              <ErrorOutlineIcon style={{ color: iconColor }} />
            </InputAdornment>
          ) : (
            <AdornementPlaceholder />
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
  disableButton: PropTypes.func,
  showAdornment: PropTypes.bool.isRequired,
  severity: PropTypes.oneOf(['primary', 'secondary'])
};
LeftCell.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  render: PropTypes.func,
  updateState: PropTypes.func.isRequired,
  disableButton: PropTypes.func,
  showAdornment: PropTypes.bool.isRequired,
  severity: PropTypes.oneOf(['primary', 'secondary'])
};
MiddleCell.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  render: PropTypes.func,
  updateState: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};
