import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Switch,
  TextField
} from '@material-ui/core';
import React from 'react';
import { Controller } from 'react-hook-form';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import Section from '../FormSection';

const Details = ({ control, errors }) => {
  const { formatMessage } = useIntl();

  return (
    <Section sectionTitle={formatMessage({ id: 'details' })}>
      <Controller
        name="depth"
        control={control}
        rules={{ valueAsNumber: true }}
        render={({ field: { ref, ...field } }) => (
          <TextField
            autoFocus
            label={formatMessage({ id: 'depth' })}
            type="number"
            error={!!errors.depth}
            inputRef={ref}
            {...field}
          />
        )}
      />
      <Controller
        name="length"
        control={control}
        defaultValue={false}
        rules={{ valueAsNumber: true }}
        render={({ field: { ref, ...field } }) => (
          <TextField
            label={formatMessage({ id: 'length' })}
            type="number"
            inputRef={ref}
            {...field}
          />
        )}
      />
      <Controller
        name="temperature"
        control={control}
        defaultValue={false}
        rules={{ maxLength: 5, valueAsNumber: true }}
        render={({ field: { ref, ...field } }) => (
          <TextField
            label={formatMessage({ id: 'temperature' })}
            type="number"
            error={!!errors.temperature}
            inputRef={ref}
            {...field}
          />
        )}
      />
      <Controller
        name="isDiving"
        control={control}
        defaultValue={false}
        render={({ field: { ref, ...field } }) => (
          <FormControl component="fieldset" error={!!errors.isDiving}>
            <FormLabel component="legend">entry is diving</FormLabel>
            <FormControlLabel
              control={<Switch inputRef={ref} {...field} />}
              label={formatMessage({ id: 'is diving' })}
            />
          </FormControl>
        )}
      />
    </Section>
  );
};

Details.propTypes = {
  errors: PropTypes.arrayOf(PropTypes.shape({})),
  control: PropTypes.func
};

export default Details;
