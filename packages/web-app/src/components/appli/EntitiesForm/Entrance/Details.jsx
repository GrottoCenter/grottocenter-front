import {
  Box,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputAdornment,
  Switch,
  TextField
} from '@material-ui/core';
import React from 'react';
import { Controller } from 'react-hook-form';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import Section from '../FormSection';
import Translate from '../../../common/Translate';

const StyledFormControl = styled(FormControl)`
  margin-top: ${({ theme }) => theme.spacing(2)}px;
`;

const Details = ({ control, errors, isReadonly = false }) => {
  const { formatMessage } = useIntl();

  const validateTemperature = value => {
    if (value > 100 || value < -100) {
      return formatMessage({
        id: 'Temperature must be between -100 and 100 °C'
      });
    }
    return true;
  };
  const validateDistance = value => {
    if (value < 0) {
      return formatMessage({ id: 'Distance must be superior or equal to 0' });
    }
    return true;
  };

  return (
    <Section sectionTitle={formatMessage({ id: 'details' })}>
      <Box display="flex" justifyContent="space-between">
        <Controller
          name="cave.depth"
          control={control}
          rules={{ valueAsNumber: true, validate: validateDistance }}
          render={({ field: { ref, ...field } }) => (
            <TextField
              disabled={isReadonly}
              fullWidth
              autoFocus
              label={formatMessage({ id: 'Depth' })}
              type="number"
              error={!!errors.depth}
              inputRef={ref}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="start">m</InputAdornment>
                )
              }}
              helperText={errors.depth?.message}
              {...field}
            />
          )}
        />
        <Controller
          name="cave.length"
          control={control}
          rules={{ valueAsNumber: true, validate: validateDistance }}
          render={({ field: { ref, ...field } }) => (
            <TextField
              disabled={isReadonly}
              fullWidth
              label={formatMessage({ id: 'Length' })}
              type="number"
              error={!!errors.length}
              inputRef={ref}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="start">m</InputAdornment>
                )
              }}
              helperText={errors.length?.message}
              {...field}
            />
          )}
        />
        <Controller
          name="cave.temperature"
          control={control}
          rules={{
            valueAsNumber: true,
            validate: validateTemperature
          }}
          render={({ field: { ref, ...field } }) => (
            <TextField
              disabled={isReadonly}
              fullWidth
              label={formatMessage({ id: 'Temperature' })}
              type="number"
              error={!!errors.temperature}
              inputRef={ref}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="start">°C</InputAdornment>
                )
              }}
              helperText={errors.temperature?.message}
              {...field}
            />
          )}
        />
      </Box>

      <Controller
        name="cave.isDiving"
        control={control}
        defaultValue={false}
        render={({ field: { ref, ...field } }) => (
          <StyledFormControl
            disabled={isReadonly}
            component="fieldset"
            error={!!errors.isDiving}>
            <FormLabel component="legend">
              <Translate>The cave contains water</Translate>
            </FormLabel>
            <FormControlLabel
              control={
                <Switch
                  inputRef={ref}
                  {...field}
                  checked={field.value}
                  onChange={e => field.onChange(e.target.checked)}
                />
              }
              label={
                field.value
                  ? formatMessage({ id: 'True' })
                  : formatMessage({ id: 'False' })
              }
            />
          </StyledFormControl>
        )}
      />
    </Section>
  );
};

Details.propTypes = {
  errors: PropTypes.shape({
    depth: PropTypes.shape({ message: PropTypes.string }),
    length: PropTypes.shape({ message: PropTypes.string }),
    temperature: PropTypes.shape({ message: PropTypes.string }),
    isDiving: PropTypes.shape({ message: PropTypes.string })
  }),
  control: PropTypes.shape({}),
  isReadonly: PropTypes.bool
};

export default Details;
