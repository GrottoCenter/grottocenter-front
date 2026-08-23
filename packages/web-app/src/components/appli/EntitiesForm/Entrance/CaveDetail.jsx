import { Alert, Box } from '@mui/material';
import { useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import PropTypes from 'prop-types';

import { FormSection } from '../utils/FormContainers';
import BoolToggleChip from '../utils/BoolToggleChip';
import NumberField from '../utils/NumberField';
import NetworkInlineLink from '../../../common/NetworkInlineLink';

const CaveDetail = ({
  control,
  errors,
  isReadonly = false,
  isShared = false,
  showEntranceFields = true,
  caveId,
  caveName
}) => {
  const { formatMessage } = useIntl();

  const validateTemperature = useCallback(
    value => {
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
    },
    [formatMessage]
  );
  const validateDistance = useCallback(
    value => {
      const numberValue = Number(value);
      if (Number.isNaN(numberValue) || !Number.isInteger(numberValue)) {
        return formatMessage({ id: 'Distance must be an integer (in m)' });
      }
      if (numberValue < 0) {
        return formatMessage({ id: 'Distance must be superior or equal to 0' });
      }
      return true;
    },
    [formatMessage]
  );

  return (
    <FormSection title="Characteristics">
      {isShared && caveId && (
        <Alert severity="info" sx={{ mb: 1 }}>
          <FormattedMessage
            id="Some of these characteristics are locked here because they belong to the network {networkLink} and are shared by all its entrances."
            values={{
              networkLink: (
                <NetworkInlineLink
                  caveId={caveId}
                  label={caveName || formatMessage({ id: 'View the network' })}
                />
              )
            }}
          />
        </Alert>
      )}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <NumberField
          name="cave.depth"
          control={control}
          label="Depth"
          icon="depth"
          unit="m"
          disabled={isReadonly}
          isError={!!errors.cave?.depth}
          helperText={errors.cave?.depth?.message}
          rules={{ valueAsNumber: true, validate: validateDistance }}
        />
        <NumberField
          name="cave.length"
          control={control}
          label="Development"
          icon="length"
          unit="m"
          disabled={isReadonly}
          isError={!!errors.cave?.length}
          helperText={errors.cave?.length?.message}
          rules={{ valueAsNumber: true, validate: validateDistance }}
        />
        <NumberField
          name="cave.temperature"
          control={control}
          label="Temperature"
          icon="temperature"
          unit="°C"
          disabled={isReadonly}
          isError={!!errors.cave?.temperature}
          helperText={errors.cave?.temperature?.message}
          rules={{ valueAsNumber: true, validate: validateTemperature }}
        />
        {showEntranceFields && (
          <NumberField
            name="entrance.yearDiscovery"
            control={control}
            label="Year of discovery"
            icon="discovery_date"
            isError={!!errors.entrance?.yearDiscovery}
            inputProps={{ max: new Date().getFullYear() }}
          />
        )}
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
        <BoolToggleChip
          name="cave.isDiving"
          label="Diving cave"
          icon="diving_cave"
          control={control}
          disabled={isReadonly}
        />
        {showEntranceFields && (
          <BoolToggleChip
            name="entrance.isTouristic"
            label="Touristic site"
            icon="touristic"
            control={control}
          />
        )}
      </Box>
    </FormSection>
  );
};

CaveDetail.propTypes = {
  errors: PropTypes.shape({
    cave: PropTypes.shape({
      depth: PropTypes.shape({ message: PropTypes.string }),
      length: PropTypes.shape({ message: PropTypes.string }),
      temperature: PropTypes.shape({ message: PropTypes.string })
    }),
    entrance: PropTypes.shape({
      yearDiscovery: PropTypes.shape({ message: PropTypes.string })
    })
  }),
  control: PropTypes.shape({}),
  isReadonly: PropTypes.bool,
  isShared: PropTypes.bool,
  showEntranceFields: PropTypes.bool,
  caveId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  caveName: PropTypes.string
};

export default CaveDetail;
