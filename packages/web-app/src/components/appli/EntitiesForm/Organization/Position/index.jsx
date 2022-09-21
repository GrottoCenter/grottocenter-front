import { Box, TextField } from '@material-ui/core';
import React from 'react';
import { Controller } from 'react-hook-form';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import {
  validateLatitude,
  validateLongitude
} from '../../../../../util/validateLatLong';
import Section from '../../FormSection';
import PositionMap from './Position';

const Position = ({ control, errors }) => {
  const { formatMessage } = useIntl();

  return (
    <Section sectionTitle={formatMessage({ id: 'Organizaton information' })}>
      <Box display="flex" justifyContent="space-between">
        <Controller
          name="organization.latitude"
          control={control}
          rules={{
            validate: value => validateLatitude(value, formatMessage)
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
            validate: value => validateLongitude(value, formatMessage)
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

Position.propTypes = {
  errors: PropTypes.shape({
    organization: PropTypes.shape({
      latitude: PropTypes.shape({ message: PropTypes.string }),
      longitude: PropTypes.shape({ message: PropTypes.string })
    })
  }),
  control: PropTypes.shape({}).isRequired
};

export default Position;
