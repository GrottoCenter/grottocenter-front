import React from 'react';
import PropTypes from 'prop-types';
import { Controller } from 'react-hook-form';
import { useIntl } from 'react-intl';
import { InputAdornment, TextField } from '@mui/material';
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
  rules = { valueAsNumber: true },
  inputProps
}) => {
  const { formatMessage } = useIntl();
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field: { ref, value, onChange } }) => (
        <TextField
          sx={{ flex: '1 1 200px' }}
          disabled={disabled}
          label={formatMessage({ id: label })}
          type="number"
          error={isError}
          helperText={helperText}
          inputRef={ref}
          InputLabelProps={{ shrink: true }}
          InputProps={{
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
            ) : undefined,
            inputProps
          }}
          value={value ?? ''}
          onChange={onChange}
        />
      )}
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
  rules: PropTypes.shape({}),
  inputProps: PropTypes.shape({})
};

export default NumberField;
