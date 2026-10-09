import PropTypes from 'prop-types';
import { useRef } from 'react';
import { Controller } from 'react-hook-form';
import { useIntl } from 'react-intl';
import { InputAdornment, TextField } from '@mui/material';
import { validateNumericRange } from '@/utils/numericFieldLimits';
import CustomIcon from '../../../common/CustomIcon';

// A numeric form field wired to React-Hook-Form, with a leading domain icon and
// an optional trailing unit. Grows evenly so it wraps gracefully in a flex row.
// The label is kept shrunk so it never overlaps the leading icon.
const NumberField = ({
  name,
  control,
  label,
  icon,
  unit,
  disabled = false,
  isError = false,
  helperText,
  min,
  max,
  rules = { valueAsNumber: true },
  inputProps
}) => {
  const { formatMessage } = useIntl();
  const inputRef = useRef(null);
  const hasBounds = min !== undefined && max !== undefined;
  const shouldValidateBounds = hasBounds && !disabled;
  const rangeRules = shouldValidateBounds
    ? {
        ...rules,
        validate: {
          ...(typeof rules.validate === 'function'
            ? { custom: rules.validate }
            : rules.validate),
          numericRange: value =>
            validateNumericRange(value, min, max, formatMessage)
        }
      }
    : rules;
  return (
    <Controller
      name={name}
      control={control}
      rules={
        disabled
          ? {}
          : {
              ...rangeRules,
              validate: {
                ...(typeof rangeRules.validate === 'function'
                  ? { custom: rangeRules.validate }
                  : rangeRules.validate),
                numericInput: () =>
                  !inputRef.current?.validity.badInput ||
                  formatMessage({ id: 'form.integerRequired' })
              }
            }
      }
      render={({ field: { ref, value, onChange, onBlur }, fieldState }) => {
        const errorMessage = fieldState.error?.message;
        return (
          <TextField
            sx={{ flex: '1 1 200px' }}
            disabled={disabled}
            name={name}
            label={formatMessage({ id: label })}
            type="number"
            error={isError || !!fieldState.error || !!errorMessage}
            helperText={errorMessage || helperText}
            inputRef={element => {
              inputRef.current = element;
              ref(element);
            }}
            value={value ?? ''}
            onChange={onChange}
            onBlur={onBlur}
            slotProps={{
              htmlInput: hasBounds
                ? { ...inputProps, min, max, step: 1 }
                : inputProps,
              input: {
                startAdornment: (
                  <InputAdornment
                    position="start"
                    sx={
                      disabled
                        ? { '& img': { filter: 'grayscale(1)', opacity: 0.5 } }
                        : undefined
                    }>
                    <CustomIcon type={icon} size={20} />
                  </InputAdornment>
                ),
                endAdornment: unit ? (
                  <InputAdornment position="end">{unit}</InputAdornment>
                ) : undefined
              },

              inputLabel: { shrink: true }
            }}
          />
        );
      }}
    />
  );
};

NumberField.propTypes = {
  name: PropTypes.string.isRequired,
  control: PropTypes.shape({}),
  label: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  unit: PropTypes.string,
  disabled: PropTypes.bool,
  isError: PropTypes.bool,
  helperText: PropTypes.string,
  min: PropTypes.number,
  max: PropTypes.number,
  rules: PropTypes.shape({}),
  inputProps: PropTypes.shape({})
};

export default NumberField;
