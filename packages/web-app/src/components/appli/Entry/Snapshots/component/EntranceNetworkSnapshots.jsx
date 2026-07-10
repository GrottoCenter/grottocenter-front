import * as React from 'react';
import { Box } from '@mui/material';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';

import { Property } from '../../../../common/Properties';
import CustomIcon from '../../../../common/CustomIcon';
import { HighLightsLine } from '../../../../common/Highlights';

const EntranceNetworkSnapshots = information => {
  const { entrance, previous } = information;
  const hasCoordinates = entrance.latitude != null && entrance.longitude != null;
  const hasPreviousCoordinates =
    previous?.latitude != null && previous?.longitude != null;
  const lat = Number(entrance.latitude);
  const long = Number(entrance.longitude);
  const previousLat = Number(previous?.latitude);
  const previousLong = Number(previous?.longitude);

  const { formatMessage } = useIntl();

  const makeCoordinatesValue = coordinatesValue =>
    `${formatMessage({ id: 'Lat.' })} (N) / ${formatMessage({
      id: 'Long.'
    })} (E) =
  ${coordinatesValue[0].toFixed(4)}, ${coordinatesValue[1].toFixed(4)}`;

  return (
    <Box display="flex" flexDirection="column" width="100%">
      {hasCoordinates && (
        <Property
          label={`${formatMessage({ id: 'Coordinates' })} (WGS84)`}
          value={
            <HighLightsLine
              oldText={
                hasPreviousCoordinates
                  ? makeCoordinatesValue([previousLat, previousLong])
                  : undefined
              }
              newText={makeCoordinatesValue([lat, long])}
            />
          }
          icon={<CustomIcon type="coordinates" />}
        />
      )}
      {entrance.altitude && (
        <Property
          label={formatMessage({ id: 'Altitude' })}
          value={`${entrance.altitude} m`}
          icon={<CustomIcon type="altitude" />}
        />
      )}
      {entrance.cave && (
        <Property
          label={formatMessage({ id: 'Network' })}
          // caveName is a contextual label (resolved across tables), not a
          // diffable field: network renames are surfaced by rename snapshots.
          value={entrance.caveName}
          icon={<CustomIcon type="network" />}
          url={`/ui/caves/${entrance.cave}`}
        />
      )}
    </Box>
  );
};
EntranceNetworkSnapshots.propTypes = {
  // eslint-disable-next-line react/no-unused-prop-types
  information: PropTypes.node
};
export default EntranceNetworkSnapshots;
