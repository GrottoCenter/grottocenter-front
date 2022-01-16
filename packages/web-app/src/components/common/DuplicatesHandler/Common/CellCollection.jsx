/* eslint-disable react/no-array-index-key */
import React from 'react';
import {
  Fab,
  Grid,
  InputAdornment,
  Typography,
  useTheme
} from '@material-ui/core';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import RemoveIcon from '@material-ui/icons/Remove';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import StringInput from '../../Form/StringInput';
import ActionButton from '../../ActionButton';
import { MarginLeftDiv, MarginRightDiv } from './WrapperUtilities';
import AdornementPlaceholder from './AdornementPlaceholder';

export const RightCellCollection = ({
  values,
  label,
  updateState,
  render,
  disabledAllButton,
  disableButton,
  showAdornment
}) => {
  const { formatMessage } = useIntl();
  const theme = useTheme();

  const getAdornementColor = value => {
    return value && value.id
      ? theme.palette.successColor
      : theme.palette.errorColor;
  };
  return (
    <Grid container direction="column" alignItems="flex-end">
      <Grid
        container
        item
        direction="row"
        justify="flex-end"
        alignItems="center">
        <ActionButton
          label={formatMessage(
            { id: 'take all', defaultMessage: `Take all {label}` },
            { label }
          )}
          onClick={() => updateState(values)}
          color="primary"
          startIcon={<ArrowBackIosIcon />}
          disabled={disabledAllButton(values)}
        />
      </Grid>
      {Array.isArray(values) &&
        values.map((value, index) => (
          <Grid
            key={index}
            container
            direction="row"
            justify="flex-end"
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
            <MarginRightDiv>
              <StringInput
                key={value}
                value={render(value)}
                valueName={`${label} ${index + 1}`}
                disabled
                fullWidth={false}
                endAdornment={
                  showAdornment(value) ? (
                    <InputAdornment position="end">
                      <ErrorOutlineIcon
                        style={{ color: getAdornementColor(value) }}
                      />
                    </InputAdornment>
                  ) : (
                    <AdornementPlaceholder />
                  )
                }
              />
            </MarginRightDiv>
          </Grid>
        ))}
    </Grid>
  );
};

export const MiddleCellCollection = ({
  values,
  label,
  updateState,
  render,
  disabled
}) => {
  return (
    <Grid container item direction="column" alignItems="center">
      <Typography variant="h5" color="primary">
        {label}
      </Typography>
      {Array.isArray(values) &&
        values.map((state, index) => (
          <Grid key={index} container direction="row" alignItems="center">
            <Grid item xs={10}>
              <StringInput
                key={state}
                value={render(state)}
                valueName={`${label} ${index + 1}`}
                fullWidth
                disabled={disabled}
              />
            </Grid>
            <Grid item xs={2}>
              <MarginLeftDiv>
                <Fab
                  onClick={() => updateState(state)}
                  color="primary"
                  size="small">
                  <RemoveIcon />
                </Fab>
              </MarginLeftDiv>
            </Grid>
          </Grid>
        ))}
    </Grid>
  );
};

export const LeftCellCollection = ({
  values,
  label,
  updateState,
  render,
  disabledAllButton,
  disableButton,
  showAdornment
}) => {
  const { formatMessage } = useIntl();
  const theme = useTheme();

  const getAdornementColor = value => {
    return value.id ? theme.palette.successColor : theme.palette.errorColor;
  };
  return (
    <Grid container direction="column">
      <Grid
        container
        item
        direction="row"
        justify="flex-start"
        alignItems="center">
        <ActionButton
          label={formatMessage(
            { id: 'take all', defaultMessage: `Take all {label}` },
            { label }
          )}
          onClick={() => updateState(values)}
          color="primary"
          icon={<ArrowForwardIosIcon />}
          disabled={disabledAllButton(values)}
        />
      </Grid>
      {Array.isArray(values) &&
        values.map((value, index) => (
          <Grid key={index} container item direction="row" alignItems="center">
            <MarginLeftDiv>
              <StringInput
                key={value}
                value={render(value)}
                valueName={`${label} ${index + 1}`}
                disabled
                fullWidth={false}
                startAdornment={
                  showAdornment(value) ? (
                    <InputAdornment position="start">
                      <ErrorOutlineIcon
                        style={{ color: getAdornementColor(value) }}
                      />
                    </InputAdornment>
                  ) : (
                    <AdornementPlaceholder />
                  )
                }
              />
            </MarginLeftDiv>
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
        ))}
    </Grid>
  );
};

RightCellCollection.propTypes = {
  label: PropTypes.string.isRequired,
  values: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  render: PropTypes.func,
  updateState: PropTypes.func.isRequired,
  disabledAllButton: PropTypes.func.isRequired,
  disableButton: PropTypes.func.isRequired,
  showAdornment: PropTypes.func.isRequired
};
LeftCellCollection.propTypes = {
  label: PropTypes.string.isRequired,
  values: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  render: PropTypes.func,
  updateState: PropTypes.func.isRequired,
  disabledAllButton: PropTypes.func.isRequired,
  disableButton: PropTypes.func.isRequired,
  showAdornment: PropTypes.func.isRequired
};
MiddleCellCollection.propTypes = {
  label: PropTypes.string.isRequired,
  values: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  render: PropTypes.func,
  updateState: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};
