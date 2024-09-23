import React from 'react';
import PropTypes from 'prop-types';
import { Controller } from 'react-hook-form';
import { useIntl } from 'react-intl';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import {
  InputAdornment,
  IconButton,
  FilledInput,
  FormControl,
  FormHelperText,
  InputLabel
} from '@mui/material';

const InputPassword = ({
  control,
  formKey,
  labelName,
  validatorFn,
  isError,
  helperText,
  isPasswordVisible,
  onShowPassword,
  isRequired = false,
  isDisabled = false
}) => {
  const { formatMessage } = useIntl();

  return (
    <Controller
      name={formKey}
      control={control}
      rules={{
        required: isRequired,
        validate: value =>
          validatorFn ? validatorFn(value, formatMessage) : undefined
      }}
      render={({ field: { ref, value, onChange } }) => (
        <FormControl
          variant="filled"
          fullWidth
          required={isRequired}
          error={(isRequired && value === '') || isError}>
          <InputLabel>{formatMessage({ id: labelName })}</InputLabel>
          <FilledInput
            inputRef={ref}
            name={formatMessage({ id: labelName })}
            onChange={e => {
              onChange(e);
            }}
            required={isRequired}
            value={value}
            error={(isRequired && value === '') || isError}
            type={isPasswordVisible ? 'text' : 'password'}
            disabled={isDisabled ? true : undefined}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={onShowPassword}
                  edge="end"
                  size="large">
                  {isPasswordVisible ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            }
          />
          {helperText && <FormHelperText>{helperText}</FormHelperText>}
        </FormControl>
      )}
    />
  );
};

InputPassword.propTypes = {
  control: PropTypes.shape({}).isRequired,
  formKey: PropTypes.string.isRequired,
  labelName: PropTypes.string.isRequired,
  isError: PropTypes.bool.isRequired,
  onShowPassword: PropTypes.func.isRequired,
  isPasswordVisible: PropTypes.bool.isRequired,
  validatorFn: PropTypes.func,
  helperText: PropTypes.string,
  isRequired: PropTypes.bool,
  isDisabled: PropTypes.bool
};

export default InputPassword;
