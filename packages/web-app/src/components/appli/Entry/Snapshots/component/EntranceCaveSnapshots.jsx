import * as React from 'react';
import { useIntl } from 'react-intl';
import { Box } from '@mui/material';
import PropTypes from 'prop-types';
import { pathOr } from 'ramda';

import { Property } from '../../../../common/Properties';
import CustomIcon from '../../../../common/CustomIcon';
import { HighLightsLine } from '../../../../common/Highlights';
import { ENTRANCE_BOOLEAN_CHARACTERISTICS } from '../../../../../conf/entranceCharacteristics';

const EntranceCaveSnapshots = information => {
  const { entrance, previous } = information;
  const { cave } = entrance;
  const caveId = pathOr(cave, ['id'], cave);
  const caveName = pathOr(entrance.caveName, ['name'], cave) ?? entrance.name;

  const { formatMessage } = useIntl();
  const lat = Number(entrance.latitude);
  const long = Number(entrance.longitude);
  const previousLat = Number(previous?.latitude);
  const previousLong = Number(previous?.longitude);

  const makeCoordinatesValue = coordinatesValue =>
    `${formatMessage({ id: 'Lat.' })} (N) / ${formatMessage({
      id: 'Long.'
    })} (E) =
    ${coordinatesValue[0].toFixed(4)}, ${coordinatesValue[1].toFixed(4)}`;
  return (
    <Box display="flex" flexDirection="column" width="100%">
      {!(Number.isNaN(lat) && Number.isNaN(long)) && (
        <Property
          label={`${formatMessage({ id: 'Coordinates' })} (WGS84)`}
          value={
            <HighLightsLine
              oldText={
                !(Number.isNaN(previousLat) && Number.isNaN(previousLong))
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
          value={
            <HighLightsLine
              oldText={
                previous?.altitude ? `${previous?.altitude} m` : undefined
              }
              newText={`${entrance.altitude} m`}
            />
          }
          icon={<CustomIcon type="altitude" />}
        />
      )}
      {cave && (
        <Property
          label={formatMessage({ id: 'Network' })}
          value={
            <HighLightsLine oldText={previous?.caveName} newText={caveName} />
          }
          icon={<CustomIcon type="network" />}
          url={`/ui/caves/${caveId}`}
        />
      )}
      {cave?.depth && (
        <Property
          label={formatMessage({ id: 'Depth' })}
          value={
            <HighLightsLine
              oldText={
                previous?.cave?.depth ? `${previous?.cave?.depth} m` : undefined
              }
              newText={`${cave.depth} m`}
            />
          }
          icon={<CustomIcon type="depth" />}
        />
      )}
      {cave?.length && (
        <Property
          label={formatMessage({ id: 'Development' })}
          value={`${cave.length} m`}
          icon={<CustomIcon type="length" />}
        />
      )}
      {cave?.temperature && (
        <Property
          label={formatMessage({ id: 'Temperature' })}
          value={
            <HighLightsLine
              oldText={
                previous?.cave?.temperature
                  ? `${previous?.cave?.temperature} °C`
                  : undefined
              }
              newText={`${cave.temperature} °C`}
            />
          }
          icon={<CustomIcon type="temperature" />}
        />
      )}
      {cave?.isDiving && (
        <Property
          value={formatMessage({
            id: 'Diving cave'
          })}
          icon={<CustomIcon type="diving_cave" />}
          secondary
        />
      )}
      {ENTRANCE_BOOLEAN_CHARACTERISTICS
        .filter(
          ({ field }) => entrance[field] || (previous?.[field] !== entrance[field])
        )
        .map(({ field, label, icon }) => (
          <Property
            key={field}
            value={formatMessage({ id: label })}
            icon={<CustomIcon type={icon} />}
            secondary={!entrance[field]}
          />
        ))}
    </Box>
  );
};
EntranceCaveSnapshots.propTypes = {
  // eslint-disable-next-line react/no-unused-prop-types
  information: PropTypes.node
};
export default EntranceCaveSnapshots;
