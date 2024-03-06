import React from 'react';
import PropTypes from 'prop-types';
import { Controller } from 'react-hook-form';
import { useIntl } from 'react-intl';
import { TextField } from '@mui/material';

// The InputCoordinate input accept coordinate with ',' or '.'
// But the api only accept notation with '.'
// So before submitting to the api, coordinates must be normalised
export function normelizeCoordinate(coordStr) {
  if (typeof coordStr !== 'string') return coordStr;
  return coordStr.replace(',', '.');
}

const InputCoordinate = ({
  formKey,
  labelName,
  control,
  validatorFn,
  isError,
  helperText,
  isRequired = false
}) => {
  const { formatMessage } = useIntl();
  return (
    <Controller
      name={formKey}
      control={control}
      rules={{
        required: isRequired,
        validate: value => validatorFn(value, formatMessage)
      }}
      render={({ field: { ref, value, onChange } }) => (
        <TextField
          fullWidth
          required={isRequired}
          label={formatMessage({ id: labelName })}
          type="text"
          error={isError}
          inputRef={ref}
          helperText={helperText}
          value={value}
          onChange={e => {
            const reg = /^-?\d*(\.|,)?(\d+)?$/;
            const oldV = value ?? '';
            const newV = e.target.value;
            const res = newV.match(reg) ? newV : oldV;
            return onChange(res);
          }}
        />
      )}
    />
  );
};

InputCoordinate.propTypes = {
  formKey: PropTypes.string.isRequired,
  labelName: PropTypes.string.isRequired,
  control: PropTypes.shape({}),
  validatorFn: PropTypes.func,
  isError: PropTypes.bool.isRequired,
  isRequired: PropTypes.bool,
  helperText: PropTypes.string
};

export default InputCoordinate;
