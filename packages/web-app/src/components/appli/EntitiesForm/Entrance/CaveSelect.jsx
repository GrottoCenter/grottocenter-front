import React from 'react';
import { useController } from 'react-hook-form';
import PropTypes from 'prop-types';

import CaveAutoCompleteSearch from '../../../common/AutoCompleteSearch/CaveAutoCompleteSearch';

const CaveSelection = ({ control, disabled = false }) => {
  const {
    field: { onChange: onIdChange }
  } = useController({
    control,
    name: 'cave.id',
    rules: { required: true }
  });
  const {
    field: { onChange: onNameChange, value: caveNameValue }
  } = useController({
    control,
    name: 'cave.name',
    rules: { required: true }
  });
  const {
    field: { onChange: onLengthChange }
  } = useController({
    control,
    name: 'cave.length'
  });
  const {
    field: { onChange: onDepthChange }
  } = useController({
    control,
    name: 'cave.depth'
  });
  const {
    field: { onChange: onIsDivingChange }
  } = useController({
    control,
    name: 'cave.isDiving'
  });
  const {
    field: { onChange: onTemperatureChange }
  } = useController({
    control,
    name: 'cave.temperature'
  });

  const handleSelection = selection => {
    if (selection?.id) {
      onLengthChange(Number(selection.length));
      onDepthChange(Number(selection.depth));
      onTemperatureChange(Number(selection.temperature));
      onIsDivingChange(Boolean(selection.isDiving));
      onIdChange(Number(selection.id));
      onNameChange(selection.name);
    } else {
      onIdChange(null);
    }
  };

  return (
    <CaveAutoCompleteSearch
      disabled={disabled}
      required
      onSelection={handleSelection}
      value={{ name: caveNameValue }}
    />
  );
};

export default CaveSelection;

CaveSelection.propTypes = {
  control: PropTypes.shape({}),
  disabled: PropTypes.bool,
  errors: PropTypes.shape({
    caveName: PropTypes.string
  })
};
