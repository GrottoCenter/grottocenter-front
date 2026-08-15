import { Box } from '@mui/material';
import { useRef, useState } from 'react';
import { useController, useWatch } from 'react-hook-form';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { usePermissions, useNearbyEntrances } from '../../../../hooks';
import SensitivitySection from '../../../common/SensitivitySection';
import CoordinateFormSection from '../utils/CoordinateFormSection';
import { FormSection } from '../utils/FormContainers';
import NumberField from '../utils/NumberField';

const EntranceDetail = ({
  control,
  errors,
  getValues,
  isNewEntrance = false
}) => {
  const permissions = usePermissions();
  const { formatMessage } = useIntl();

  // Informational only: show existing entrances near the entered coordinates
  // so the user can spot a duplicate before creating one (creation mode only).
  // The map reports its zoom so the hint can be hidden when zoomed out too far.
  const latitude = useWatch({ control, name: 'entrance.latitude' });
  const longitude = useWatch({ control, name: 'entrance.longitude' });
  const [mapZoom, setMapZoom] = useState(null);
  const nearbyEntrances = useNearbyEntrances(
    latitude,
    longitude,
    isNewEntrance,
    mapZoom
  );

  /* useRef to track initial value.
  User can't unmark an entrance. So we need to remember the entrance was not sensitive initially
  to allow the user to mark and unmark it freely before submitting the form
  */
  const values = getValues();
  const initialIsSensitive = useRef(values.entrance.isSensitive).current;

  // useController rather than a render-prop Controller: the panel needs both
  // fields at once, and nesting two Controllers to reach it reads far worse.
  // No defaultValue on the lock, so an entrance the API returned without one
  // keeps submitting `undefined` and the transformer can still omit the key.
  const { field: sensitiveField } = useController({
    control,
    name: 'entrance.isSensitive',
    defaultValue: false
  });
  const { field: lockField } = useController({
    control,
    name: 'entrance.isSensitiveLocked'
  });
  const isSensitiveLocked = !!lockField.value;

  // The precise location of an already sensitive entrance stays hidden from
  // non-admin users, who therefore can't unrestrict it either.
  const areCoordinatesHidden = !permissions.isAdmin && initialIsSensitive;
  // A lock freezes the sensitivity for everyone but administrators, who keep
  // changing it either way — the API enforces the same rule on update.
  const isLockedForUser = isSensitiveLocked && !permissions.isAdmin;
  const isSensitiveDisabled = isLockedForUser || areCoordinatesHidden;

  let sensitivityAlert = null;
  if (isLockedForUser) {
    sensitivityAlert = {
      severity: 'info',
      id: 'An administrator locked the sensitivity of this entrance. It can no longer be changed here.'
    };
  } else if (areCoordinatesHidden) {
    sensitivityAlert = {
      severity: 'info',
      id: "You can't unrestrict a cave access."
    };
  } else if (isSensitiveLocked) {
    // Administrators keep editing a locked entrance, but the lock is still
    // worth stating: it is what stops everybody else from touching it.
    sensitivityAlert = {
      severity: 'info',
      id: 'The sensitivity of this entrance is locked. Other contributors cannot change it.'
    };
  }

  return (
    <FormSection title="Location">
      {!areCoordinatesHidden && (
        <CoordinateFormSection
          control={control}
          formLatitudeKey="entrance.latitude"
          formLongitudeKey="entrance.longitude"
          required
          latitudeError={errors?.entrance?.latitude?.message}
          longitudeError={errors?.entrance?.longitude?.message}
          additionalPositions={nearbyEntrances}
          additionalMarkersLabel={formatMessage({
            id: 'Existing nearby entrances'
          })}
          onZoomChange={setMapZoom}
        />
      )}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 1,
          mt: 1
        }}>
        <NumberField
          name="entrance.altitude"
          control={control}
          label="Altitude"
          icon="altitude"
          unit="m"
          isError={!!errors.entrance?.altitude}
        />
      </Box>
      {/* Same panel as the massif form: the rules are identical, so the two
          entities should not look like two different features. */}
      <SensitivitySection
        title="Sensitivity Management"
        explanation={formatMessage({
          id: 'To be used for a cave requiring special protection. For more details see the User Guide. When a cave access is marked as "restricted", location of the entrance will no longer be available to Grottocenter users and visitors.'
        })}
        switchLabel="Restricted access entrance"
        isSensitive={!!sensitiveField.value}
        onSensitiveChange={sensitiveField.onChange}
        isSensitiveDisabled={isSensitiveDisabled}
        showLock={permissions.isAdmin}
        isLocked={isSensitiveLocked}
        onLockChange={lockField.onChange}
        alert={
          sensitivityAlert && {
            severity: sensitivityAlert.severity,
            content: formatMessage({ id: sensitivityAlert.id })
          }
        }
      />
    </FormSection>
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
  isNewEntrance: PropTypes.bool
};

export default EntranceDetail;
