import {
  Slide,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@material-ui/core';
import React, { useMemo } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import countryList from 'react-select-country-list';
import MultipleMarkers, {
  isValidPositions
} from '../../../common/Maps/MapMultipleMarkers';
import { useDebounce } from '../../../../hooks';

export const CountrySelection = ({ control }) => {
  const { formatMessage } = useIntl();
  const options = useMemo(() => {
    return countryList().getData();
  }, []);

  return (
    <FormControl variant="filled" fullWidth required>
      <InputLabel>{formatMessage({ id: 'Country' })}</InputLabel>
      <Controller
        rules={{
          required: true
        }}
        name="country"
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

export const PositionMap = ({ control }) => {
  const debouncedLatitude = useDebounce(
    useWatch({ control, name: 'latitude' }),
    300
  );
  const debouncedLongitude = useDebounce(
    useWatch({ control, name: 'longitude' }),
    300
  );
  const validPosition = isValidPositions([
    [debouncedLatitude, debouncedLongitude]
  ]);

  return (
    <Slide direction="up" in={validPosition} mountOnEnter unmountOnExit>
      <div>
        <MultipleMarkers
          positions={
            validPosition ? [[debouncedLatitude, debouncedLongitude]] : []
          }
          loading={validPosition}
          zoom={10}
          // Same style as MuiTextField
          style={{ borderRadius: '4px', margin: '4px' }}
        />
      </div>
    </Slide>
  );
};

PositionMap.propTypes = {
  control: PropTypes.objectOf()
};
CountrySelection.propTypes = {
  control: PropTypes.objectOf()
};
