import {
  Box,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField
} from '@material-ui/core';
import React, { useEffect } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import Translate from '../../../common/Translate';
import Section from '../FormSection';
import { useDebounce } from '../../../../hooks';
import { CountrySelection, PositionMap } from './Position';

const Entrance = ({
  allLanguages,
  control,
  errors,
  setFocus,
  creationType
}) => {
  const { formatMessage } = useIntl();
  const caveIdValue = useDebounce(useWatch({ control, name: 'cave.id' }), 300);
  // When creating a cave, the entrance get the same name as the cave.
  const nameInputName = creationType === 'cave' ? 'cave.name' : 'entrance.name';

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

  useEffect(() => {
    setFocus(nameInputName);
  }, [caveIdValue, nameInputName, setFocus]);

  return (
    <Section sectionTitle={formatMessage({ id: 'Entrance information' })}>
      <Box display="flex" justifyContent="space-between">
        <Controller
          name={nameInputName}
          control={control}
          rules={{ required: true }}
          render={({ field: { ref, ...field } }) => (
            <TextField
              disabled={creationType !== 'entrance'}
              fullWidth
              required
              error={!!errors?.entrance?.name}
              label={formatMessage({ id: 'Entrance name' })}
              inputRef={ref}
              {...field}
            />
          )}
        />
        {creationType === 'entrance' && (
          <Controller
            name="entrance.language"
            control={control}
            rules={{ required: true }}
            render={({ field: { ref, ...field } }) => (
              <FormControl
                required
                error={!!errors?.entrance?.language}
                fullWidth>
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
                <FormHelperText>
                  <Translate>Entrance name language</Translate>
                </FormHelperText>
              </FormControl>
            )}
          />
        )}
      </Box>
      <Box display="flex" justifyContent="space-between">
        <Controller
          name="entrance.latitude"
          control={control}
          rules={{
            required: true,
            validate: validateLatitude
          }}
          render={({ field: { ref, ...field } }) => (
            <TextField
              fullWidth
              required
              label={formatMessage({ id: 'Latitude' })}
              type="number"
              error={!!errors?.entrance?.latitude}
              inputRef={ref}
              helperText={errors?.entrance?.latitude?.message}
              {...field}
              onChange={e => field.onChange(Number(e.target.value))}
            />
          )}
        />

        <Controller
          name="entrance.longitude"
          control={control}
          rules={{
            required: true,
            validate: validateLongitude
          }}
          render={({ field: { ref, ...field } }) => (
            <TextField
              fullWidth
              autoFocus
              required
              label={formatMessage({ id: 'Longitude' })}
              type="number"
              error={!!errors?.entrance?.longitude}
              inputRef={ref}
              helperText={errors?.entrance?.longitude?.message}
              {...field}
              onChange={e => field.onChange(Number(e.target.value))}
              value={field.value}
            />
          )}
        />

        <CountrySelection control={control} />
      </Box>
      <PositionMap control={control} />
    </Section>
  );
};

Entrance.propTypes = {
  errors: PropTypes.shape({
    entrance: PropTypes.shape({
      latitude: PropTypes.shape({ message: PropTypes.string }),
      longitude: PropTypes.shape({ message: PropTypes.string }),
      language: PropTypes.shape({ message: PropTypes.string }),
      name: PropTypes.shape({ message: PropTypes.string })
    })
  }),
  control: PropTypes.shape({}),
  allLanguages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      refName: PropTypes.string.isRequired
    })
  ),
  setFocus: PropTypes.func,
  creationType: PropTypes.oneOf(['cave', 'entrance'])
};

export default Entrance;
