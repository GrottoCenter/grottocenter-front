import * as React from 'react';
import { Box } from '@mui/material';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';

import { Property } from '../../../../common/Properties';
import CustomIcon from '../../../../common/CustomIcon';
import { HighLightsLine } from '../../../../common/Highlights';
import EntranceCharacteristicsSnapshot from './EntranceCharacteristicsSnapshot';

const EntranceNetworkSnapshots = information => {
  const { entrance, previous } = information;
  const hasCoordinates = entrance.latitude != null && entrance.longitude != null;
  const hasPreviousCoordinates =
    previous?.latitude != null && previous?.longitude != null;
  const lat = Number(entrance.latitude);
  const long = Number(entrance.longitude);
  const previousLat = Number(previous?.latitude);
  const previousLong = Number(previous?.longitude);

  // The network reference has two shapes: on snapshots `cave` is the id and
  // `caveName` the resolved name; on the current entrance `cave` is an object
  // carrying both id and name. Normalize so both render (and the link works).
  const caveId = entrance.cave?.id ?? entrance.cave;
  const caveName = entrance.caveName ?? entrance.cave?.name;

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
      {caveId && (
        <Property
          label={formatMessage({ id: 'Network' })}
          // caveName is a contextual label (resolved across tables), not a
          // diffable field: network renames are surfaced by rename snapshots.
          value={caveName}
          icon={<CustomIcon type="network" />}
          url={`/ui/caves/${caveId}`}
        />
      )}
      <EntranceCharacteristicsSnapshot entrance={entrance} previous={previous} />
    </Box>
  );
};
EntranceNetworkSnapshots.propTypes = {
  // eslint-disable-next-line react/no-unused-prop-types
  information: PropTypes.node
};
export default EntranceNetworkSnapshots;
