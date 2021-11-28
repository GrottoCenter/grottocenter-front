import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Switch,
  TextField,
  InputAdornment
} from '@material-ui/core';
import React from 'react';
import { Controller } from 'react-hook-form';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import Section from '../FormSection';
import Translate from '../../../common/Translate';

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
`;

const StyledFormControl = styled(FormControl)`
  margin-top: ${({ theme }) => theme.spacing(2)}px;
`;

const Details = ({ control, errors }) => {
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
      return formatMessage({ id: 'Distance must be superior or equal 0' });
    }
    return true;
  };

  return (
    <Section sectionTitle={formatMessage({ id: 'details' })}>
      <Wrapper>
        <Controller
          name="depth"
          control={control}
          rules={{ valueAsNumber: true, validate: validateDistance }}
          render={({ field: { ref, ...field } }) => (
            <TextField
              disabled
              fullWidth
              autoFocus
              label={formatMessage({ id: 'depth' })}
              type="number"
              error={!!errors.depth}
              inputRef={ref}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="start">m</InputAdornment>
                )
              }}
              // eslint-disable-next-line react/prop-types
              helperText={errors.depth?.message}
              {...field}
            />
          )}
        />
        <Controller
          name="length"
          control={control}
          rules={{ valueAsNumber: true, validate: validateDistance }}
          render={({ field: { ref, ...field } }) => (
            <TextField
              disabled
              fullWidth
              label={formatMessage({ id: 'length' })}
              type="number"
              error={!!errors.length}
              inputRef={ref}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="start">m</InputAdornment>
                )
              }}
              // eslint-disable-next-line react/prop-types
              helperText={errors.length?.message}
              {...field}
            />
          )}
        />
        <Controller
          name="temperature"
          control={control}
          rules={{
            valueAsNumber: true,
            validate: validateTemperature
          }}
          render={({ field: { ref, ...field } }) => (
            <TextField
              disabled
              fullWidth
              label={formatMessage({ id: 'temperature' })}
              type="number"
              error={!!errors.temperature}
              inputRef={ref}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="start">°C</InputAdornment>
                )
              }}
              // eslint-disable-next-line react/prop-types
              helperText={errors.temperature?.message}
              {...field}
            />
          )}
        />
      </Wrapper>

      <Controller
        name="isDiving"
        control={control}
        defaultValue={false}
        render={({ field: { ref, ...field } }) => (
          <StyledFormControl
            disabled
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
              label={formatMessage({ id: 'is diving' })}
            />
          </StyledFormControl>
        )}
      />
    </Section>
  );
};

Details.propTypes = {
  errors: PropTypes.objectOf(),
  control: PropTypes.objectOf()
};

export default Details;
