import {
  FormControlLabel,
  FormControl,
  FormLabel,
  Switch,
  TextField
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import React, { useRef } from 'react';
import { Controller } from 'react-hook-form';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import Translate from '../../../common/Translate';
import InputCoordinate from '../utils/InputCoordinate';
import { usePermissions } from '../../../../hooks';

import { ENTRANCE_ONLY, ENTRANCE_AND_CAVE } from './caveType';
import {
  validateLatitude,
  validateLongitude
} from '../../../../util/validateLatLong';
import Alert from '../../../common/Alert';
import MapMarkerSelector from '../utils/MapMarkerSelector';
import { FormRow } from '../utils/FormContainers';

const FormControlInline = withStyles({
  root: {
    flexWrap: 'wrap',
    alignItems: 'center',
    flexDirection: 'row'
  }
})(FormControl);
const FormControlLabelInline = withStyles({
  root: {
    paddingLeft: '10px'
  }
})(FormControlLabel);

const EntranceDetail = ({ control, errors, getValues }) => {
  const { formatMessage } = useIntl();
  const permissions = usePermissions();

  /* useRef to track initial value.
  User can't unmark an entrance. So we need to remember the entrance was not sensitive initially
  to allow the user to mark and unmark it freely before submitting the form
  */
  const values = getValues();
  const initialIsSensitive = useRef(values.entrance.isSensitive).current;

  const isSensitiveDisabled = !permissions.isAdmin && initialIsSensitive;
  return (
    <>
      <Controller
        name="entrance.isSensitive"
        control={control}
        defaultValue={false}
        render={({ field: { ref, ...field } }) => (
          <FormControlInline
            margin="dense"
            component="fieldset"
            error={!!errors?.entrance?.isSensitive}>
            <FormLabel>
              <Translate>Restricted access entrance</Translate>
            </FormLabel>
            <FormControlLabelInline
              control={
                <Switch
                  disabled={isSensitiveDisabled}
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
      <Alert
        disableMargins
        severity={isSensitiveDisabled ? 'info' : 'warning'}
        content={formatMessage({
          id: isSensitiveDisabled
            ? "You can't unrestrict a cave access."
            : 'To be used for a cave requiring special protection. For more details see the User Guide. When a cave access is marked as "restricted", location of the entrance will no longer be available to Grottocenter users and visitors.'
        })}
      />

      <FormRow>
        <InputCoordinate
          formKey="entrance.latitude"
          labelName="Latitude"
          control={control}
          validatorFn={validateLatitude}
          isError={!!errors?.entrance?.latitude}
          helperText={errors?.entrance?.latitude?.message}
          isRequired
        />
        <InputCoordinate
          formKey="entrance.longitude"
          labelName="Longitude"
          control={control}
          validatorFn={validateLongitude}
          isError={!!errors?.entrance?.longitude}
          helperText={errors?.entrance?.longitude?.message}
          isRequired
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
                inputProps: { min: 0, max: new Date().getFullYear() }
              }}
              value={value}
              onChange={onChange}
            />
          )}
        />
      </FormRow>
      <MapMarkerSelector
        control={control}
        formLatitudeKey="entrance.latitude"
        formLongitudeKey="entrance.longitude"
      />
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
      yearDiscovery: PropTypes.shape({ message: PropTypes.number })
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

export default EntranceDetail;
