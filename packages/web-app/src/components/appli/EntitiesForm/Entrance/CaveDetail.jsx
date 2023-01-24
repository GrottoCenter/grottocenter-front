import {
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
import PropTypes from 'prop-types';
import Translate from '../../../common/Translate';

import { FormRow } from '../utils/FormContainers';

const CaveDetail = ({ control, errors, isReadonly = false }) => {
  const { formatMessage } = useIntl();

  const validateTemperature = value => {
    const numberValue = Number(value);
    if (Number.isNaN(numberValue) || !Number.isInteger(numberValue)) {
      return formatMessage({ id: 'Temperature must be an integer (in °C)' });
    }
    if (numberValue > 100 || numberValue < -100) {
      return formatMessage({
        id: 'Temperature must be between -100 and 100 °C'
      });
    }
    return true;
  };
  const validateDistance = value => {
    const numberValue = Number(value);
    if (Number.isNaN(numberValue) || !Number.isInteger(numberValue)) {
      return formatMessage({ id: 'Distance must be an integer (in m)' });
    }
    if (numberValue < 0) {
      return formatMessage({ id: 'Distance must be superior or equal to 0' });
    }
    return true;
  };

  return (
    <FormRow>
      <Controller
        name="cave.depth"
        control={control}
        rules={{ valueAsNumber: true, validate: validateDistance }}
        render={({ field: { ref, value, onChange } }) => (
          <TextField
            disabled={isReadonly}
            label={formatMessage({ id: 'Depth' })}
            type="number"
            error={!!errors.cave?.depth}
            inputRef={ref}
            InputProps={{
              endAdornment: <InputAdornment position="start">m</InputAdornment>
            }}
            helperText={errors.cave?.depth?.message}
            value={value}
            onChange={onChange}
          />
        )}
      />
      <Controller
        name="cave.length"
        control={control}
        rules={{ valueAsNumber: true, validate: validateDistance }}
        render={({ field: { ref, value, onChange } }) => (
          <TextField
            disabled={isReadonly}
            label={formatMessage({ id: 'Length' })}
            type="number"
            error={!!errors.cave?.length}
            inputRef={ref}
            InputProps={{
              endAdornment: <InputAdornment position="start">m</InputAdornment>
            }}
            helperText={errors.cave?.length?.message}
            value={value}
            onChange={onChange}
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
        render={({ field: { ref, value, onChange } }) => (
          <TextField
            disabled={isReadonly}
            label={formatMessage({ id: 'Temperature' })}
            type="number"
            error={!!errors.cave?.temperature}
            inputRef={ref}
            InputProps={{
              endAdornment: <InputAdornment position="start">°C</InputAdornment>
            }}
            helperText={errors.cave?.temperature?.message}
            value={value}
            onChange={onChange}
          />
        )}
      />
      <Controller
        name="cave.isDiving"
        control={control}
        defaultValue={false}
        render={({ field: { ref, value, onChange } }) => (
          <FormControl
            margin="dense"
            disabled={isReadonly}
            component="fieldset"
            error={!!errors.cave?.isDiving}>
            <FormLabel component="legend">
              <Translate>Diving cave</Translate>
            </FormLabel>
            <FormControlLabel
              control={
                <Switch
                  inputRef={ref}
                  checked={value}
                  onChange={e => onChange(e.target.checked)}
                />
              }
              label={
                value
                  ? formatMessage({ id: 'Yes' })
                  : formatMessage({ id: 'No' })
              }
            />
          </FormControl>
        )}
      />
    </FormRow>
  );
};

CaveDetail.propTypes = {
  errors: PropTypes.shape({
    cave: PropTypes.shape({
      depth: PropTypes.shape({ message: PropTypes.string }),
      length: PropTypes.shape({ message: PropTypes.string }),
      temperature: PropTypes.shape({ message: PropTypes.string }),
      isDiving: PropTypes.shape({ message: PropTypes.string })
    })
  }),
  control: PropTypes.shape({}),
  isReadonly: PropTypes.bool
};

export default CaveDetail;
