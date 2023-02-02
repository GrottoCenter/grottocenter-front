import * as React from 'react';
import { Box } from '@material-ui/core';
import { GpsFixed, Height } from '@material-ui/icons';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';

import { Property } from '../../../../common/Properties';
import CustomIcon from '../../../../common/CustomIcon';

const EntranceNetworkSnapshots = information => {
  const { entrance } = information;
  const lat = Number(entrance.latitude);
  const long = Number(entrance.longitude);

  const { formatMessage } = useIntl();

  const makeCoordinatesValue = coordinatesValue =>
    `${formatMessage({ id: 'Lat.' })} / ${formatMessage({ id: 'Long.' })} =
  ${coordinatesValue[0].toFixed(4)}, ${coordinatesValue[1].toFixed(4)}`;

  return (
    <Box display="flex" flexDirection="column" width="100%">
      {!(isNaN(lat) && isNaN(long)) && (
        <Property
          label={`${formatMessage({ id: 'Coordinates' })} (WGS84)`}
          value={makeCoordinatesValue([lat, long])}
          icon={<GpsFixed fontSize="large" color="primary" />}
        />
      )}
      {entrance.altitude && (
        <Property
          label={formatMessage({ id: 'Altitude' })}
          value={`${entrance.altitude} m`}
          icon={<Height color="primary" />}
        />
      )}
      {entrance.cave && (
        <Property
          label={formatMessage({ id: 'Cave' })}
          value={`${entrance.caveName}`}
          icon={<CustomIcon type="cave_system" />}
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