import {
  Select,
  MenuItem,
  FormControl,
  FormHelperText,
  InputLabel
} from '@mui/material';
import { useId, useMemo } from 'react';
import { Controller } from 'react-hook-form';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import countryList from 'react-select-country-list';

const InputCountry = ({ control, formKey, isRequired = true }) => {
  const { formatMessage } = useIntl();
  const options = useMemo(() => countryList().getData(), []);
  const id = useId();

  return (
    <Controller
      rules={{ required: isRequired && formatMessage({ id: 'Required' }) }}
      name={formKey}
      control={control}
      render={({
        field: { ref, name, value, onChange, onBlur },
        fieldState
      }) => (
        <FormControl
          variant="filled"
          fullWidth
          required={isRequired}
          error={!!fieldState.error}>
          <InputLabel id={`${id}-label`}>
            {formatMessage({ id: 'Country' })}
          </InputLabel>
          <Select
            id={id}
            labelId={`${id}-label`}
            aria-describedby={fieldState.error ? `${id}-error` : undefined}
            name={name}
            value={value ?? ''}
            onChange={onChange}
            onBlur={onBlur}
            inputRef={ref}
            fullWidth
            required={isRequired}>
            {!isRequired && (
              <MenuItem value="">{formatMessage({ id: 'none' })}</MenuItem>
            )}
            {options.map(country => (
              <MenuItem key={country.value} value={country.value}>
                {country?.label}
              </MenuItem>
            ))}
          </Select>
          {fieldState.error && (
            <FormHelperText id={`${id}-error`}>
              {fieldState.error.message}
            </FormHelperText>
          )}
        </FormControl>
      )}
    />
  );
};

InputCountry.propTypes = {
  formKey: PropTypes.string.isRequired,
  control: PropTypes.shape({}),
  isRequired: PropTypes.bool
};

export default InputCountry;
