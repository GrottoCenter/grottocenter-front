import * as React from 'react';
import { useIntl } from 'react-intl';
import { GpsFixed, Height, Waves, Title } from '@material-ui/icons';
import { Box } from '@material-ui/core';

import { Property } from '../../../common/Properties';
import CustomIcon from '../../../common/CustomIcon';

const EntranceCaveSnapshot = information => {
  const entrance = information.entrance;
  const cave = entrance.cave;
  const { formatMessage } = useIntl();

  const makeCoordinatesValue = coordinatesValue =>
    `${formatMessage({ id: 'Lat.' })} / ${formatMessage({ id: 'Long.' })} =
    ${coordinatesValue[0].toFixed(4)}, ${coordinatesValue[1].toFixed(4)}`;

  return (
    <Box display="flex" flexDirection="column" width="100%">
      <Property
        label={`${formatMessage({ id: 'Coordinates' })} (WGS84)`}
        value={makeCoordinatesValue([
          Number(entrance.latitude),
          Number(entrance.longitude)
        ])}
        icon={<GpsFixed fontSize="large" color="primary" />}
      />
      {entrance.altitude && (
        <Property
          label={formatMessage({ id: 'Altitude' })}
          value={`${entrance.altitude} m`}
          icon={<Height color="primary" />}
        />
      )}
      {cave && (
        <Property
          label={formatMessage({ id: 'Cave' })}
          value={`${entrance.name}`}
          icon={<CustomIcon type="cave_system" />}
          url={`/ui/caves/${cave.id}`}
        />
      )}
      {cave?.depth && (
        <Property
          label={formatMessage({ id: 'Depth' })}
          value={`${cave.depth} m`}
          icon={<CustomIcon type="depth" />}
        />
      )}
      {cave?.caveLength && (
        <Property
          label={formatMessage({ id: 'Development' })}
          value={`${cave.caveLength} m`}
          icon={<CustomIcon type="length" />}
        />
      )}
      {cave?.temperature && (
        <Property
          label={formatMessage({ id: 'Temperature' })}
          value={`${cave.temperature} °C`}
          icon={<Title fontSize="large" color="primary" />}
        />
      )}
      {cave?.isDiving && (
        <Property
          value={formatMessage({
            id: 'Diving cave'
          })}
          icon={<Waves color="primary" />}
          secondary
        />
      )}
    </Box>
  );
};

export default EntranceCaveSnapshot;
