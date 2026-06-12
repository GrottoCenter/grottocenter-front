import * as React from 'react';
import { useIntl } from 'react-intl';
import { Box } from '@mui/material';
import PropTypes from 'prop-types';
import { Property } from '../../../../common/Properties';
import CustomIcon from '../../../../common/CustomIcon';
import { HighLightsLine } from '../../../../common/Highlights';
import { ENTRANCE_BOOLEAN_CHARACTERISTICS } from '../../../../../conf/entranceCharacteristics';

const EntranceCaveSnapshots = information => {
  const { entrance, previous } = information;
  const { cave } = entrance;

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
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        width: '100%'
      }}>
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
      {!!entrance.altitude && (
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
      {!!cave?.depth && (
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
      {!!cave?.length && (
        <Property
          label={formatMessage({ id: 'Development' })}
          value={`${cave.length} m`}
          icon={<CustomIcon type="length" />}
        />
      )}
      {!!cave?.temperature && (
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
      {!!cave?.isDiving && (
        <Property
          value={formatMessage({
            id: 'Diving cave'
          })}
          icon={<CustomIcon type="diving_cave" />}
          secondary
        />
      )}
      {ENTRANCE_BOOLEAN_CHARACTERISTICS
        .filter(({ field }) => {
          if (previous == null) return !!entrance[field];
          return !!entrance[field] || previous[field] !== entrance[field];
        })
        .map(({ field, label, icon }) => {
          const isAdded = previous != null && !!entrance[field] && !previous[field];
          const isRemoved = previous != null && !entrance[field] && !!previous[field];
          return (
            <Box
              key={field}
              sx={
                isAdded
                  ? { bgcolor: 'rgba(70, 149, 74, 0.2)', borderRadius: 1, px: 0.5 }
                  : isRemoved
                  ? { bgcolor: 'rgba(229, 83, 74, 0.2)', borderRadius: 1, px: 0.5 }
                  : undefined
              }>
              <Property
                value={formatMessage({ id: label })}
                icon={<CustomIcon type={icon} />}
                secondary={!entrance[field]}
              />
            </Box>
          );
        })}
    </Box>
  );
};
EntranceCaveSnapshots.propTypes = {
  entrance: PropTypes.shape({}),
  previous: PropTypes.shape({})
};
export default EntranceCaveSnapshots;
