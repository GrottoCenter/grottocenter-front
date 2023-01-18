import * as React from 'react';
import { Box } from '@material-ui/core';
import { GpsFixed, Height } from '@material-ui/icons';
import { useIntl } from 'react-intl';

import { Property } from '../../../common/Properties';
import CustomIcon from '../../../common/CustomIcon';

const EntranceNetworkSnapshot = information => {
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
          value={`${cave.name ?? entrance.name}`}
          icon={<CustomIcon type="cave_system" />}
          url={`/ui/caves/${cave.id}`}
        />
      )}
    </Box>
  );
};

export default EntranceNetworkSnapshot;
