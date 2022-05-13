import { Box, TextField } from '@material-ui/core';
import React from 'react';
import { Controller } from 'react-hook-form';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import Section from '../../FormSection';
import PositionMap from './Position';

const Location = ({ control, errors }) => {
  const { formatMessage } = useIntl();

  const validateLatitude = value => {
    if (value > 90 || value < -90) {
      return formatMessage({ id: 'Latitude must be between -90 and 90' });
    }
    return true;
  };

  const validateLongitude = value => {
    if (value > 180 || value < -180) {
      return formatMessage({ id: 'Longitude must be between -180 and 180' });
    }
    return true;
  };

  return (
    <Section sectionTitle={formatMessage({ id: 'Organizaton information' })}>
      <Box display="flex" justifyContent="space-between">
        <Controller
          name="organization.latitude"
          control={control}
          rules={{
            validate: validateLatitude
          }}
          render={({ field: { ref, ...field } }) => (
            <TextField
              fullWidth
              label={formatMessage({ id: 'Latitude' })}
              type="number"
              error={!!errors?.organization?.latitude}
              inputRef={ref}
              helperText={errors?.organization?.latitude?.message}
              {...field}
              onChange={e => field.onChange(Number(e.target.value))}
            />
          )}
        />

        <Controller
          name="organization.longitude"
          control={control}
          rules={{
            validate: validateLongitude
          }}
          render={({ field: { ref, ...field } }) => (
            <TextField
              fullWidth
              autoFocus
              label={formatMessage({ id: 'Longitude' })}
              type="number"
              error={!!errors?.organization?.longitude}
              inputRef={ref}
              helperText={errors?.organization?.longitude?.message}
              {...field}
              onChange={e => field.onChange(Number(e.target.value))}
              value={field.value}
            />
          )}
        />
      </Box>
      <PositionMap control={control} />
    </Section>
  );
};

Location.propTypes = {
  errors: PropTypes.shape({
    organization: PropTypes.shape({
      latitude: PropTypes.shape({ message: PropTypes.string }),
      longitude: PropTypes.shape({ message: PropTypes.string })
    })
  }),
  control: PropTypes.shape({}),
  setFocus: PropTypes.func
};

export default Location;
