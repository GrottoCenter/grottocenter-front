import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  FormControl as MuiFormControl,
  FormHelperText,
  FormLabel,
  Slider as MuiSlider,
  Switch
} from '@mui/material';
import { styled } from '@mui/material/styles';

const Slider = styled(MuiSlider)`
  width: 200px;
`;

export const StyledFormControl = styled(MuiFormControl)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: ${({ theme }) => theme.spacing(2)};
`;

function valueLabelFormat(val) {
  if (val > 9999) {
    return `${(val / 1000).toFixed(0)}k`;
  }
  return val;
}

function valuetext(val) {
  return `${val}m`;
}

const SliderNonLinearForm = ({
  label,
  helperText,
  disabled,
  onDisable,
  // value, // value not used because it create glitch with descale...
  onChange,
  marks
}) => {
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(0);

  const scale = val => {
    const priceIndex = marks.findIndex(price => price.value >= val);
    const price = marks[priceIndex];
    if (price.value === val) {
      return price.scaledValue;
    }
    const m =
      (price.scaledValue - marks[priceIndex - 1].scaledValue) /
      (price.value - marks[priceIndex - 1].value || 1);
    const dX = val - marks[priceIndex - 1].value;
    return m * dX + marks[priceIndex - 1].scaledValue;
  };

  const descale = scaledValue => {
    const priceIndex = marks.findIndex(
      price => price.scaledValue >= scaledValue
    );
    const price = marks[priceIndex];
    if (price.scaledValue === scaledValue) {
      return price.value;
    }
    if (priceIndex === 0) {
      return 0;
    }
    const m =
      (price.scaledValue - marks[priceIndex - 1].scaledValue) /
      (price.value - marks[priceIndex - 1].value || 1);
    const dX = scaledValue - marks[priceIndex - 1].scaledValue;
    return dX / m + marks[priceIndex - 1].value;
  };

  const handleChange = (event, newValue) => {
    setMin(scale(newValue[0]));
    setMax(scale(newValue[1]));
    onChange([min, max]);
  };

  return (
    <StyledFormControl>
      <FormLabel>
        {label}
        <Switch checked={!disabled} onChange={onDisable} />
      </FormLabel>
      <Slider
        style={{ marginBottom: '8px' }}
        disabled={disabled}
        onChange={handleChange}
        value={[descale(min), descale(max) || marks.slice(-1)[0].value]}
        scale={scale}
        marks={marks}
        defaultValue={[marks[0].value, marks[marks.length - 1].value]}
        valueLabelFormat={valueLabelFormat}
        aria-labelledby={label}
        getAriaValueText={valuetext}
        valueLabelDisplay="auto"
        min={0}
        max={100}
      />
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </StyledFormControl>
  );
};
const markType = PropTypes.shape({
  value: PropTypes.number,
  scaledValue: PropTypes.number,
  label: PropTypes.string
});
SliderNonLinearForm.propTypes = {
  label: PropTypes.string.isRequired,
  helperText: PropTypes.string,
  disabled: PropTypes.bool.isRequired,
  onDisable: PropTypes.func.isRequired,
  value: PropTypes.arrayOf(PropTypes.number),
  onChange: PropTypes.func.isRequired,
  marks: PropTypes.arrayOf(markType)
};

export default SliderNonLinearForm;
