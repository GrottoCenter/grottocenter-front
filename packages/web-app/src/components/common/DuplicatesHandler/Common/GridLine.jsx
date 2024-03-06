import React from 'react';
import { Grid } from '@mui/material';
import { equals } from 'ramda';
import PropTypes from 'prop-types';
import { LeftCell, MiddleCell, RightCell } from './Cell';

const GridLine = ({
  label,
  value1,
  value2,
  render,
  stateValue,
  updateState,
  disabled = false
}) => {
  const disableButton = value =>
    equals(render(value), render(stateValue)) || equals(render(value), '');

  const showAdornment = value => render(value) !== render(stateValue);

  // The center cell can't be put in a function, or else each rerender will cause the loss of the focus on the input.
  return (
    <Grid container direction="row">
      <Grid container item xs={4}>
        <LeftCell
          value={value1}
          label={label}
          render={render}
          updateState={updateState}
          disableButton={disableButton}
          showAdornment={showAdornment(value1)}
        />
      </Grid>
      <Grid container item xs={4}>
        <MiddleCell
          value={stateValue}
          updateState={updateState}
          label={label}
          render={render}
          disabled={disabled}
        />
      </Grid>
      <Grid container item xs={4}>
        <RightCell
          value={value2}
          label={label}
          render={render}
          updateState={updateState}
          disableButton={disableButton}
          showAdornment={showAdornment(value2)}
        />
      </Grid>
    </Grid>
  );
};

export default React.memo(GridLine);

GridLine.propTypes = {
  label: PropTypes.string.isRequired,
  value1: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  value2: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  render: PropTypes.func,
  stateValue: PropTypes.string.isRequired,
  updateState: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};
