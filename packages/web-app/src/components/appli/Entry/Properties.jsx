import React, { useContext } from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import EmptyStarIcon from '@material-ui/icons/StarBorder';
import {
  CalendarToday,
  Category,
  GpsFixed,
  Height,
  Public,
  Terrain,
  Title,
  Waves
} from '@material-ui/icons';
import Alert from '../../common/Alert';
import CustomIcon from '../../common/CustomIcon';
import { Property } from '../../common/Properties';
import { EntryContext, isValidCoordinates } from './Provider';
import Ratings from './Ratings';

const GlobalWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)}px;
`;

const SmallRatingsWrapper = styled.div`
  transform: scale(0.85);
`;

const computePrecisionSeverity = precision => {
  if (precision === undefined || precision === null) return 'warning';
  if (precision === 0) return 'error';
  return 'success';
};

const Properties = () => {
  const {
    state: {
      details: {
        altitude,
        coordinates,
        depth,
        development,
        discoveryYear,
        access,
        interest,
        progression,
        isDivingCave,
        localisation,
        massif,
        precision,
        temperature,
        undergroundType,
        cave
      },
      loading
    }
  } = useContext(EntryContext);
  const { formatMessage } = useIntl();
  const makeCoordinatesValue = coordinatesValue =>
    `${formatMessage({
      id: 'Lat.'
    })} / ${formatMessage({ id: 'Long.' })} =
    ${coordinatesValue[0].toFixed(4)} °N / ${coordinatesValue[1].toFixed(
      4
    )} °E`;

  const precisionSeverity = computePrecisionSeverity(precision);

  let precisionText = '';
  if (precision === 0)
    precisionText = formatMessage({
      id: 'Coordinates precision unavailable for restricted access entrance.'
    });
  else if (precision === undefined || precision === null)
    precisionText = formatMessage({
      id: 'Coordinates precision unknown.'
    });
  else {
    precisionText = formatMessage(
      {
        id: 'Coordinates precision: ±{precision}m',
        defaultMessage: 'Coordinates precision: ±{precision}m'
      },
      {
        precision
      }
    );
  }

  return (
    <GlobalWrapper>
      <Box display="flex" flexDirection="column">
        {isValidCoordinates(coordinates) && (
          <Property
            loading={loading}
            label={`${formatMessage({ id: 'Coordinates' })} (WGS84)`}
            value={makeCoordinatesValue(coordinates)}
            icon={<GpsFixed fontSize="large" color="primary" />}
          />
        )}
        <Alert severity={precisionSeverity} content={precisionText} />
        <Property
          loading={loading}
          label={formatMessage({ id: 'Location' })}
          value={localisation}
          icon={<Public fontSize="large" color="primary" />}
          secondary
        />
        {massif && (
          <Property
            label={formatMessage({ id: 'Massif' })}
            value={massif.name}
            icon={<Terrain fontSize="large" color="primary" />}
            url={`/ui/massifs/${massif.id}`}
          />
        )}
        {cave && (
          <Property
            label={formatMessage({ id: 'Cave' })}
            value={`${cave.name}`}
            icon={<CustomIcon type="cave_system" />}
            url={`/ui/caves/${cave.id}`}
          />
        )}
      </Box>
      <Box
        display="flex"
        flexDirection="row"
        flexWrap="wrap"
        justifyContent="space-evenly">
        {depth && (
          <Property
            loading={loading}
            label={formatMessage({ id: 'Depth' })}
            value={`${depth} m`}
            icon={<CustomIcon type="depth" />}
          />
        )}
        {development && (
          <Property
            loading={loading}
            label={formatMessage({ id: 'Development' })}
            value={`${development} m`}
            icon={<CustomIcon type="length" />}
          />
        )}
        {altitude && (
          <Property
            label={formatMessage({ id: 'Altitude' })}
            value={`${altitude} m`}
            icon={<Height color="primary" />}
          />
        )}
        {temperature && (
          <Property
            loading={loading}
            label={formatMessage({ id: 'Temperature' })}
            value={`${temperature} °C`}
            icon={<Title fontSize="large" color="primary" />}
            // TODO: The Thermostat icon is only available in MUI v5
            // icon={<Thermostat fontSize="large" color="primary"/>}
          />
        )}
        {discoveryYear && (
          <Property
            label={formatMessage({ id: 'Year of discovery' })}
            value={discoveryYear}
            icon={<CalendarToday color="primary" />}
          />
        )}
        {undergroundType && (
          <Property
            label={formatMessage({ id: 'Underground type' })}
            value={undergroundType}
            icon={<Category color="primary" />}
          />
        )}
        {isDivingCave && (
          <Property
            value={formatMessage({
              id: 'Diving cave'
            })}
            icon={<Waves color="primary" />}
            secondary
          />
        )}
      </Box>

      <Property
        label={formatMessage({ id: 'Average rating' })}
        icon={<EmptyStarIcon fontSize="large" color="primary" />}
      />
      <SmallRatingsWrapper>
        <Ratings
          access={access}
          interest={interest}
          progression={progression}
        />
      </SmallRatingsWrapper>
    </GlobalWrapper>
  );
};

export default Properties;
