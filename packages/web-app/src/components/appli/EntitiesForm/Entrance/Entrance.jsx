import {
  Box,
  FormControlLabel,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField
} from '@material-ui/core';
import React, { useEffect, useRef } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import Translate from '../../../common/Translate';
import Section from '../FormSection';
import { useDebounce, usePermissions } from '../../../../hooks';

import { CountrySelection, PositionMap } from './Position';
import { ENTRANCE_ONLY, ENTRANCE_AND_CAVE } from './caveType';
import {
  validateLatitude,
  validateLongitude
} from '../../../../util/validateLatLong';
import Alert from '../../../common/Alert';

const Entrance = ({
  allLanguages,
  control,
  errors,
  getValues,
  setFocus,
  entityType
}) => {
  const { formatMessage } = useIntl();
  const permissions = usePermissions();

  /* useRef to track initial value.
  User can't unmark an entrance. So we need to remember the entrance was not sensitive initially 
  to allow the user to mark and unmark it freely before submitting the form
  */
  const values = getValues();
  const initialIsSensitive = useRef(values.entrance.isSensitive).current;

  const caveIdValue = useDebounce(useWatch({ control, name: 'cave.id' }), 300);
  // When creating a cave, the entrance get the same name as the cave.
  const nameInputName =
    entityType === ENTRANCE_AND_CAVE ? 'cave.name' : 'entrance.name';

  const isSensitiveDisabled = !permissions.isAdmin && initialIsSensitive;

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
              disabled={entityType !== ENTRANCE_ONLY}
              fullWidth
              required
              error={!!errors?.entrance?.name}
              label={formatMessage({ id: 'Entrance name' })}
              inputRef={ref}
              {...field}
            />
          )}
        />
        {entityType === ENTRANCE_ONLY && (
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
            validate: value => validateLatitude(value, formatMessage)
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
            validate: value => validateLongitude(value, formatMessage)
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

      <Controller
        name="entrance.isSensitive"
        control={control}
        defaultValue={false}
        render={({ field: { ref, ...field } }) => (
          <FormControl
            margin="dense"
            component="fieldset"
            error={!!errors?.entrance?.isSensitive}>
            <FormControlLabel
              control={
                <Switch
                  disabled={isSensitiveDisabled}
                  inputRef={ref}
                  {...field}
                  checked={field.value}
                  onChange={e => field.onChange(e.target.checked)}
                />
              }
              label={formatMessage({
                id: `The cave access is${field.value ? '' : ' not'} restricted.`
              })}
            />

            {isSensitiveDisabled ? (
              <Alert
                disableMargins
                severity="info"
                content={formatMessage({
                  id: "You can't unrestrict a cave access."
                })}
              />
            ) : (
              <Alert
                disableMargins
                severity="warning"
                content={formatMessage({
                  id: 'To be used for a cave requiring special protection. For more details see the User Guide. When a cave access is marked as "restricted", location of the entrance will no longer be available to Grottocenter users and visitors.'
                })}
              />
            )}
          </FormControl>
        )}
      />
    </Section>
  );
};

Entrance.propTypes = {
  errors: PropTypes.shape({
    entrance: PropTypes.shape({
      isSensitive: PropTypes.shape({ message: PropTypes.string }),
      latitude: PropTypes.shape({ message: PropTypes.string }),
      longitude: PropTypes.shape({ message: PropTypes.string }),
      language: PropTypes.shape({ message: PropTypes.string }),
      name: PropTypes.shape({ message: PropTypes.string })
    })
  }),
  control: PropTypes.shape({}),
  getValues: PropTypes.func.isRequired, // React-hook-form getValues() function
  allLanguages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      refName: PropTypes.string.isRequired
    })
  ),
  setFocus: PropTypes.func,
  entityType: PropTypes.oneOf([ENTRANCE_AND_CAVE, ENTRANCE_ONLY])
};

export default Entrance;
