import * as React from 'react';
import { useIntl } from 'react-intl';
import { GpsFixed, Height, Waves, Title } from '@material-ui/icons';
import { Box } from '@material-ui/core';
import PropTypes from 'prop-types';
import { pathOr } from 'ramda';

import { Property } from '../../../../common/Properties';
import CustomIcon from '../../../../common/CustomIcon';

const EntranceCaveSnapshots = information => {
  const { entrance } = information;
  const { cave } = entrance;
  const caveId = pathOr(cave, ['id'], cave);
  const caveName = pathOr(entrance.caveName, ['name'], cave) ?? entrance.name;

  const { formatMessage } = useIntl();
  const lat = Number(entrance.latitude);
  const long = Number(entrance.longitude);

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
      {cave && (
        <Property
          label={formatMessage({ id: 'Cave' })}
          value={`${caveName}`}
          icon={<CustomIcon type="cave_system" />}
          url={`/ui/caves/${caveId}`}
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
EntranceCaveSnapshots.propTypes = {
  // eslint-disable-next-line react/no-unused-prop-types
  information: PropTypes.node
};
export default EntranceCaveSnapshots;
