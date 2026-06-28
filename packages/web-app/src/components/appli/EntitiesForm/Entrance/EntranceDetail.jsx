import {
  FormControlLabel,
  FormControl,
  FormLabel,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import React, { useRef } from 'react';
import { Controller } from 'react-hook-form';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import Translate from '../../../common/Translate';
import { usePermissions, useNearbyEntrances } from '../../../../hooks';
import { ENTRANCE_ONLY, ENTRANCE_AND_CAVE } from './caveType';
import Alert from '../../../common/Alert';
import CoordinateFormSection from '../utils/CoordinateFormSection';
import { FormRow } from '../utils/FormContainers';
import { ENTRANCE_HAZARD_FIELDS } from '../../../../conf/entranceCharacteristics';

const FormControlInline = styled(FormControl)`
  flex-wrap: wrap;
  align-items: center;
  flex-direction: row;
`;

const FormControlLabelInline = styled(FormControlLabel)`
  padding-left: 10px;
`;

const BoolSwitch = ({ name, label, control, disabled = false, error = false }) => {
  const { formatMessage } = useIntl();
  return (
    <Controller
      name={name}
      control={control}
      defaultValue={false}
      render={({ field: { ref, ...field } }) => (
        <FormControlInline margin="dense" component="fieldset" error={error}>
          <FormLabel>
            <Translate>{label}</Translate>
          </FormLabel>
          <FormControlLabelInline
            control={
              <Switch
                disabled={disabled}
                inputRef={ref}
                {...field}
                checked={field.value}
                onChange={e => field.onChange(e.target.checked)}
              />
            }
            label={
              field.value
                ? formatMessage({ id: 'Yes' })
                : formatMessage({ id: 'No' })
            }
          />
        </FormControlInline>
      )}
    />
  );
};

BoolSwitch.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  control: PropTypes.shape({}),
  disabled: PropTypes.bool,
  error: PropTypes.bool
};

const EntranceDetail = ({
  control,
  errors,
  getValues,
  isNewEntrance = false,
  latitude,
  longitude
}) => {
  const permissions = usePermissions();
  const { formatMessage } = useIntl();

  // Informational only: show existing entrances near the entered coordinates
  // so the user can spot a duplicate before creating one (creation mode only).
  const nearbyEntrances = useNearbyEntrances(
    latitude,
    longitude,
    isNewEntrance
  );

  /* useRef to track initial value.
  User can't unmark an entrance. So we need to remember the entrance was not sensitive initially
  to allow the user to mark and unmark it freely before submitting the form
  */
  const values = getValues();
  const initialIsSensitive = useRef(values.entrance.isSensitive).current;

  const isSensitiveDisabled = !permissions.isAdmin && initialIsSensitive;
  return (
    <>
      <BoolSwitch
        name="entrance.isSensitive"
        label="Restricted access entrance"
        control={control}
        disabled={isSensitiveDisabled}
        error={!!errors?.entrance?.isSensitive}
      />
      <Alert
        disableMargins
        severity={isSensitiveDisabled ? 'info' : 'warning'}
        content={formatMessage({
          id: isSensitiveDisabled
            ? "You can't unrestrict a cave access."
            : 'To be used for a cave requiring special protection. For more details see the User Guide. When a cave access is marked as "restricted", location of the entrance will no longer be available to Grottocenter users and visitors.'
        })}
      />

      <BoolSwitch
        name="entrance.isTouristic"
        label="Touristic site"
        control={control}
      />

      <Typography variant="subtitle1" sx={{ mt: 2 }}>
        <Translate>Hazards & restrictions</Translate>
      </Typography>
      {ENTRANCE_HAZARD_FIELDS.map(({ field: name, label }) => (
        <BoolSwitch
          key={name}
          name={`entrance.${name}`}
          label={label}
          control={control}
        />
      ))}

      {!isSensitiveDisabled && (
        <CoordinateFormSection
          control={control}
          formLatitudeKey="entrance.latitude"
          formLongitudeKey="entrance.longitude"
          required
          latitudeError={errors?.entrance?.latitude?.message}
          longitudeError={errors?.entrance?.longitude?.message}
          additionalPositions={nearbyEntrances}
        />
      )}
      <FormRow>
        <Controller
          name="entrance.altitude"
          control={control}
          rules={{ valueAsNumber: true }}
          render={({ field: { ref, value, onChange } }) => (
            <TextField
              fullWidth
              label={formatMessage({ id: 'Altitude' })}
              type="number"
              error={!!errors.entrance?.altitude}
              inputRef={ref}
              value={value}
              onChange={onChange}
            />
          )}
        />
        <Controller
          name="entrance.yearDiscovery"
          control={control}
          rules={{ valueAsNumber: true }}
          render={({ field: { ref, value, onChange } }) => (
            <TextField
              fullWidth
              label={formatMessage({ id: 'Year of discovery' })}
              type="number"
              error={!!errors.entrance?.yearDiscovery}
              inputRef={ref}
              InputProps={{
                inputProps: { max: new Date().getFullYear() }
              }}
              value={value ?? ''}
              onChange={onChange}
            />
          )}
        />
      </FormRow>
    </>
  );
};

EntranceDetail.propTypes = {
  errors: PropTypes.shape({
    entrance: PropTypes.shape({
      isSensitive: PropTypes.shape({ message: PropTypes.string }),
      latitude: PropTypes.shape({ message: PropTypes.string }),
      longitude: PropTypes.shape({ message: PropTypes.string }),
      language: PropTypes.shape({ message: PropTypes.string }),
      name: PropTypes.shape({ message: PropTypes.string }),
      altitude: PropTypes.shape({ message: PropTypes.number }),
      yearDiscovery: PropTypes.shape({ message: PropTypes.number })
    })
  }),
  control: PropTypes.shape({}),
  getValues: PropTypes.func.isRequired, // React-hook-form getValues() function
  isNewEntrance: PropTypes.bool,
  latitude: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  longitude: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  allLanguages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      refName: PropTypes.string.isRequired
    })
  ),
  setFocus: PropTypes.func,
  entityType: PropTypes.oneOf([ENTRANCE_AND_CAVE, ENTRANCE_ONLY])
};

export default EntranceDetail;
