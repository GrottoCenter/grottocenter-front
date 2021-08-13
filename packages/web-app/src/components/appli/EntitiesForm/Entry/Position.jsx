import { TextField } from '@material-ui/core';
import React from 'react';
import { Controller } from 'react-hook-form';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import Section from '../FormSection';

const Position = ({ control, errors }) => {
  const { formatMessage } = useIntl();

  return (
    <Section sectionTitle={formatMessage({ id: 'position' })}>
      <Controller
        name="longitude"
        control={control}
        defaultValue={false}
        rules={{ required: true, valueAsNumber: true }}
        render={({ field: { ref, ...field } }) => (
          <TextField
            autoFocus
            required
            label={formatMessage({ id: 'longitude' })}
            type="number"
            error={!!errors.longitude}
            inputRef={ref}
            {...field}
          />
        )}
      />
      <Controller
        name="latitude"
        control={control}
        defaultValue={false}
        rules={{ required: true, valueAsNumber: true }}
        render={({ field: { ref, ...field } }) => (
          <TextField
            required
            label={formatMessage({ id: 'latitude' })}
            type="number"
            error={!!errors.latitude}
            inputRef={ref}
            {...field}
          />
        )}
      />
    </Section>
  );
};

Position.propTypes = {
  errors: PropTypes.arrayOf(PropTypes.shape({})),
  control: PropTypes.func
};

export default Position;
