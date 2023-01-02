import {
  Box,
  FormControl as MuiFormControl,
  FormLabel,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  InputAdornment,
  FormControlLabel,
  Switch
} from '@mui/material';
import React from 'react';
import { Controller } from 'react-hook-form';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Translate from '../../../common/Translate';

const FormControl = styled(MuiFormControl)`
  padding-bottom: ${({ theme }) => theme.spacing(4)};
`;
const StyledFormControl = styled(FormControl)`
  margin-top: ${({ theme }) => theme.spacing(2)};
`;

const Network = ({ control, errors, allLanguages }) => {
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
    <div>
      <FormControl component="fieldset" style={{ width: '50vh' }}>
        <Controller
          name="name"
          control={control}
          rules={{ required: true }}
          render={({ field: { ref, onChange, ...field } }) => (
            <TextField
              fullWidth
              required
              error={!!errors?.name}
              label={formatMessage({ id: 'Network name' })}
              inputRef={ref}
              onChange={onChange}
              {...field}
            />
          )}
        />
        <Controller
          name="language"
          control={control}
          rules={{ required: true }}
          render={({ field: { ref, ...field } }) => (
            <FormControl required error={!!errors?.language} fullWidth>
              <InputLabel shrink>
                <Translate>Language</Translate>
              </InputLabel>
              <Select {...field} inputRef={ref}>
                <MenuItem key={-1} value={-1} disabled>
                  <i>
                    <Translate>Select a language</Translate>
                  </i>
                </MenuItem>
                {allLanguages.map(l => (
                  <MenuItem key={l.id} value={l.id} name={l.refName}>
                    <Translate>{l.refName}</Translate>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />
        <Box display="flex" justifyContent="space-between">
          <Controller
            name="depth"
            control={control}
            rules={{ valueAsNumber: true, validate: validateDistance }}
            render={({ field: { ref, ...field } }) => (
              <TextField
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
            name="length"
            control={control}
            rules={{ valueAsNumber: true, validate: validateDistance }}
            render={({ field: { ref, ...field } }) => (
              <TextField
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
            name="temperature"
            control={control}
            rules={{
              valueAsNumber: true,
              validate: validateTemperature
            }}
            render={({ field: { ref, ...field } }) => (
              <TextField
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
          name="isDivingCave"
          control={control}
          defaultValue={false}
          render={({ field: { ref, ...field } }) => (
            <StyledFormControl
              component="fieldset"
              error={!!errors.isDivingCave}>
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
      </FormControl>
    </div>
  );
};
Network.propTypes = {
  allLanguages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      refName: PropTypes.string.isRequired
    })
  ).isRequired,
  control: PropTypes.shape({}).isRequired,
  errors: PropTypes.shape({
    depth: PropTypes.shape({ message: PropTypes.string }),
    isDivingCave: PropTypes.shape({ message: PropTypes.string }),
    language: PropTypes.shape({ message: PropTypes.string }),
    length: PropTypes.shape({ message: PropTypes.string }),
    name: PropTypes.shape({ message: PropTypes.string }),
    temperature: PropTypes.shape({ message: PropTypes.string })
  })
};

export default Network;
