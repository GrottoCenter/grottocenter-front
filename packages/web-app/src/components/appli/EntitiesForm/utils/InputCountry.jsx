import { Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import React, { useMemo } from 'react';
import { Controller } from 'react-hook-form';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import countryList from 'react-select-country-list';

const InputCountry = ({ control, formKey }) => {
  const { formatMessage } = useIntl();
  const options = useMemo(() => countryList().getData(), []);

  return (
    <FormControl variant="filled" fullWidth required>
      <InputLabel>{formatMessage({ id: 'Country' })}</InputLabel>
      <Controller
        rules={{
          required: true
        }}
        name={formKey}
        control={control}
        render={({ field }) => (
          <Select {...field} fullWidth required>
            {options.map(country => (
              <MenuItem key={country.value} value={country.value}>
                {country?.label}
              </MenuItem>
            ))}
          </Select>
        )}
      />
    </FormControl>
  );
};

InputCountry.propTypes = {
  formKey: PropTypes.string.isRequired,
  control: PropTypes.shape({})
};

export default InputCountry;
