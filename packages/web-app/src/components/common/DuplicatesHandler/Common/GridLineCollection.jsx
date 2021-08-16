import React from 'react';
import { Grid } from '@material-ui/core';
import PropTypes from 'prop-types';
import { includes } from 'ramda';
import {
  LeftCellCollection,
  MiddleCellCollection,
  RightCellCollection
} from './CellCollection';

const GridLineCollection = ({
  label,
  value1,
  value2,
  stateValue,
  updateState,
  render,
  disabled
}) => {
  // In case  of a collection, wo do not remplace the current state, but instead add the selected value to the array
  const updateCollectionState = value => {
    let newValue;
    if (Array.isArray(value)) {
      newValue = [...stateValue];
      value.forEach(val => {
        if (!includes(val, newValue)) {
          newValue.push(val);
        }
      });
    } else {
      newValue = [...stateValue, value];
    }
    updateState(newValue);
  };

  const removeFromCollectionState = value => {
    const newState = [...stateValue];
    const index = newState.indexOf(value);
    if (index !== -1) {
      newState.splice(index, 1);
    }
    updateState(newState);
  };

  // We only compare relevant values (meaning those returned by render). Otherwise there would be cases where we'd compare object and string.
  const disableButton = value => {
    let i = 0;
    while (i !== stateValue.length && render(value) !== render(stateValue[i])) {
      i += 1;
    }
    return i !== stateValue.length;
  };

  // Disable buttons which add every value of a collection
  const disabledAllButton = values => {
    let cond = true;
    let i = 0;

    if (!Array.isArray(values) || values.length === 0) {
      return true;
    }

    while (cond && i !== values.length) {
      if (!disableButton(values[i])) {
        cond = false;
      }
      i += 1;
    }
    return cond;
  };

  // Show the adornment if the value is not included in the state.
  const showAdornment = value => {
    return !disableButton(value);
  };

  return (
    <Grid container direction="row">
      <Grid container item xs={4}>
        <LeftCellCollection
          label={label}
          values={value1}
          updateState={updateCollectionState}
          render={render}
          disableButton={disableButton}
          disabledAllButton={disabledAllButton}
          showAdornment={showAdornment}
        />
      </Grid>
      <Grid container item xs={4}>
        <MiddleCellCollection
          label={label}
          values={stateValue}
          updateState={removeFromCollectionState}
          render={render}
          disabled={disabled}
        />
      </Grid>
      <Grid container item xs={4}>
        <RightCellCollection
          label={label}
          values={value2}
          updateState={updateCollectionState}
          render={render}
          disableButton={disableButton}
          disabledAllButton={disabledAllButton}
          showAdornment={showAdornment}
        />
      </Grid>
    </Grid>
  );
};

GridLineCollection.propTypes = {
  label: PropTypes.string.isRequired,
  value1: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  value2: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  render: PropTypes.func,
  stateValue: PropTypes.string.isRequired,
  updateState: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default GridLineCollection;
